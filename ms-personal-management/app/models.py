from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "personal_management"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # 🔹 Agregamos unique=True
    email = Column(String, unique=True, nullable=False)


class Savings(Base):
    __tablename__ = "savings"
    __table_args__ = {"schema": "personal_management"}

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    account = Column(String, nullable=False)
    owner = Column(String, ForeignKey("personal_management.users.name"))
    month = Column(String, nullable=False)
    year = Column(String, nullable=False)


class Income(Base):
    __tablename__ = "income"
    __table_args__ = {"schema": "personal_management"}

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    owner = Column(String, ForeignKey("personal_management.users.name"))
    month = Column(String, nullable=False)
    year = Column(String, nullable=False)


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = {"schema": "personal_management"}

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    account = Column(String, nullable=False)
    is_shared = Column(Boolean, default=False)
    payer = Column(String, nullable=False)
    is_quota = Column(Boolean, default=False)
    current_quota = Column(Integer, nullable=True)
    total_quotas = Column(Integer, nullable=True)

    month = Column(String, nullable=False)
    year = Column(String, nullable=False)

    shared_users = relationship("ExpenseUser", back_populates="expense", cascade="all, delete-orphan", lazy="joined")


class ExpenseUser(Base):
    __tablename__ = "expense_users"
    __table_args__ = {"schema": "personal_management"}

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("personal_management.expenses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("personal_management.users.id"), nullable=False)
    share_percentage = Column(Float, nullable=False)

    expense = relationship("Expense", back_populates="shared_users")


class Distribution(Base):
    __tablename__ = "distribution"
    __table_args__ = {"schema": "personal_management"}

    id = Column(Integer, primary_key=True, index=True)
    account = Column(String, nullable=False)
    month = Column(String, nullable=False)
    year = Column(String, nullable=False)
    owner = Column(String, ForeignKey("personal_management.users.name"))
    amount = Column(Float, nullable=False)
