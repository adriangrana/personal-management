from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories import distribution_repository
from app.schemas import DistributionCreate, DistributionResponse

router = APIRouter()

@router.get("/", response_model=list[DistributionResponse])
def get_salary_distribution(month: str, year: str, db: Session = Depends(get_db)):
    return distribution_repository.calculate_distribution(db, month, year)

@router.post("/", response_model=DistributionResponse)
def create_salary_distribution(distribution: DistributionCreate, db: Session = Depends(get_db)):
    return distribution_repository.create_salary_distribution(db, distribution)

@router.delete("/{distribution_id}")
def delete_salary_distribution(distribution_id: int, db: Session = Depends(get_db)):
    deleted_distribution = distribution_repository.delete_salary_distribution(db, distribution_id)
    if not deleted_distribution:
        raise HTTPException(status_code=404, detail="Distribución no encontrada")
    return {"message": "Distribución eliminada"}

@router.post("/import")
def import_last_month(data: dict, db: Session = Depends(get_db)):
    """Duplica la información del último mes y la copia al mes y año seleccionados."""
    new_month = data["month"]
    new_year = data["year"]
    return distribution_repository.import_last_month(db, new_month, new_year)
