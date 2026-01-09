"""
Seasons and Daily Prices CRUD Operations
"""
from sqlalchemy.orm import Session, joinedload
from app import models, schemas


# --- Season CRUD Functions ---

def get_seasons(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Season).order_by(models.Season.start_date.desc()).offset(skip).limit(limit).all()


def get_season(db: Session, season_id: int):
    return db.query(models.Season).filter(models.Season.season_id == season_id).first()


def create_season(db: Session, season: schemas.SeasonCreate) -> models.Season:
    db_season = models.Season(**season.model_dump())
    db.add(db_season)
    db.commit()
    db.refresh(db_season)
    return db_season


def update_season(db: Session, season_id: int, season_update: schemas.SeasonUpdate) -> models.Season:
    db_season = get_season(db, season_id)
    if db_season:
        update_data = season_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_season, key, value)
        db.commit()
        db.refresh(db_season)
    return db_season


def delete_season(db: Session, season_id: int) -> models.Season:
    db_season = get_season(db, season_id)
    if db_season:
        db.delete(db_season)
        db.commit()
    return db_season


# --- Daily Price CRUD Functions ---

def create_daily_price(db: Session, price: schemas.DailyPriceCreate) -> models.DailyPrice:
    db_price = models.DailyPrice(**price.model_dump())
    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price


def get_daily_prices(db: Session, crop_id: int = None, start_date=None, end_date=None, skip: int = 0, limit: int = 100):
    query = db.query(models.DailyPrice).options(joinedload(models.DailyPrice.crop))
    
    if crop_id:
        query = query.filter(models.DailyPrice.crop_id == crop_id)
    if start_date:
        query = query.filter(models.DailyPrice.price_date >= start_date)
    if end_date:
        query = query.filter(models.DailyPrice.price_date <= end_date)
    
    return query.order_by(models.DailyPrice.price_date.desc()).offset(skip).limit(limit).all()
