from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import decimal

# Configure Global Decimal Context
decimal.getcontext().rounding = decimal.ROUND_HALF_UP

from app.database import Base, engine, SessionLocal
# Import all models to ensure they are registered with SQLAlchemy
from app.models import Crop, Contact, FinancialAccount, Purchase, Inventory, GeneralLedger
from app.api.v1.api import api_router
from app.core.bootstrap import bootstrap_system
from app.services.backup import auto_backup_on_startup

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup
    db = SessionLocal()
    try:
        print("Bootstrapping system...")
        bootstrap_system(db)
        print("Bootstrap complete.")
        
        # Auto-backup on startup
        auto_backup_on_startup()
    finally:
        db.close()
    yield
    # On shutdown (if needed)

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# ... imports ...

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Agricultural Accounting API",
    description="API for the modern agricultural accounting application.",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS (Cross-Origin Resource Sharing) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.error_handling import setup_exception_handlers
setup_exception_handlers(app)

@app.get("/", tags=["Root"])
@limiter.limit("100/minute")
async def read_root(request: Request):
    return {"message": "Welcome to the Agricultural Accounting API"}

# Include the API router
app.include_router(api_router, prefix="/api/v1")
