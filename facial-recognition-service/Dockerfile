# Usar una imagen base con más herramientas (no slim)
FROM python:3.10-bullseye

# Configurar variables de entorno para compilación
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias mínimas necesarias para dlib y OpenCV
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    pkg-config \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libboost-all-dev \
    libjpeg-dev \
    libpng-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias Python
COPY requirements.txt .

# Actualizar pip y setuptools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instalar numpy primero (requerido por otros paquetes)
RUN pip install --no-cache-dir numpy

# Instalar dlib con verbose para ver errores (puede tardar 8-10 minutos)
RUN pip install --no-cache-dir -v dlib

# Instalar el resto de dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear usuario no-root por seguridad (principio de mínimo privilegio)
RUN useradd -m -u 1000 facialuser && chown -R facialuser:facialuser /app
USER facialuser

# Exponer puerto solo en red interna
EXPOSE 8001

# Comando de inicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
