from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories import savings_repository
from app.schemas import SavingsCreate, SavingsResponse

router = APIRouter()

@router.get("/", response_model=list[SavingsResponse])
def get_savings(month: str, year: str, db: Session = Depends(get_db)):
    return savings_repository.get_savings(db, month, year)

@router.post("/", response_model=SavingsResponse)
def create_savings(savings: SavingsCreate, db: Session = Depends(get_db)):
    return savings_repository.create_savings(db, savings)

@router.delete("/{savings_id}")
def delete_savings(savings_id: int, db: Session = Depends(get_db)):
    deleted_savings = savings_repository.delete_savings(db, savings_id)
    if not deleted_savings:
        raise HTTPException(status_code=404, detail="Ahorro no encontrado")
    return {"message": "Ahorro eliminado"}

@router.put("/{savings_id}", response_model=SavingsResponse)
def update_savings(savings_id: int, savings: SavingsCreate, db: Session = Depends(get_db)):
    existing_savings = savings_repository.get_savings_by_id(db, savings_id)
    if not existing_savings:
        raise HTTPException(status_code=404, detail="Savings not found")
    
    return savings_repository.update_savings(db, savings_id, savings)