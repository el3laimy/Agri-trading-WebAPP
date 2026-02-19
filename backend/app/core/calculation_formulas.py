"""
صيغ الحساب المعرفة مسبقاً للمحاصيل المعقدة
Calculation Formulas for Complex Crops (Cotton, Seeds, etc.)
"""
from decimal import Decimal
from typing import Dict, Optional

# صيغ الحساب المتاحة
CALCULATION_FORMULAS: Dict[str, dict] = {
    "qantar_baladi": {
        "name_ar": "قنطار بلدي",
        "name_en": "Local Qantar",
        "factor": Decimal("160.0"),
        "apply_tare_to_invoice": False,  # الفاتورة بدون خصم عيار
        "apply_notional_tare": True,     # المخزن يستخدم عيار اعتباري
        "description_ar": "الوزن ÷ 160 × السعر (بدون خصم عيار)",
        "description_en": "Weight / 160 × Price (no tare deduction)"
    },
    "qantar_government": {
        "name_ar": "قنطار حكومي",
        "name_en": "Government Qantar",
        "factor": Decimal("157.5"),
        "apply_tare_to_invoice": True,   # الفاتورة بخصم العيار
        "apply_notional_tare": False,    # المخزن بنفس القيمة
        "description_ar": "(الوزن - العيار) ÷ 157.5 × السعر",
        "description_en": "(Weight - Tare) / 157.5 × Price"
    },
    "ton": {
        "name_ar": "طن",
        "name_en": "Ton",
        "factor": Decimal("1000.0"),
        "apply_tare_to_invoice": False,
        "apply_notional_tare": False,
        "description_ar": "الوزن ÷ 1000 × السعر",
        "description_en": "Weight / 1000 × Price"
    },
    "kg": {
        "name_ar": "كيلوجرام",
        "name_en": "Kilogram",
        "factor": Decimal("1.0"),
        "apply_tare_to_invoice": False,
        "apply_notional_tare": False,
        "description_ar": "الوزن × السعر",
        "description_en": "Weight × Price"
    }
}


def calculate_purchase(
    gross_weight: Decimal,
    bag_count: int,
    tare_per_bag: Decimal,
    formula_key: str,
    unit_price: Decimal,
    custom_factor: Optional[Decimal] = None
) -> dict:
    """
    حساب تفاصيل عملية الشراء
    
    Args:
        gross_weight: الوزن القائم (الإجمالي)
        bag_count: عدد الأكياس
        tare_per_bag: العيار لكل كيس (يدخله المستخدم)
        formula_key: مفتاح صيغة الحساب
        unit_price: سعر الوحدة
        custom_factor: معامل تحويل مخصص (اختياري)
    
    Returns:
        dict: {
            "total_tare": إجمالي العيار,
            "net_weight_invoice": الوزن الصافي للفاتورة,
            "net_weight_inventory": الوزن الصافي المرجعي للمخزن,
            "conversion_factor": معامل التحويل المستخدم,
            "quantity_in_unit": الكمية بالوحدة (للفاتورة),
            "total_cost": التكلفة الإجمالية (للفاتورة),
            "cost_per_kg_inventory": سعر الكيلو للمخزن
        }
    """
    formula = CALCULATION_FORMULAS.get(formula_key)
    if not formula:
        raise ValueError(f"صيغة الحساب غير معروفة: {formula_key}")
    
    # حساب إجمالي العيار
    total_tare = Decimal(bag_count) * tare_per_bag
    
    # معامل التحويل
    factor = custom_factor if custom_factor else formula["factor"]
    
    # حساب الفاتورة
    if formula["apply_tare_to_invoice"]:
        # حكومي: خصم العيار من الفاتورة
        net_weight_invoice = gross_weight - total_tare
    else:
        # بلدي: الفاتورة بالوزن الإجمالي
        net_weight_invoice = gross_weight
    
    quantity_in_unit = net_weight_invoice / factor
    total_cost = quantity_in_unit * unit_price
    
    # حساب المخزون (الوزن الصافي المرجعي)
    if formula["apply_notional_tare"]:
        # بلدي: استخدام عيار اعتباري للمخزن
        net_weight_inventory = gross_weight - total_tare
    else:
        # حكومي أو عادي: استخدام نفس الوزن الصافي
        net_weight_inventory = net_weight_invoice
    
    # سعر الكيلو للمخزن (حسب الوزن الصافي المرجعي)
    if net_weight_inventory > 0:
        cost_per_kg_inventory = total_cost / net_weight_inventory
    else:
        cost_per_kg_inventory = Decimal(0)
    
    return {
        "total_tare": total_tare,
        "net_weight_invoice": net_weight_invoice,
        "net_weight_inventory": net_weight_inventory,
        "conversion_factor": factor,
        "quantity_in_unit": quantity_in_unit,
        "total_cost": total_cost,
        "cost_per_kg_inventory": cost_per_kg_inventory,
        "formula_name_ar": formula["name_ar"],
        "apply_notional_tare": formula["apply_notional_tare"]
    }


def get_available_formulas() -> list:
    """
    إرجاع قائمة صيغ الحساب المتاحة للواجهة الأمامية
    """
    return [
        {
            "key": key,
            "name_ar": formula["name_ar"],
            "name_en": formula["name_en"],
            "factor": float(formula["factor"]),
            "apply_tare": formula["apply_tare_to_invoice"],
            "description_ar": formula["description_ar"]
        }
        for key, formula in CALCULATION_FORMULAS.items()
    ]
