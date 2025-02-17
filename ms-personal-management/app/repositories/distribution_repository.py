from sqlalchemy.orm import Session
from app.models import Distribution,Expense,Savings,ExpenseUser,User,Income
from app.schemas import DistributionCreate
from datetime import datetime
from sqlalchemy.sql import func
from fastapi import  HTTPException
from sqlalchemy import  and_, case, func

def calcular_devoluciones(final_exp_amount: dict[str, float]) -> list[dict]:
    """
    Recibe un diccionario con { nombre_usuario: monto_pagado, ... }
    Devuelve una lista de transacciones (quién paga a quién y cuánto)
    para que todos terminen pagando la misma cantidad.
    """

    # 1. Listar usuarios y suma total
    usuarios = list(final_exp_amount.keys())
    total = sum(final_exp_amount.values())

    # 2. Calcular el promedio (lo que cada uno debería haber gastado)
    avg = total / len(usuarios)

    # 3. Crear listas separadas para deudores (diff < 0) y acreedores (diff > 0)
    deudores = []
    acreedores = []

    for user in usuarios:
        diff = final_exp_amount[user] - avg
        if abs(diff) < 1e-9:
            continue  # Si está casi en 0, se ignora
        if diff > 0:
            acreedores.append({"user": user, "diff": diff})
        else:
            deudores.append({"user": user, "diff": abs(diff)})  # se guarda en positivo

    # 4. Generar la lista de devoluciones
    devoluciones = []
    i, j = 0, 0

    while i < len(deudores) and j < len(acreedores):
        deudor = deudores[i]
        acreedor = acreedores[j]

        # Cantidad a transferir es el mínimo de ambos
        monto = min(deudor["diff"], acreedor["diff"])

        # Agregamos la transacción
        devoluciones.append({
            "from": deudor["user"],
            "to": acreedor["user"],
            "amount": round(monto, 2)
        })

        # Actualizamos diffs
        deudor["diff"] -= monto
        acreedor["diff"] -= monto

        # Si el deudor ya no debe nada, pasa al siguiente
        if abs(deudor["diff"]) < 1e-9:
            i += 1

        # Si el acreedor ya cobró todo, pasa al siguiente
        if abs(acreedor["diff"]) < 1e-9:
            j += 1

    return devoluciones

def ajustar_excedentes_con_devoluciones(distribution_data, devoluciones):
    """
    distribution_data: lista de filas [{'id':..., 'account':..., 'values': {...}}, ...]
    devoluciones: lista de transacciones de calcular_devoluciones,
                  cada item: {'from': X, 'to': Y, 'amount': M}
    Modifica la fila de 'Excedentes' en distribution_data
    según esas transacciones.
    """
    # 1. Localizar la fila "Excedentes"
    excedentes_row = None
    for row in distribution_data:
        if row["account"] == "Excedentes":
            excedentes_row = row
            break

    if not excedentes_row:
        # Si no hay fila Excedentes, no hay nada que ajustar
        return distribution_data

    # 2. Ajustar valores
    ex_values = excedentes_row["values"]

    for trans in devoluciones:
        user_from = trans["from"]
        user_to = trans["to"]
        amount = trans["amount"]

        ex_from = float(ex_values[user_from].replace("€", "").strip())
        ex_to = float(ex_values[user_to].replace("€", "").strip())

        ex_from -= amount
        ex_to += amount

        ex_values[user_from] = f"{ex_from:.2f} €"
        ex_values[user_to] = f"{ex_to:.2f} €"

    # 3. Recalcular el total
    total_excedente = 0.0
    for user, val_str in ex_values.items():
        if user != "total":
            val = float(val_str.replace("€", "").strip())
            total_excedente += val

    ex_values["total"] = f"{total_excedente:.2f} €"

    return distribution_data


def calculate_distribution(db: Session, month: str, year: str):
    # 1. Expresión para el total de gastos según sea compartido o no
    # 1️⃣ Definir la expresión de suma según is_shared
    sum_expr = case(
        (Expense.is_shared.is_(False), Expense.amount),
        else_=(Expense.amount * (ExpenseUser.share_percentage / 100))
    )

    # 2️⃣ Determinar el usuario a quien se asigna
    #    - Si hay User.name (gasto compartido), úsalo
    #    - Si no, usar Expense.payer (gasto individual)
    user_expr = func.coalesce(User.name, Expense.payer).label("user_name")

    expenses_by_account = (
        db.query(
            Expense.account,
            user_expr,
            func.sum(sum_expr).label("total_expenses"),
        )
        .outerjoin(
            ExpenseUser,
            and_(
                Expense.id == ExpenseUser.expense_id,
                Expense.is_shared == True  # ✅ Se une solo si el gasto es compartido
            )
        )
        .outerjoin(User, ExpenseUser.user_id == User.id)
        .filter(Expense.month == month, Expense.year == year)
        .group_by(Expense.account, user_expr)  # ✅ Volvemos al agrupamiento original
        .all()
    )
    
    expenses_shared_by_user = (
        db.query(
            user_expr,
            func.sum(sum_expr).label("total_shared_expenses")
        )
        .join(
            ExpenseUser, Expense.id == ExpenseUser.expense_id  # ✅ Solo se une si hay un ExpenseUser (significa que es compartido)
        )
        .join(User, ExpenseUser.user_id == User.id)
        .filter(
            Expense.is_shared == True,  # ✅ Solo consideramos los gastos compartidos
            Expense.month == month,
            Expense.year == year
        )
        .group_by(user_expr)  # ✅ Agrupamos solo por usuario
        .all()
    )

    # 4. Siguiente, obtener los ahorros
    savings_by_account = (
        db.query(
            Savings.account.label("account"),
            Savings.owner.label("owner"),
            func.sum(Savings.amount).label("total_savings")
        )
        .filter(Savings.month == month, Savings.year == year)
        .group_by(Savings.account, Savings.owner)
        .all()
    )


    # 5. Convertir en diccionarios
    # ▪ expenses_dict[account][user] = monto
    users = [u.name for u in db.query(User).all()]  # Todos los usuarios registrados

    expenses_dict = {}
    final_exp_amount = {}
    for row in expenses_shared_by_user:
        user_es   = row.user_name
        total     = row.total_shared_expenses
        
        # Verifica si el usuario ya está en el diccionario
        if user_es not in final_exp_amount:
            final_exp_amount[user_es] = 0.0
        final_exp_amount[user_es] += total 
    
    for row in expenses_by_account:
        account   = row.account
        user_nm   = row.user_name
        total     = row.total_expenses
        
        if account not in expenses_dict:
            # Inicializa con "0.00" a todos los usuarios
            expenses_dict[account] = {usr: "0.00" for usr in users}
        # Asigna el total a user_nm
        expenses_dict[account][user_nm] = f"{total:.2f} €"



    # ▪ savings_dict[account][owner] = total_savings
    savings_dict = {}
    for row in savings_by_account:
        account = row.account
        owner   = row.owner
        total_savings = row.total_savings

        if account not in savings_dict:
            savings_dict[account] = {usr: "0.00" for usr in users}

        savings_dict[account][owner] = f"{total_savings:.2f} €"

    # 6. Unir los datos de expenses_dict y savings_dict por cuenta y usuario
    all_accounts = set(expenses_dict.keys()).union(set(savings_dict.keys()))
    
    distribution_data = []
    user_total_expenses = {user: 0.0 for user in users}
    for idx, account in enumerate(all_accounts):
        row_data = {
            "id": str(idx),
            "account": account,
            "values": {}
        }
        for user in users:
            # Sumar gasto + ahorro
            exp_amount = float(expenses_dict.get(account, {}).get(user, "0.00").replace("€", "").strip())
            sav_amount = float(savings_dict.get(account, {}).get(user, "0.00").replace("€", "").strip())
            total_user = exp_amount + sav_amount
            row_data["values"][user] = f"{total_user:.2f} €"
            user_total_expenses[user] += total_user

        # Cálculo del total por cuenta (sumando todos los usuarios)
        row_data["values"]["total"] = f"{sum(float(row_data['values'][u].replace('€', '').strip()) for u in users):.2f} €"

        distribution_data.append(row_data)

    # 7. Ingresos totales por usuario (Income)
    incomes_data = {user: 0.0 for user in users}
    incomes = db.query(Income).filter(Income.month == month, Income.year == year).all()
    for inc in incomes:
        incomes_data[inc.owner] += inc.amount

    # 8. Agregar fila de "Total"
    total_row = {
        "id": str(len(distribution_data)),
        "account": "Total",
        "values": {}
    }
    for user in users:
        # Sumar el user_total_expenses que acumulamos
        total_row["values"][user] = f"{user_total_expenses[user]:.2f} €"
    total_row["values"]["total"] = f"{sum(user_total_expenses[user] for user in users):.2f} €"
    distribution_data.append(total_row)

    # 9. Agregar fila de "Excedentes"
    # Excedente = Ingreso - Gasto
    excedente_row = {
        "id": str(len(distribution_data) + 1),
        "account": "Excedentes",
        "values": {}
    }
    
    dev = calcular_devoluciones(final_exp_amount)
    
    for user in users:
        excedente = incomes_data[user] - user_total_expenses[user]
        excedente_row["values"][user] = f"{excedente:.2f} €"
    excedente_row["values"]["total"] = f"{sum(float(excedente_row['values'][u].replace('€','').strip()) for u in users):.2f} €"
    
    distribution_data.append(excedente_row)
    
    distribution_data = ajustar_excedentes_con_devoluciones(distribution_data, dev) 
    
    # 10. Agregar fila de "Devolucion".
    
    devoluciones_row = {
        "id": str(len(distribution_data) + 1),
        "account": "Devoluciones",
        "values": { user: "" for user in users }  # cada usuario inicia con ""
    }

    for trans in dev:
        user_from = trans["from"]   # p.e. "Adrian"
        user_to = trans["to"]       # p.e. "Mari"
        amount = trans["amount"]    # p.e. 347.17

        # Agregar al string del usuario que paga
        devoluciones_row["values"][user_from] += f"{amount:.2f} => {user_to}; "

   
    distribution_data.append(devoluciones_row)
    
    return distribution_data



def create_salary_distribution(db: Session, distribution: DistributionCreate):
    db_distribution = Distribution(**distribution.dict())
    db.add(db_distribution)
    db.commit()
    db.refresh(db_distribution)
    return db_distribution

def delete_salary_distribution(db: Session, distribution_id: int):
    db_distribution = db.query(Distribution).filter(Distribution.id == distribution_id).first()
    if db_distribution:
        db.delete(db_distribution)
        db.commit()
    return db_distribution
MONTHS_ES = {
    "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6,
    "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12
}
def get_last_month_year(db: Session):
    """Obtiene el último mes y año disponible en la base de datos."""
    # Crear la estructura CASE para ordenar correctamente los meses
    month_order = case(*[(Income.month == month, value) for month, value in MONTHS_ES.items()])

    last_income = db.query(Income).order_by(Income.year.desc(), month_order.desc()).first()
    last_expense = db.query(Expense).order_by(Expense.year.desc(), case(*[(Expense.month == month, value) for month, value in MONTHS_ES.items()]).desc()).first()
    last_saving = db.query(Savings).order_by(Savings.year.desc(), case(*[(Savings.month == month, value) for month, value in MONTHS_ES.items()]).desc()).first()


    # Filtrar los registros válidos
    all_dates = [last_income, last_expense, last_saving]
    valid_dates = [d for d in all_dates if d is not None]

    if not valid_dates:
        return None, None  # No hay datos en la BD

    # Convertir los meses a números antes de comparar
    latest_entry = max(valid_dates, key=lambda x: (x.year, MONTHS_ES.get(x.month, 0)))
    return latest_entry.month, latest_entry.year

def copy_expense_users(db: Session, old_to_new_mapping: dict[int, int]):
    """
    Copia los ExpenseUser cuyo expense_id está en old_to_new_mapping,
    asignando el expense_id nuevo.
    """
    if not old_to_new_mapping:
        return

    # Obtener todos los ExpenseUser de esos expense_id viejos
    old_ids = list(old_to_new_mapping.keys())
    old_eu_rows = db.query(ExpenseUser).filter(ExpenseUser.expense_id.in_(old_ids)).all()

    for old_eu in old_eu_rows:
        new_eu = ExpenseUser(
            expense_id = old_to_new_mapping[old_eu.expense_id],
            user_id = old_eu.user_id,
            share_percentage = old_eu.share_percentage
        )
        db.add(new_eu)

def copy_expenses_with_mapping(db: Session, last_month: str, last_year: str, new_month: str, new_year: str):
    """
    Retorna un diccionario old_expense_id -> new_expense_id
    """
    old_to_new = {}
    old_expenses = db.query(Expense).filter(
        Expense.month == last_month, 
        Expense.year == last_year
    ).all()

    for old_row in old_expenses:
        # Crear una copia
        new_row = Expense(**{
            c.name: getattr(old_row, c.name)
            for c in old_row.__table__.columns
            if c.name not in ["id", "month", "year"]
        })
        new_row.month = new_month
        new_row.year = new_year
        db.add(new_row)
        db.flush()  # Asigna un ID al new_row

        old_to_new[old_row.id] = new_row.id

    return old_to_new

def copy_table(db: Session, model, last_month: str, last_year: str, new_month: str, new_year: str):
    """
    Copia todos los registros de 'model' (por ejemplo Income o Savings),
    tomando aquellos con (month=last_month, year=last_year) y generando
    nuevos registros con (month=new_month, year=new_year).
    
    No copia la columna 'id', ya que se generará un nuevo ID.
    """
    old_rows = (
        db.query(model)
        .filter(model.month == last_month, model.year == last_year)
        .all()
    )

    for old_row in old_rows:
        # Crear una copia de la instancia, omitiendo 'id', 'month' y 'year'
        new_row = model(
            **{
                c.name: getattr(old_row, c.name)
                for c in old_row.__table__.columns
                if c.name not in ["id", "month", "year"]
            }
        )
        new_row.month = new_month
        new_row.year = new_year
        db.add(new_row)

    # No hacemos db.commit() aquí. Mejor commitear al final, en la función principal
         
def import_last_month(db: Session, new_month: str, new_year: str):
    last_month, last_year = get_last_month_year(db)
    if not last_month or not last_year:
        raise HTTPException(status_code=404, detail="No hay datos previos para importar")

    # 1. Copiar Income y Savings tal cual
    #    (asumiendo tu función copy_table() para ello)
    copy_table(db, Income, last_month, last_year, new_month, new_year)
    copy_table(db, Savings, last_month, last_year, new_month, new_year)

    # 2. Copiar Expense y generar el mapeo de IDs viejos->nuevos
    old_to_new = copy_expenses_with_mapping(db, last_month, last_year, new_month, new_year)

    # 3. Usar ese mapeo para copiar ExpenseUser
    copy_expense_users(db, old_to_new)

    db.commit()
    return {"message": "Datos importados correctamente"}

