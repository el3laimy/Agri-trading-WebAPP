from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Inventory, InventoryBatch, Crop
from datetime import date

def get_inventory_summary(db: Session):
    """Get all inventory items with their current stock and average cost."""
    return db.query(Inventory).all()

def add_stock_batch(
    db: Session, 
    crop_id: int, 
    quantity_kg: float, 
    cost_per_kg: float, 
    purchase_date: date,
    purchase_id: int = None,
    supplier_id: int = None,
    expiry_date: date = None,
    notes: str = None
):
    """
    Add a new stock batch and update the main inventory aggregate.
    """
    # 1. Create Batch
    batch = InventoryBatch(
        crop_id=crop_id,
        purchase_id=purchase_id,
        quantity_kg=quantity_kg,
        original_quantity_kg=quantity_kg,
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
            current_stock_kg=0.0,
            average_cost_per_kg=0.0
        )
        db.add(inventory)
    
    # Recalculate Weighted Average Cost
    # New Total Value = (Old Stock * Old Avg) + (New Batch * New Cost)
    # New Total Qty = Old Stock + New Batch
    
    total_value = (inventory.current_stock_kg * inventory.average_cost_per_kg) + (quantity_kg * cost_per_kg)
    new_total_qty = inventory.current_stock_kg + quantity_kg
    
    inventory.current_stock_kg = new_total_qty
    if new_total_qty > 0:
        inventory.average_cost_per_kg = total_value / new_total_qty
        
    db.commit()
    db.refresh(batch)
    return batch

def consume_stock(db: Session, crop_id: int, quantity_kg: float):
    """
    Consume stock using FIFO (First-In, First-Out) strategy.
    Decreases quantity from oldest active batches.
    Updates the main inventory record.
    Returns list of (batch_id, quantity_taken, cost_per_kg) for cost validation.
    """
    inventory = db.query(Inventory).filter(Inventory.crop_id == crop_id).first()
    if not inventory or inventory.current_stock_kg < quantity_kg:
        raise ValueError(f"Insufficient stock for crop {crop_id}. Available: {inventory.current_stock_kg if inventory else 0}")
    
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
        
        consumed_details.append({
            "batch_id": batch.batch_id,
            "quantity_kg": take_qty,
            "cost_per_kg": batch.cost_per_kg
        })
        
        if batch.quantity_kg <= 0.001: # Float precision tolerance
            batch.is_active = False
            batch.quantity_kg = 0 # Clean up
            
    if remaining_qty_to_take > 0.001:
        # This shouldn't happen if inventory check passed, but just in case of data inconsistency
        # We might force consume from negative or raise error. 
        # For now, we updated batches physically found.
        pass

    # Update Aggregate
    inventory.current_stock_kg -= quantity_kg
    
    db.commit()
    return consumed_details
