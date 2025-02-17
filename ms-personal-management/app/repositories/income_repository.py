from sqlalchemy.orm import Session
from app.models import Income
from app.schemas import IncomeCreate

def get_incomes(db: Session, month: str, year: str):
    return db.query(Income).filter(Income.month == month, Income.year == year).all()

def create_income(db: Session, income: IncomeCreate):
    db_income = Income(**income.dict())
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

def delete_income(db: Session, income_id: int):
    db_income = db.query(Income).filter(Income.id == income_id).first()
    if db_income:
        db.delete(db_income)
        db.commit()
    return db_income
