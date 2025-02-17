from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Income, Expense, Savings
from app.schemas import FinancialSummary, HistoricalData

# 🔹 Obtener el resumen financiero de un mes y año específicos
def get_financial_summary(db: Session, month: str, year: str) -> FinancialSummary:
    total_income = db.query(func.sum(Income.amount)).filter(Income.month == month, Income.year == year).scalar() or 0
    total_expenses = db.query(func.sum(Expense.amount)).filter(Expense.month == month, Expense.year == year).scalar() or 0
    total_savings = db.query(func.sum(Savings.amount)).filter(Savings.month == month, Savings.year == year).scalar() or 0
    surplus = total_income - total_expenses - total_savings  # Excedente

    return FinancialSummary(
        income=total_income,
        expenses=total_expenses,
        savings=total_savings,
        surplus=surplus
    )

# 🔹 Obtener la evolución histórica del excedente
def get_surplus_history(db: Session) -> list[HistoricalData]:
    results = db.query(Expense.year, Expense.month, 
                       (func.sum(Income.amount) - func.sum(Expense.amount) - func.sum(Savings.amount)).label("value")
                       ).join(Income, Income.month == Expense.month
                       ).join(Savings, Savings.month == Expense.month
                       ).group_by(Expense.year, Expense.month).all()

    return [HistoricalData(month=row.month, year=row.year, value=row.value or 0) for row in results]

# 🔹 Obtener la evolución histórica de los gastos
def get_expenses_history(db: Session) -> list[HistoricalData]:
    results = db.query(Expense.year, Expense.month, 
                       func.sum(Expense.amount).label("value")
                       ).group_by(Expense.year, Expense.month).all()

    return [HistoricalData(month=row.month, year=row.year, value=row.value or 0) for row in results]

# 🔹 Obtener la evolución histórica de los ingresos
def get_income_history(db: Session) -> list[HistoricalData]:
    results = db.query(Income.year, Income.month, 
                       func.sum(Income.amount).label("value")
                       ).group_by(Income.year, Income.month).all()

    return [HistoricalData(month=row.month, year=row.year, value=row.value or 0) for row in results]
