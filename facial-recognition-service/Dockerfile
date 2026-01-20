# Usar una imagen base con Python y dependencias de sistema
FROM python:3.10-slim

# Configurar variables de entorno para compilación
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema para dlib y OpenCV
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    pkg-config \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-all-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    gfortran \
    openexr \
    libatlas-base-dev \
    python3-dev \
    python3-numpy \
    libtbb2 \
    libtbb-dev \
    libdc1394-dev \
    libopenexr-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias Python
COPY requirements.txt .

# Actualizar pip y setuptools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instalar numpy primero (requerido por otros paquetes)
RUN pip install --no-cache-dir numpy

# Instalar dlib con paciencia (puede tardar 5-10 minutos)
RUN pip install --no-cache-dir dlib

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
