# 🚀 Guía Rápida de Inicio - Sistema Biométrico

## ⚡ Inicio Rápido (5 minutos)

### 1. Prerequisitos
```bash
# Verificar instalaciones
docker --version
docker-compose --version
node --version  # Opcional si usas Docker
python --version  # Opcional si usas Docker
```

### 2. Configuración Inicial

```bash
# 1. Clonar repositorio
git clone https://github.com/Gpcaceres/TravelBrainLS.git
cd TravelBrainLS

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar claves de seguridad (IMPORTANTE)
# En Linux/Mac:
export INTERNAL_SERVICE_TOKEN=$(openssl rand -hex 32)
export BIOMETRIC_MASTER_KEY=$(openssl rand -base64 32 | head -c 32)

# En Windows PowerShell:
$INTERNAL_SERVICE_TOKEN=[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
$BIOMETRIC_MASTER_KEY=[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))

# 4. Actualizar .env con las claves generadas
nano .env
```

### 3. Ejecutar con Docker

```bash
# Construir y ejecutar todos los servicios
docker-compose up --build

# O en modo detached (segundo plano)
docker-compose up -d --build
```

### 4. Verificar Servicios

```bash
# Frontend: http://localhost:5173
# Backend: http://localhost:3004/health
# Microservicio Python: NO accesible desde el exterior ✅
```

---

## 🧪 Probar el Sistema

### Test 1: Registro de Biometría

1. Abrir navegador: `http://localhost:5173`
2. Registrarse/Iniciar sesión con método tradicional
3. Ir a Perfil → Configurar Biometría
4. Permitir acceso a cámara
5. Seguir instrucciones (parpadear 2 veces)
6. ✅ Biometría registrada

### Test 2: Login Biométrico

1. Cerrar sesión
2. En pantalla de login, seleccionar "Login Facial"
3. Ingresar email
4. Clic en "Iniciar Verificación"
5. Parpadear cuando se solicite
6. ✅ Acceso concedido automáticamente

### Test 3: Verificar Seguridad

```bash
# Este comando debe FALLAR (puerto no expuesto)
curl http://localhost:8001/health

# Error esperado: "Connection refused" o timeout
# ✅ Microservicio correctamente aislado
```

---

## 📦 Instalación Sin Docker

### Backend (Node.js)

```bash
cd backend-project

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
nano .env

# Ejecutar
npm run dev
# Servidor en: http://localhost:3004
```

### Microservicio Python

```bash
cd facial-recognition-service

# Crear entorno virtual
python -m venv venv

# Activar entorno
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
uvicorn main:app --host 0.0.0.0 --port 8001
# Servicio en: http://localhost:8001
```

### Frontend (React)

```bash
cd frontend-react

# Instalar dependencias
npm install

# Descargar modelos de face-api.js
mkdir -p public/models
# Descargar desde: https://github.com/justadudewhohacks/face-api.js-models
# Copiar archivos:
# - tiny_face_detector_model-weights_manifest.json
# - tiny_face_detector_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_expression_model-weights_manifest.json
# - face_expression_model-shard1

# Configurar variables
echo "VITE_API_BASE_URL=http://localhost:3004" > .env

# Ejecutar
npm run dev
# App en: http://localhost:5173
```

---

## 🔧 Comandos Útiles

### Docker

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f facial-recognition
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Rebuild de un servicio específico
docker-compose up --build facial-recognition
```

### MongoDB

```bash
# Conectar a MongoDB Atlas (usar tu URI del .env)
mongosh "mongodb+srv://usuario:password@cluster.mongodb.net/travel_brain"

# Ver biometrías registradas (cifradas)
db.facial_biometrics.find().pretty()

# Ver logs de auditoría
db.biometric_audit_logs.find().sort({timestamp: -1}).limit(10).pretty()

# Ver desafíos activos
db.biometric_challenges.find({status: "PENDING"}).pretty()
```

---

## 🐛 Solución de Problemas

### Problema: "Cámara no accesible"

**Causa:** Permisos de navegador no concedidos

**Solución:**
1. Verificar que usas HTTPS en producción
2. En desarrollo, usar `localhost` (no 127.0.0.1)
3. Permitir permisos de cámara en el navegador
4. Probar en Chrome/Firefox (mejor soporte)

### Problema: "Error comunicándose con servicio de reconocimiento"

**Causa:** Microservicio Python no está corriendo

**Solución:**
```bash
# Verificar que el contenedor está activo
docker ps | grep facial-recognition

# Ver logs del microservicio
docker-compose logs facial-recognition

# Reiniciar servicio
docker-compose restart facial-recognition
```

### Problema: "Error descifrando datos biométricos"

**Causa:** BIOMETRIC_MASTER_KEY cambió o es incorrecta

**Solución:**
- ⚠️ Si cambias la clave, todos los encodings existentes serán inaccesibles
- Usar siempre la misma MASTER_KEY
- En producción, guardar backup seguro de la clave

### Problema: "Liveness detection falla"

**Causa:** Condiciones de iluminación pobres

**Solución:**
1. Asegurar buena iluminación frontal
2. Evitar luz de fondo fuerte
3. Cámara a la altura de los ojos
4. Distancia: 40-60cm de la cámara
5. No usar gafas de sol o sombreros

### Problema: Modelos de face-api.js no cargan

**Causa:** Archivos de modelos no descargados

**Solución:**
```bash
cd frontend-react/public
mkdir models
cd models

# Descargar modelos manualmente
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-shard1

wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-shard1

wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-shard1
```

---

## 📊 Métricas de Rendimiento

### Tiempos Esperados

- **Challenge Request:** < 100ms
- **Extracción de features (Python):** 1-3 segundos
- **Comparación de encodings:** < 500ms
- **Login completo:** 3-5 segundos

### Uso de Recursos

**Microservicio Python:**
- RAM: 500MB - 1GB
- CPU: 20-30% durante procesamiento
- Picos de 100% por 1-2 segundos

**Backend Node.js:**
- RAM: 100-300MB
- CPU: 5-10%

---

## 🔐 Checklist de Seguridad Pre-Producción

- [ ] Cambiar `INTERNAL_SERVICE_TOKEN`
- [ ] Cambiar `BIOMETRIC_MASTER_KEY`
- [ ] Cambiar `JWT_SECRET`
- [ ] Configurar HTTPS/SSL
- [ ] Restringir CORS_ORIGINS
- [ ] Implementar rate limiting
- [ ] Configurar firewall
- [ ] Backup de claves en vault
- [ ] Monitoreo de logs activo
- [ ] Plan de respuesta a incidentes
- [ ] Pruebas de penetración
- [ ] Documentación de procedimientos

---

## 📞 Soporte

### Documentación Completa
Ver: [BIOMETRIC_AUTH_SYSTEM.md](BIOMETRIC_AUTH_SYSTEM.md)

### Reportar Problemas
- GitHub Issues: https://github.com/Gpcaceres/TravelBrainLS/issues
- Email: dev@travelbrain.com

### Comunidad
- Discord: [enlace]
- Slack: [enlace]

---

**✅ ¡Listo! Sistema biométrico funcionando con máxima seguridad.**
