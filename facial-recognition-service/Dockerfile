# Usar una imagen base con Python y dependencias de sistema
FROM python:3.10-slim

# Instalar dependencias del sistema para dlib y OpenCV
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-all-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias Python
COPY requirements.txt .
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
