from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import FinancialSummary, HistoricalData
from app.repositories import financial_repository

router = APIRouter()

@router.get("/financial-summary", response_model=FinancialSummary)
def get_financial_summary(month: str, year: str, db: Session = Depends(get_db)):
    return financial_repository.get_financial_summary(db, month, year)

@router.get("/surplus-history", response_model=list[HistoricalData])
def get_surplus_history(db: Session = Depends(get_db)):
    return financial_repository.get_surplus_history(db)

@router.get("/expenses-history", response_model=list[HistoricalData])
def get_expenses_history(db: Session = Depends(get_db)):
    return financial_repository.get_expenses_history(db)

@router.get("/income-history", response_model=list[HistoricalData])
def get_income_history(db: Session = Depends(get_db)):
    return financial_repository.get_income_history(db)

