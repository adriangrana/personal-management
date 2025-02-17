from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories import income_repository
from app.schemas import IncomeCreate, IncomeResponse

router = APIRouter()

@router.get("/", response_model=list[IncomeResponse])
def get_incomes(month: str, year: str, db: Session = Depends(get_db)):
    return income_repository.get_incomes(db, month, year)

@router.post("/", response_model=IncomeResponse)
def create_income(income: IncomeCreate, db: Session = Depends(get_db)):
    return income_repository.create_income(db, income)

@router.delete("/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db)):
    deleted_income = income_repository.delete_income(db, income_id)
    if not deleted_income:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return {"message": "Ingreso eliminado"}

@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(income_id: int, income: IncomeCreate, db: Session = Depends(get_db)):
    existing_income = income_repository.get_income_by_id(db, income_id)
    if not existing_income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    return income_repository.update_income(db, income_id, income)