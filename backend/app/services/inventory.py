from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Inventory, InventoryBatch, Crop
from datetime import date
from decimal import Decimal

def get_inventory_summary(db: Session):
    """Get all inventory items with their current stock and average cost."""
    return db.query(Inventory).all()

def add_stock_batch(
    db: Session, 
    crop_id: int, 
    quantity_kg: Decimal, # This is NET REFERENCE WEIGHT (Financial)
    cost_per_kg: Decimal, 
    purchase_date: date,
    purchase_id: int = None,
    supplier_id: int = None,
    expiry_date: date = None,
    notes: str = None,
    # New Fields
    gross_quantity_kg: Decimal = Decimal(0), # Physical Weight
    bag_count: int = 0
):
    """
    Add a new stock batch and update the main inventory aggregate.
    """
    # 1. Create Batch
    batch = InventoryBatch(
        crop_id=crop_id,
        purchase_id=purchase_id,
        quantity_kg=quantity_kg, # Net Reference
        original_quantity_kg=quantity_kg, # Net Reference
        gross_quantity_kg=gross_quantity_kg, # Physical
        bag_count=bag_count,
        cost_per_kg=cost_per_kg,
        purchase_date=purchase_date,
        expiry_date=expiry_date,
        supplier_id=supplier_id,
        notes=notes,
        is_active=True
    )
    db.add(batch)
    
    # 2. Update or Create Inventory Aggregate
    inventory = db.query(Inventory).filter(Inventory.crop_id == crop_id).first()
    if not inventory:
        inventory = Inventory(
            crop_id=crop_id,
            current_stock_kg=Decimal(0.0), # Will mirror net_stock_kg for compatibility
            average_cost_per_kg=Decimal(0.0),
            gross_stock_kg=Decimal(0.0),
            net_stock_kg=Decimal(0.0),
            bag_count=0
        )
        db.add(inventory)
    
    # Recalculate Weighted Average Cost (Using NET REFERENCE WEIGHT)
    # New Total Value = (Old Net Stock * Old Avg) + (New Batch Net * New Cost)
    # New Total Qty = Old Net Stock + New Batch Net
    
    current_net = inventory.net_stock_kg
    current_avg = inventory.average_cost_per_kg
    
    total_value = (current_net * current_avg) + (quantity_kg * cost_per_kg)
    new_total_net = current_net + quantity_kg
    
    # Update Fields
    inventory.net_stock_kg = new_total_net
    inventory.current_stock_kg = new_total_net # Keep aligned
    
    # Update Physical Fields
    inventory.gross_stock_kg += gross_quantity_kg
    inventory.bag_count += bag_count

    if new_total_net > 0:
        inventory.average_cost_per_kg = total_value / new_total_net
        
    db.commit()
    db.refresh(batch)
    return batch

def consume_stock(db: Session, crop_id: int, quantity_kg: Decimal):
    """
    Consume stock using FIFO (First-In, First-Out) strategy.
    Decreases quantity from oldest active batches.
    Updates the main inventory record.
    Returns list of (batch_id, quantity_taken, cost_per_kg) for cost validation.
    
    quantity_kg here is the NET REFERENCE WEIGHT derived from the Sale.
    """
    inventory = db.query(Inventory).filter(Inventory.crop_id == crop_id).first()
    if not inventory or inventory.net_stock_kg < quantity_kg:
        raise ValueError(f"Insufficient stock for crop {crop_id}. Available: {inventory.net_stock_kg if inventory else 0}")
    
    consumed_details = []
    remaining_qty_to_take = quantity_kg
    
    # Get active batches ordered by purchase_date (FIFO)
    batches = db.query(InventoryBatch).filter(
        InventoryBatch.crop_id == crop_id,
        InventoryBatch.is_active == True,
        InventoryBatch.quantity_kg > 0
    ).order_by(InventoryBatch.purchase_date.asc(), InventoryBatch.batch_id.asc()).all()
    
    for batch in batches:
        if remaining_qty_to_take <= 0:
            break
            
        take_qty = min(batch.quantity_kg, remaining_qty_to_take)
        
        batch.quantity_kg -= take_qty
        remaining_qty_to_take -= take_qty
        
        # Also reduce Gross proportionately? 
        # Logic: If we sell 'x' net, how much 'gross' is that?
        # It's hard to know exactly which physical bag was taken if mixed.
        # But specifically for accounting, we just reduce the 'financial' pile.
        # For 'physical' gross stock, we should ideally deduce it.
        # Approximation: Reduce gross_quantity_kg by ratio? 
        # Or, simpler: Just reduce Inventory aggregate gross/bag by what was sold 'physically' if tracked.
        # For now, let's update batch.
        
        consumed_details.append({
            "batch_id": batch.batch_id,
            "quantity_kg": take_qty,
            "cost_per_kg": batch.cost_per_kg
        })
        
        if batch.quantity_kg <= Decimal('0.0001'): # Decimal precision tolerance
            batch.is_active = False
            batch.quantity_kg = Decimal(0)
            
    if remaining_qty_to_take > Decimal('0.0001'):
        pass

    # Update Aggregate Financials
    inventory.net_stock_kg -= quantity_kg
    inventory.current_stock_kg -= quantity_kg
    
    # Update Aggregate Physicals (This part relies on Sale data)
    # The 'consume_stock' function is typically called with just NET quantity to calculate COGS.
    # To update Gross/Bags, we need those passed or handle them separately.
    # For now, we will handle Gross/Bag update in a separate call or here if passed.
    # Given the signature, we only have quantity_kg (Net).
    # We will assume caller handles Gross/Bag update on Inventory model directly if needed, or we expand this function.
    # Let's expand it.
    
    db.commit()
    return consumed_details

def reduce_physical_stock(db: Session, crop_id: int, gross_qty: Decimal, bag_count: int):
    """
    Helper to reduce physical stock attributes (Gross, Bags)
    """
    inventory = db.query(Inventory).filter(Inventory.crop_id == crop_id).first()
    if inventory:
        inventory.gross_stock_kg -= gross_qty
        inventory.bag_count -= bag_count
        db.commit()
