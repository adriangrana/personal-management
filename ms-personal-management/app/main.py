import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import user_routes, expense_routes, income_routes, savings_routes, financial_routes, distribution_routes

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Instancia de la aplicación FastAPI
app = FastAPI(title="Gestor Financiero API")

# Configuración de CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar esto en producción para mayor seguridad
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permite todos los encabezados
)

# Incluir rutas
app.include_router(user_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(expense_routes.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(income_routes.router, prefix="/api/income", tags=["Income"])
app.include_router(savings_routes.router, prefix="/api/savings", tags=["Savings"])
app.include_router(financial_routes.router, prefix="/api/financial", tags=["Financial"])
app.include_router(distribution_routes.router, prefix="/api/distribution", tags=["Distribución"])

# Permite ejecutar la API con "python -m app.main"
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
