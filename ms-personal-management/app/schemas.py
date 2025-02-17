from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Union


# 🔹 Esquema para el usuario
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True


# 🔹 Esquema para Ahorros
class SavingsBase(BaseModel):
    description: str
    amount: float
    account: str
    owner: str
    month: str
    year: str

class SavingsCreate(SavingsBase):
    pass

class SavingsResponse(SavingsBase):
    id: int

    class Config:
        orm_mode = True


# 🔹 Esquema para Ingresos
class IncomeBase(BaseModel):
    description: str
    amount: float
    owner: str
    month: str
    year: str

class IncomeCreate(IncomeBase):
    pass

class IncomeResponse(IncomeBase):
    id: int

    class Config:
        orm_mode = True


# 🔹 Esquema para Usuarios Compartiendo Gastos
class ExpenseUserBase(BaseModel):
    user_id: int  # Se recibe el nombre del usuario
    share_percentage: float

class ExpenseUserCreate(ExpenseUserBase):
    pass

class ExpenseUserResponse(ExpenseUserBase):
    id: int

    class Config:
        orm_mode = True
class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    account: Optional[str] = None
    is_shared: Optional[bool] = None
    is_quota: Optional[bool] = None
    current_quota: Optional[int] = None
    total_quotas: Optional[int] = None
    payer:Optional[str] = None
    month: Optional[str] = None
    year: Optional[str] = None
    shared_users: Optional[List["ExpenseUserCreate"]] = None  # Lista de usuarios compartidos
    
# 🔹 Esquema para Gastos
class ExpenseBase(BaseModel):
    description: str
    amount: float
    account: str
    is_shared: bool
    is_quota: bool
    payer: str
    current_quota: Optional[int] = None
    total_quotas: Optional[int] = None
    month: str
    year: str

class ExpenseCreate(ExpenseBase):
    shared_users: Optional[List[ExpenseUserCreate]] = None  # Relación con usuarios

class ExpenseResponse(ExpenseBase):
    id: int
    shared_users: Optional[List[ExpenseUserResponse]] = None

    class Config:
        orm_mode = True


# 🔹 Esquema para la Distribución del Salario
class DistributionBase(BaseModel):
    account: str
    values: Dict[str, Union[str, float]]  # Se permite string o float para manejar casos de "NA"

    class Config:
        orm_mode = True

class DistributionCreate(DistributionBase):
    pass

class DistributionResponse(DistributionBase):
    id: int

    class Config:
        orm_mode = True

class FinancialSummary(BaseModel):
    income: float
    expenses: float
    savings: float
    surplus: float
    
class HistoricalData(BaseModel):
    month: str
    year: str
    value: float