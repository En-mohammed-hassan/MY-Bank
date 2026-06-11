from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.api.routes import accounts, customers, health, seed, transfers
from app.core.auth import get_current_user
from app.core.cors import setup_cors
from app.db.base import Base
from app.db.session import engine

# Import models so metadata is registered
from app.models import account, customer, hold, transaction, transfer  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Core Banking Simulator",
    description="Canonical core banking simulator for adapter training and integration testing",
    version="1.0.0",
    lifespan=lifespan,
)

setup_cors(app)

_core_auth = [Depends(get_current_user)]

app.include_router(health.router)
app.include_router(seed.router, dependencies=_core_auth)
app.include_router(customers.router, dependencies=_core_auth)
app.include_router(accounts.router, dependencies=_core_auth)
app.include_router(transfers.router, dependencies=_core_auth)
