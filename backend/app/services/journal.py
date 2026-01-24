from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from typing import List
from decimal import Decimal

from app import models, schemas, crud

class JournalEntryLine(schemas.BaseModel):
    account_id: int
    debit: Decimal = Decimal(0.0)
    credit: Decimal = Decimal(0.0)

class JournalEntryCreate(schemas.BaseModel):
    entry_date: date
    description: str
    lines: List[JournalEntryLine]

def create_journal_entry(db: Session, journal_entry: JournalEntryCreate):
    """
    Creates a new manual journal entry, ensuring it is balanced.
    """
    total_debit = sum(line.debit for line in journal_entry.lines)
    total_credit = sum(line.credit for line in journal_entry.lines)

    if total_debit != total_credit:
        raise HTTPException(
            status_code=400, 
            detail=f"Journal entry is not balanced. Debits ({total_debit}) must equal credits ({total_credit})."
        )
    
    if total_debit == 0:
        raise HTTPException(status_code=400, detail="Journal entry must have a non-zero debit/credit amount.")

    # Use a common source_id for all lines in this manual entry
    # A simple way is to create a placeholder source record or use a sequence
    # For now, we'll create a placeholder journal entry record to link them.
    # A better approach might be a dedicated JournalEntry header table.
    
    db_entries = []
    for line in journal_entry.lines:
        if line.debit == 0 and line.credit == 0:
            continue # Skip empty lines
            
        ledger_entry_schema = schemas.GeneralLedgerCreate(
            entry_date=journal_entry.entry_date,
            account_id=line.account_id,
            debit=line.debit,
            credit=line.credit,
            description=journal_entry.description
        )
        # We'll use a placeholder source_type and a temporary id, this should be improved
        db_entry = crud.create_ledger_entry(db, entry=ledger_entry_schema, source_type='JOURNAL', source_id=0)
        db_entries.append(db_entry)
        
        # Update balances
        balance_change = line.debit - line.credit
        crud.update_account_balance(db, account_id=line.account_id, amount=balance_change)

    db.commit()
    # db.refresh() is not straightforward for a list, returning the input for now
    return journal_entry
