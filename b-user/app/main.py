from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import bank_users, health
from app.db.base import Base
from app.db.session import engine

from app.models import bank_staff  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Bank User Service",
    description="Internal bank staff user management for the Agentic Banking OS",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(bank_users.router)
