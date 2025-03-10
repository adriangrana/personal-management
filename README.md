# Gestor Financiero

Este proyecto es un **Gestor Financiero** para administrar:
- Ingresos
- Gastos (compartidos o individuales)
- Ahorros
- Distribución mensual de salarios
- Cálculo de excedentes y balances
- Usuarios (para asignar gastos, ingresos, etc.)

El stack principal incluye:
- **Backend**: Python con [FastAPI](https://fastapi.tiangolo.com/) y SQLAlchemy
- **Frontend**: React + Webpack/Ant Design
- **Base de Datos**: PostgreSQL
- **Docker Compose** para orquestar servicios

---

## Tabla de Contenidos
1. [Características Principales](#características-principales)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Ejecución](#ejecución)
5. [Uso](#uso)
6. [Importar Mes Anterior](#importar-mes-anterior)
7. [Algoritmo de Devoluciones](#algoritmo-de-devoluciones)
8. [Notas Adicionales](#notas-adicionales)
9. [Licencia](#licencia)

---

## Características Principales
- **Gastos**:
  - Gastos individuales o compartidos (con `ExpenseUser`).
  - Cálculo de totales por cuenta y usuario.
- **Ingresos**:
  - Registros simples con asignación a un usuario.
- **Ahorros**:
  - Asignación de montos a distintas cuentas.
- **Distribución**:
  - Vista que muestra el desglose de gastos e ingresos por cada cuenta y usuario.
- **Excedentes**:
  - Calcula qué tanto sobra o falta a cada usuario.
- **Importar Mes Anterior**:
  - Copia registros de Ingresos, Gastos y Ahorros de un mes `X` a un mes `Y`.
- **Algoritmo de Devoluciones**:
  - Equilibra lo que cada usuario pagó de más o menos, generando un listado de transacciones para dejar las cuentas justas.

---

## Requisitos

1. **Python** 3.10+
2. **Node.js** 16+ y **npm** / **yarn**
3. **PostgreSQL** (opcional si usas Docker Compose)
4. **Docker** y **Docker Compose** (para el despliegue contenedorizado)

---

## Instalación

### Opción 1: Entorno Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/usuario/gestor-financiero.git
   cd gestor-financiero
   ```
2. **Backend** (FastAPI)
   - Instalar [Poetry](https://python-poetry.org/) o crear un virtualenv manualmente.
   - Instalar dependencias:
     ```bash
     poetry install
     ```
   - Ajustar variables de entorno (en `.env` por ejemplo):
     ```ini
     DATABASE_USER=personal_user
     DATABASE_PASSWORD=personal_pass
     DATABASE_HOST=localhost
     DATABASE_PORT=5432
     DATABASE_NAME=personal_management
     ```
3. **Frontend** (React)
   - Entrar a la carpeta `fe-personal-management`:
     ```bash
     cd fe-personal-management
     npm install  # o yarn
     ```
4. **Configurar PostgreSQL**:
   - Crear la base de datos `personal_management`.
   - Configurar usuario y contraseña (por defecto `personal_user`/`personal_pass`).

### Opción 2: Docker Compose

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/usuario/gestor-financiero.git
   cd gestor-financiero
   ```
2. **Levantar contenedores**:
   ```bash
   docker-compose up -d --build
   ```
   Esto iniciará:
   - `db`: contenedor de PostgreSQL
   - `backend`: contenedor de FastAPI
   - `frontend`: contenedor de React (si así lo definiste en tu `docker-compose.yml`)

---

## Ejecución

### En entorno local

- **Ejecutar el backend** (FastAPI):
  ```bash
  poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **Ejecutar el frontend** (React):
  ```bash
  cd fe-personal-management
  npm start  # corre en localhost:3000
  ```
- Accede desde tu navegador a:
  - **Frontend**: [http://localhost:3000](http://localhost:3000)
  - **API** (docs): [http://localhost:8000/docs](http://localhost:8000/docs)

### En Docker Compose

```bash
docker-compose up -d
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Uso
1. **Ingresar al Frontend** y registrar:
   - Usuarios
   - Ingresos (quién los recibe)
   - Gastos (fijos, compartidos, con cuotas, etc.)
   - Ahorros
2. **Consultar la Distribución** para ver un desglose mensual por cuentas y usuarios.
3. **Ver Excedentes** para saber cuánto dinero sobra o falta a cada usuario.

---

## Importar Mes Anterior
Si deseas copiar datos de un mes anterior (`Income`, `Expense`, `Savings`, `ExpenseUser`), utiliza el endpoint:
```
POST /api/distribution/import
Body JSON:
{
  "month": "Abril",
  "year": "2025"
}
```
- Internamente, se copian:
  - **Income**
  - **Expense** + la tabla asociada **ExpenseUser** (mediante mapeo `old_expense_id -> new_expense_id`)
  - **Savings**
- Así evitas reingresar datos repetitivos cada mes.

---

## Algoritmo de Devoluciones
Para equilibrar los montos que cada usuario ha pagado:
1. **Calcula el total** pagado (`final_exp_amount[user]`).
2. **Obtén un “fair share”** = total / número de usuarios.
3. **Genera listas de deudores** (`diff < 0`) y **acreedores** (`diff > 0`).
4. **Crea transacciones** para que los deudores paguen a los acreedores hasta que sus diffs sean cero.

Ejemplo de salida:
```json
[
  { "from": "Adrian", "to": "Mari", "amount": 347.17 },
  { "from": "Pepe", "to": "Olguita", "amount": 50.00 }
]
```
Cada transacción indica quién paga y a quién, para dejar todos los gastos equilibrados.

---

## Notas Adicionales
- Si un gasto es `is_shared = false` pero no existe `ExpenseUser`, el gasto se asigna entero al `payer`.
- Si `is_shared = true`, se reparte mediante `ExpenseUser.share_percentage`.
- Evita saturar la base de datos con demasiadas conexiones simultáneas; configura `SQLAlchemy` con un pool razonable.
- Asegúrate de cerrar correctamente las conexiones a la base de datos en FastAPI (solo `db.close()`, **no** `engine.dispose()`).

---

## Licencia
Este proyecto está bajo la licencia [MIT](https://opensource.org/licenses/MIT). Esto significa que puedes usarlo y modificarlo libremente siempre y cuando incluyas la licencia original.

