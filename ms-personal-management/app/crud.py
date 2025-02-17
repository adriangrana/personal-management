from sqlalchemy.orm import Session
from models import User, Savings
from schemas import UserCreate, SavingsCreate

# CRUD para usuarios
def get_users(db: Session):
    return db.query(User).all()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    db_user = User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# CRUD para ahorros
def get_savings(db: Session, month: str, year: str):
    return db.query(Savings).filter(Savings.month == month, Savings.year == year).all()

def create_savings(db: Session, savings: SavingsCreate):
    db_savings = Savings(**savings.dict())
    db.add(db_savings)
    db.commit()
    db.refresh(db_savings)
    return db_savings
