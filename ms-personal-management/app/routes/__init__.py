from fastapi import APIRouter
from .user_routes import router as user_router
from .savings_routes import router as savings_router
from .income_routes import router as income_router
from .expense_routes import router as expense_router
from .distribution_routes import router as distribution_router
from .financial_routes import router as financial_router

router = APIRouter()

# 🔹 Registrar todas las rutas en el enrutador principal
router.include_router(user_router)
router.include_router(savings_router)
router.include_router(income_router)
router.include_router(expense_router)
router.include_router(distribution_router)
router.include_router(financial_router)
