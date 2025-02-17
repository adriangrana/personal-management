from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories import expense_repository
from app.schemas import ExpenseCreate, ExpenseResponse,  ExpenseUpdate

router = APIRouter()

@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(month: str, year: str, db: Session = Depends(get_db)):
    return expense_repository.get_expenses(db, month, year)

@router.post("/", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    return expense_repository.create_expense(db, expense)

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    deleted_expense = expense_repository.delete_expense(db, expense_id)
    if not deleted_expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Gasto eliminado"}

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense: ExpenseUpdate, db: Session = Depends(get_db)):
    """
    Endpoint para actualizar un gasto.
    """
    updated_expense = expense_repository.update_expense(db, expense_id, expense)  # ✅ LLAMAR AL MÉTODO DEL REPOSITORIO
    if not updated_expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    return updated_expense