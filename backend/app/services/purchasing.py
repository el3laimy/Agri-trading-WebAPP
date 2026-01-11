from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal

from app import crud, schemas
from app.core.settings import get_setting
from app.core.calculation_formulas import calculate_purchase, CALCULATION_FORMULAS
from app.services import payments as payment_service

def create_new_purchase(db: Session, purchase: schemas.PurchaseCreate, user_id: int = None):
    """
    Creates a new purchase record and handles all related business logic:
    1. Calculates total cost using the appropriate formula.
    2. Updates inventory stock using Unified Net Weight for accurate costing.
    3. Creates double-entry general ledger records.
    4. Updates financial account balances.
    All within a single database transaction.
    """
    # Validate crop and supplier existence
    crop = crud.get_crop(db, purchase.crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"المحصول رقم {purchase.crop_id} غير موجود.")
    
    supplier = crud.get_contact(db, purchase.supplier_id)
    if not supplier or not supplier.is_supplier:
        raise HTTPException(status_code=404, detail=f"المورد رقم {purchase.supplier_id} غير موجود.")

    # Get values from request
    gross_qty = Decimal(purchase.gross_quantity) if purchase.gross_quantity else Decimal(purchase.quantity_kg)
    bag_count = purchase.bag_count if purchase.bag_count else 0
    tare_per_bag = Decimal(purchase.tare_weight / bag_count) if bag_count > 0 and purchase.tare_weight else Decimal(0)
    unit_price = Decimal(purchase.unit_price)
    
    # Determine formula and calculate
    formula_key = purchase.calculation_formula or 'kg'
    custom_factor = Decimal(purchase.custom_conversion_factor) if purchase.custom_conversion_factor else None
    
    # Check if this is a complex crop with formula
    if crop.is_complex_unit and formula_key in CALCULATION_FORMULAS:
        # Use calculate_purchase for complex crops
        calc_result = calculate_purchase(
            gross_weight=gross_qty,
            bag_count=bag_count,
            tare_per_bag=tare_per_bag,
            formula_key=formula_key,
            unit_price=unit_price,
            custom_factor=custom_factor
        )
        
        total_cost = calc_result['total_cost']
        net_weight_inventory = calc_result['net_weight_inventory']
        cost_per_kg_inventory = calc_result['cost_per_kg_inventory']
        apply_notional_tare = calc_result['apply_notional_tare']
        total_tare = calc_result['total_tare']
    else:
        # Simple crop: quantity_kg * unit_price
        quantity = Decimal(purchase.quantity_kg)
        total_cost = quantity * unit_price
        net_weight_inventory = quantity
        cost_per_kg_inventory = unit_price
        apply_notional_tare = False
        total_tare = Decimal(0)

    # Server-side Validation for Tare
    if total_tare >= gross_qty and total_tare > 0:
        raise HTTPException(status_code=400, detail="إجمالي العيار لا يمكن أن يكون أكبر من أو يساوي الوزن الإجمالي.")

    try:
        # 1. Create the purchase record first to get ID
        purchase_data = purchase.model_dump()
        purchase_data['total_cost'] = total_cost
        purchase_data['created_by'] = user_id
        purchase_data['gross_quantity'] = gross_qty
        purchase_data['tare_weight'] = total_tare
        # Initialize amount_paid to 0 so we can add the payment via create_payment without double counting
        purchase_data['amount_paid'] = 0
        db_purchase = crud.create_purchase_record(db, purchase_data=purchase_data)
        db.flush() # Flush to get the purchase_id

        # 2. Add Stock Batch (Updates Inventory Aggregate automatically)
        from app.services.inventory import add_stock_batch
        
        add_stock_batch(
            db=db,
            crop_id=purchase.crop_id,
            quantity_kg=net_weight_inventory,  # الوزن الصافي المرجعي للمخزن
            cost_per_kg=cost_per_kg_inventory,  # سعر الكيلو المحسوب للمخزن
            purchase_date=purchase.purchase_date,
            purchase_id=db_purchase.purchase_id,
            supplier_id=purchase.supplier_id,
            notes=purchase.notes,
            gross_quantity_kg=gross_qty,
            bag_count=bag_count
        )

        # Create General Ledger entries (Double-entry bookkeeping)
        # Detailed Description for Audit Trail
        formula_name = CALCULATION_FORMULAS.get(formula_key, {}).get('name_ar', 'كجم')
        ledger_description = f"شراء {net_weight_inventory} كجم {crop.crop_name} من المورد {supplier.name}"
        if bag_count:
            ledger_description += f" (عدد {bag_count} شيكارة)"
        
        # Get Account IDs
        inventory_id = int(get_setting(db, "INVENTORY_ACCOUNT_ID"))
        accounts_payable_id = int(get_setting(db, "ACCOUNTS_PAYABLE_ID"))

        # 1. Debit Inventory (increase in assets)
        debit_entry = schemas.GeneralLedgerCreate(
            entry_date=purchase.purchase_date,
            account_id=inventory_id,
            debit=total_cost,
            description=ledger_description
        )
        crud.create_ledger_entry(db, entry=debit_entry, source_type='PURCHASE', source_id=db_purchase.purchase_id, created_by=user_id)

        # 2. Credit Accounts Payable (increase in liabilities)
        credit_entry = schemas.GeneralLedgerCreate(
            entry_date=purchase.purchase_date,
            account_id=accounts_payable_id,
            credit=total_cost,
            description=ledger_description
        )
        crud.create_ledger_entry(db, entry=credit_entry, source_type='PURCHASE', source_id=db_purchase.purchase_id, created_by=user_id)

        # Update account balances
        crud.update_account_balance(db, account_id=inventory_id, amount=total_cost)
        crud.update_account_balance(db, account_id=accounts_payable_id, amount=total_cost)

        db.commit()
        db.refresh(db_purchase)

        # Handle immediate payment if provided
        if purchase.amount_paid and purchase.amount_paid > 0:
            payment_amount = Decimal(purchase.amount_paid)
            payment_data = schemas.PaymentCreate(
                payment_date=purchase.purchase_date,
                amount=payment_amount,
                contact_id=purchase.supplier_id,
                payment_method='Cash', # Default to Cash
                credit_account_id=int(get_setting(db, "CASH_ACCOUNT_ID")),
                debit_account_id=accounts_payable_id,
                transaction_type='PURCHASE',
                transaction_id=db_purchase.purchase_id
            )
            payment_service.create_payment(db, payment_data, user_id=user_id)
            db.refresh(db_purchase)

        return db_purchase

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تسجيل العملية: {e}")

