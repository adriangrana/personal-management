import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Cargar las variables de entorno desde un archivo .env (si existe)
load_dotenv()

# Obtener los valores de la configuración de la base de datos desde las variables de entorno
DATABASE_USER = os.getenv("DATABASE_USER", "personal_user")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "personal_pass")
DATABASE_HOST = os.getenv("DATABASE_HOST", "localhost")
DATABASE_PORT = os.getenv("DATABASE_PORT", "5432")
DATABASE_NAME = os.getenv("DATABASE_NAME", "personal_management")

# URL de conexión a PostgreSQL
DATABASE_URL = f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

# Configuración de SQLAlchemy
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db  # Cede el control a la función que llame a get_db()
    finally:
        db.close()  # Cierra solo la sesión, no el engine
