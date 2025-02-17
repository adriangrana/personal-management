# Usa una imagen de Node.js
FROM node:18

# Establecer directorio de trabajo
WORKDIR /app

COPY package.json package-lock.json ./
# Copiar archivos del frontend


# Instalar dependencias
RUN npm install

COPY . .
# Construir la app para producción
RUN npm run build

# Exponer el puerto 3000
EXPOSE 3000

# Ejecutar el servidor en el puerto 3000
CMD ["npm", "start"]
