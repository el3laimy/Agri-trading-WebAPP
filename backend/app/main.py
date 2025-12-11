from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import Base, engine, SessionLocal
# Import all models to ensure they are registered with SQLAlchemy
from app.models import Crop, Contact, FinancialAccount, Purchase, Inventory, GeneralLedger
from app.api.v1.api import api_router
from app.core.bootstrap import bootstrap_financial_accounts

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup
    db = SessionLocal()
    try:
        print("Bootstrapping financial accounts...")
        bootstrap_financial_accounts(db)
        print("Bootstrap complete.")
    finally:
        db.close()
    yield
    # On shutdown (if needed)

app = FastAPI(
    title="Agricultural Accounting API",
    description="API for the modern agricultural accounting application.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS (Cross-Origin Resource Sharing) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Agricultural Accounting API"}

# Include the API router
app.include_router(api_router, prefix="/api/v1")