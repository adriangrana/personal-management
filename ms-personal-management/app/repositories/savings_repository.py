from sqlalchemy.orm import Session
from app.models import Savings
from app.schemas import SavingsCreate

def get_savings(db: Session, month: str, year: str):
    return db.query(Savings).filter(Savings.month == month, Savings.year == year).all()

def create_savings(db: Session, savings: SavingsCreate):
    db_savings = Savings(**savings.dict())
    db.add(db_savings)
    db.commit()
    db.refresh(db_savings)
    return db_savings

def delete_savings(db: Session, savings_id: int):
    db_savings = db.query(Savings).filter(Savings.id == savings_id).first()
    if db_savings:
        db.delete(db_savings)
        db.commit()
    return db_savings
