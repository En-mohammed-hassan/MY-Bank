from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.seed_service import seed_demo_data

router = APIRouter(prefix="/core", tags=["seed"])


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)) -> dict:
    return seed_demo_data(db)
