from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from typing import List
from decimal import Decimal

from app import models, schemas, crud

class JournalEntryLine(schemas.BaseModel):
    account_id: int
    debit: Decimal = Decimal(0)
    credit: Decimal = Decimal(0)

class JournalEntryCreate(schemas.BaseModel):
    entry_date: date
    description: str
    lines: List[JournalEntryLine]

def create_journal_entry(db: Session, journal_entry: JournalEntryCreate):
    """
    إنشاء قيد يومية يدوي متوازن.
    يستخدم AccountingEngine لضمان التوازن والدقة.
    """
    from app.services.accounting_engine import get_engine, LedgerEntry
    
    # Filter out empty lines
    active_lines = [l for l in journal_entry.lines if l.debit > 0 or l.credit > 0]
    
    if not active_lines:
        raise HTTPException(status_code=400, detail="القيد يجب أن يحتوي على سطر واحد على الأقل")
    
    entries = [
        LedgerEntry(
            account_id=line.account_id,
            debit=Decimal(str(line.debit)),
            credit=Decimal(str(line.credit)),
            description=journal_entry.description
        )
        for line in active_lines
    ]
    
    engine = get_engine(db)
    engine.create_balanced_entry(
        entries=entries,
        entry_date=journal_entry.entry_date,
        source_type='JOURNAL',
        source_id=0
    )

    db.commit()
    return journal_entry

