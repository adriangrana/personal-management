from sqlalchemy.orm import Session,joinedload
from app.models import Expense, ExpenseUser, User
from app.schemas import ExpenseCreate, ExpenseUpdate

def get_expenses(db: Session, month: str, year: str):
    expenses = (
        db.query(Expense)
        .filter(Expense.month == month, Expense.year == year)
        .options(joinedload(Expense.shared_users))
        .all()
    )
    return expenses
 
def update_expense(db: Session, expense_id: int, expense_data: ExpenseUpdate):
    """
    Actualiza un gasto existente y sus usuarios compartidos.
    """
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    
    if not expense:
        return None  # Si el gasto no existe, devuelve None

    for key, value in expense_data.dict(exclude_unset=True).items():
        if key == "shared_users":  
            # 🔹 Borrar registros previos de shared_users y volver a crearlos
            db.query(ExpenseUser).filter(ExpenseUser.expense_id == expense.id).delete()
            db.commit()

            # 🔹 Crear nuevas instancias de ExpenseUser con expense_id asignado
            expense.shared_users = [
                ExpenseUser(expense_id=expense.id, user_id=user["user_id"], share_percentage=user["share_percentage"])
                for user in value
            ]
        else:
            setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return expense

def create_expense(db: Session, expense_data: ExpenseCreate):
    new_expense = Expense(
        description=expense_data.description,
        amount=expense_data.amount,
        account=expense_data.account,
        is_shared=expense_data.is_shared,
        is_quota=expense_data.is_quota,
        payer=expense_data.payer,
        current_quota=expense_data.current_quota,
        total_quotas=expense_data.total_quotas,
        month=expense_data.month,
        year=expense_data.year
    )
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    # ✅ Agregar los usuarios compartidos
    if expense_data.is_shared and expense_data.shared_users:
        shared_entries = [
            ExpenseUser(expense_id=new_expense.id, user_id=user.user_id, share_percentage=user.share_percentage)
            for user in expense_data.shared_users
        ]
        db.add_all(shared_entries)
        db.commit()

    return new_expense

def delete_expense(db: Session, expense_id: int):
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if db_expense:
        db.delete(db_expense)
        db.commit()
    return db_expense
