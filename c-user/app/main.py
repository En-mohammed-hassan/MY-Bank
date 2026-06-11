from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import auth, customers, health
from app.core.cors import setup_cors
from app.db.base import Base
from app.db.session import engine

from app.models import customer_profile  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="C User Service",
    description="Retail customer user management for the Agentic Banking OS (mirrors b-user for customers)",
    version="1.0.0",
    lifespan=lifespan,
)

setup_cors(app)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(customers.router)
