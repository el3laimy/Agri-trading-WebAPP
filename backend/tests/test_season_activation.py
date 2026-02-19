
import pytest
from datetime import date, timedelta
from app import models, crud
from app.crud import seasons as seasons_crud

def test_activate_season_logic(db_session):
    # 1. Create two seasons
    # Season 1: Currently OPEN/ACTIVE
    season1 = models.Season(
        name="Season 1",
        start_date=date(2023, 1, 1),
        end_date=date(2023, 3, 31),
        status="ACTIVE",
        description="First Season"
    )
    db_session.add(season1)
    
    # Season 2: UPCOMING
    season2 = models.Season(
        name="Season 2",
        start_date=date(2023, 4, 1),
        end_date=date(2023, 6, 30),
        status="UPCOMING",
        description="Second Season"
    )
    db_session.add(season2)
    db_session.commit()
    
    db_session.refresh(season1)
    db_session.refresh(season2)
    
    # Verify initial state
    assert season1.status == "ACTIVE"
    assert season2.status == "UPCOMING"
    
    # 2. Activate Season 2
    updated_season2 = seasons_crud.activate_season(db_session, season2.season_id)
    
    # 3. Verify results
    db_session.refresh(season1)
    db_session.refresh(season2)
    
    # Season 2 should be ACTIVE
    assert updated_season2.season_id == season2.season_id
    assert season2.status == "ACTIVE"
    
    # Season 1 should be COMPLETED (because it was ACTIVE)
    assert season1.status == "COMPLETED"

def test_activate_season_idempotent(db_session):
    # Test activating an already active season
    season = models.Season(
        name="Season Active",
        start_date=date(2023, 1, 1),
        end_date=date(2023, 3, 31),
        status="ACTIVE"
    )
    db_session.add(season)
    db_session.commit()
    
    seasons_crud.activate_season(db_session, season.season_id)
    db_session.refresh(season)
    
    assert season.status == "ACTIVE"
