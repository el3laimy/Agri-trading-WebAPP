from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.services import journal
from app.api.v1.endpoints.crops import get_db
from app.schemas import GeneralLedger

router = APIRouter()

@router.post("/journal-entries", response_model=journal.JournalEntryCreate)
def create_new_journal_entry(journal_entry: journal.JournalEntryCreate, db: Session = Depends(get_db)):
    """
    Create a new, balanced manual journal entry.
    """
    return journal.create_journal_entry(db=db, journal_entry=journal_entry)

@router.get("/journal-entries", response_model=List[GeneralLedger])
def read_journal_entries(db: Session = Depends(get_db)):
    """
    Retrieve all general ledger entries created manually via the journal.
    """
    # This is a simplified implementation. It should ideally fetch grouped entries.
    return db.query(models.GeneralLedger).filter(models.GeneralLedger.source_type == 'JOURNAL').all()
