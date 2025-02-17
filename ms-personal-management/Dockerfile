# Usa una imagen base de Python
FROM python:3.12

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos del backend al contenedor
COPY . .

# Instalar Poetry y dependencias
RUN pip install poetry && poetry install --no-root

# Exponer el puerto 8000
EXPOSE 8000

# Comando para ejecutar la app
CMD ["poetry", "run", "python", "-m", "app.main", "--host", "0.0.0.0", "--port", "8000"]
