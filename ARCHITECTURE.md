# 🏗️ Arquitectura de Microservicios - TravelBrain

## 📋 Tabla de Contenidos
- [Visión General](#visión-general)
- [Arquitectura de Servicios](#arquitectura-de-servicios)
- [Comunicación entre Servicios](#comunicación-entre-servicios)
- [Seguridad y Autenticación](#seguridad-y-autenticación)
- [Integración con OWASP ZAP](#integración-con-owasp-zap)
- [Despliegue con Docker](#despliegue-con-docker)
- [Flujos de Datos](#flujos-de-datos)

---

## 🎯 Visión General

TravelBrain es una aplicación web de tres capas con arquitectura de microservicios que proporciona:
- Gestión de viajes y destinos
- Pronóstico del clima
- Autenticación biométrica facial avanzada
- Sistema de administración de usuarios

### Stack Tecnológico

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA COMPLETA DE MICROSERVICIOS                       │
│                                   TRAVELBRAINLS                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   Usuario   │
                                    │  (Browser)  │
                                    └──────┬──────┘
                                           │
                                           │ HTTP/HTTPS
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    │         OPCIONAL: OWASP ZAP                 │
                    │         Security Testing Proxy             │
                    │           127.0.0.1:8081                    │
                    └──────────────────────┬──────────────────────┘
                                           │
                                           │ Intercepted Traffic
                                           │
    ┌──────────────────────────────────────┼──────────────────────────────────────┐
    │                                      │                                      │
    │                    DOCKER ENVIRONMENT (travelbrain-network)                │
    │                                                                             │
    │   ┌──────────────────────────────────▼───────────────────────────────┐    │
    │   │                     FRONTEND SERVICE                             │    │
    │   │                                                                   │    │
    │   │   Container: travelbrain-frontend                                │    │
    │   │   Technology: React 18 + Vite 7.3.1                             │    │
    │   │   Base Image: node:20-alpine                                     │    │
    │   │   Port: 3001 (exposed to host)                                   │    │
    │   │                                                                   │    │
    │   │   Components:                                                     │    │
    │   │   • BiometricLoginAdvanced.jsx    (Face detection + liveness)    │    │
    │   │   • BiometricRegister.jsx         (Facial enrollment)            │    │
    │   │   • face-api.js                   (ML models in browser)         │    │
    │   │     - TinyFaceDetector (512px)                                   │    │
    │   │     - FaceLandmark68Net                                          │    │
    │   │     - FaceExpressionNet                                          │    │
    │   │                                                                   │    │
    │   │   API Calls:                                                      │    │
    │   │   ├─ /api/auth/*          (Authentication)                       │    │
    │   │   ├─ /api/biometric/*     (Biometric operations)                 │    │
    │   │   ├─ /trips               (Trip management)                      │    │
    │   │   ├─ /destinations        (Destination data)                     │    │
    │   │   └─ /weathers            (Weather information)                  │    │
    │   │                                                                   │    │
    │   └───────────────────────────┬───────────────────────────────────────┘    │
    │                               │                                             │
    │                               │ HTTP REST API                               │
    │                               │ (JWT Bearer Token)                          │
    │                               │                                             │
    │   ┌───────────────────────────▼───────────────────────────────────────┐    │
    │   │                     BACKEND SERVICE                               │    │
    │   │                                                                   │    │
    │   │   Container: travelbrain-backend                                 │    │
    │   │   Technology: Node.js 18 + Express.js                            │    │
    │   │   Base Image: node:18-slim                                       │    │
    │   │   Port: 4000 (exposed to host)                                   │    │
    │   │                                                                   │    │
    │   │   Middlewares:                                                    │    │
    │   │   • authenticate          (JWT validation)                       │    │
    │   │   • cors                  (CORS policy)                          │    │
    │   │   • cache                 (Response caching)                     │    │
    │   │   • errorHandler          (Global error handler)                 │    │
    │   │   • requestLogger         (HTTP logging)                         │    │
    │   │                                                                   │    │
    │   │   Controllers:                                                    │    │
    │   │   ├─ authController        (Login, Register, Logout)             │    │
    │   │   ├─ biometricController   (Challenge, Verify, Register)         │    │
    │   │   ├─ userController        (User management)                     │    │
    │   │   ├─ tripController        (CRUD trips)                          │    │
    │   │   ├─ destinationController (CRUD destinations)                   │    │
    │   │   └─ weatherController     (Weather search & history)            │    │
    │   │                                                                   │    │
    │   │   Security:                                                       │    │
    │   │   • JWT_SECRET             (Token signing)                       │    │
    │   │   • bcrypt                 (Password hashing)                    │    │
    │   │   • AES-256-CBC            (Biometric encryption)                │    │
    │   │   • helmet                 (Security headers)                    │    │
    │   │   • INTERNAL_SERVICE_TOKEN (Service-to-service auth)             │    │
    │   │                                                                   │    │
    │   └───────────────┬─────────────────────────┬─────────────────────────┘    │
    │                   │                         │                              │
    │                   │                         │                              │
    └───────────────────┼─────────────────────────┼──────────────────────────────┘
                        │                         │
                        │                         │ Internal Network
        ┌───────────────▼─────────┐               │ (PRIVATE - No host access)
        │                         │               │
        │    MongoDB Atlas        │   ┌───────────▼───────────────────────────────┐
        │      (Cloud)            │   │   FACIAL RECOGNITION MICROSERVICE         │
        │                         │   │                                           │
        │  Database: travel_brain │   │   Container: travelbrain-facial-recog.   │
        │  URI: mongodb+srv://... │   │   Technology: Python 3.10 + FastAPI      │
        │                         │   │   Base Image: python:3.10-bullseye       │
        │  Collections:           │   │   Port: 8001 (internal only)             │
        │  • users                │   │                                           │
        │  • facialbiometrics     │   │   Dependencies:                           │
        │  • biometricchallenges  │   │   • dlib 19.24.2         (Face detection)│
        │  • trips                │   │   • face_recognition     (128D encodings)│
        │  • destinations         │   │   • opencv-python        (Image process) │
        │  • weathers             │   │   • numpy 1.24.3         (Math ops)      │
        │  • favoriteroutes       │   │   • fastapi + uvicorn    (Web server)    │
        │                         │   │                                           │
        │  Indexes:               │   │   Endpoints:                              │
        │  • email (unique)       │   │   POST /extract-features                  │
        │  • userId               │   │        Input: Face image (multipart)      │
        │  • expiresAt (TTL)      │   │        Output: {                          │
        │                         │   │          encoding: [128D vector],         │
        │                         │   │          liveness_score: 0.0-1.0,         │
        │                         │   │          quality_score: 0.0-1.0,          │
        │                         │   │          confidence: 0.0-1.0              │
        │                         │   │        }                                  │
        │  Connection Pool:       │   │                                           │
        │  Min: 10 / Max: 50      │   │   POST /compare-faces                     │
        │                         │   │        Input: {                           │
        └─────────────────────────┘   │          encoding1: [128D],               │
                                      │          encoding2: [128D]                │
                                      │        }                                  │
                                      │        Output: {                          │
                                      │          match: true/false,               │
                                      │          distance: 0.0-1.0,               │
                                      │          confidence: 0.0-1.0              │
                                      │        }                                  │
                                      │                                           │
                                      │   GET /health                             │
                                      │        Health check endpoint              │
                                      │                                           │
                                      │   Security:                               │
                                      │   • X-Internal-Token header validation    │
                                      │   • No external network access            │
                                      │   • Request size limits (10MB max)        │
                                      │                                           │
                                      │   Anti-Spoofing (Liveness Detection):    │
                                      │   1. Texture Analysis     (Laplacian var) │
                                      │   2. Contrast Analysis    (Std deviation) │
                                      │   3. Brightness Analysis  (Mean value)    │
                                      │   4. Moiré Detection      (FFT analysis)  │
                                      │   5. Sharpness Analysis   (Gradient)      │
                                      │                                           │
                                      │   Resource Limits:                        │
                                      │   • CPU: 2 cores                          │
                                      │   • Memory: 2GB                           │
                                      │                                           │
                                      └───────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              FLUJO DE COMUNICACIÓN                                    │
└──────────────────────────────────────────────────────────────────────────────────────┘

1. AUTENTICACIÓN TRADICIONAL:
   Usuario → Frontend → Backend → MongoDB
   ↓
   Backend genera JWT → Frontend almacena token → Requests con Bearer Token

2. AUTENTICACIÓN BIOMÉTRICA:
   Usuario (parpadeo) → Frontend (face-api.js captura) → Backend → Facial Service
   ↓
   Facial Service (dlib encoding + liveness) → Backend (compare + validate)
   ↓
   Backend genera JWT → Frontend almacena token

3. OPERACIONES PROTEGIDAS:
   Frontend (JWT token) → Backend (authenticate middleware) → MongoDB
   ↓
   Response con caché (si aplica)

4. BÚSQUEDA DE CLIMA:
   Frontend → Backend → OpenWeather API → Backend → MongoDB (cache) → Frontend

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              PUERTOS Y EXPOSICIÓN                                     │
└──────────────────────────────────────────────────────────────────────────────────────┘

Host Machine:
├─ localhost:3001    → Frontend (React App)
├─ localhost:4000    → Backend API
└─ localhost:8081    → OWASP ZAP (opcional, para testing)

Docker Internal Network:
├─ frontend:3001          (travelbrain-network)
├─ backend:4000           (travelbrain-network + internal-network)
└─ facial-recognition:8001 (internal-network ONLY - NO external access)

External Services:
├─ MongoDB Atlas (mongodb+srv://...)
└─ OpenWeather API (api.openweathermap.org)

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         VARIABLES DE ENTORNO CRÍTICAS                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘

Backend Service:
├─ JWT_SECRET                  (Firma de tokens JWT)
├─ INTERNAL_SERVICE_TOKEN      (Autenticación Backend ↔ Facial Service)
├─ BIOMETRIC_MASTER_KEY        (Cifrado AES-256 de encodings)
├─ MONGO_URI                   (Conexión MongoDB Atlas)
├─ OPENWEATHER_API_KEY         (API del clima)
├─ FACIAL_SERVICE_URL          (http://facial-recognition:8001)
├─ VERIFICATION_THRESHOLD      (0.6 - Similitud facial mínima)
└─ PORT                        (4000)

Facial Service:
└─ INTERNAL_SERVICE_TOKEN      (Mismo token que Backend)

Frontend Service:
└─ VITE_API_BASE_URL           (http://localhost:4000)

┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         CARACTERÍSTICAS DEL SISTEMA                                   │
└──────────────────────────────────────────────────────────────────────────────────────┘

Escalabilidad:
├─ Microservicios independientes (Frontend, Backend, Facial Service)
├─ Comunicación por APIs RESTful
├─ Stateless backend (JWT tokens)
└─ Posibilidad de escalar horizontalmente cada servicio

Seguridad:
├─ Autenticación multi-factor (Password + Face)
├─ JWT con expiración (24h)
├─ Cifrado AES-256 para datos biométricos
├─ Red interna privada para Facial Service
├─ Headers de seguridad (helmet.js)
├─ Rate limiting
└─ CORS configurado

Resilencia:
├─ Health checks en contenedores
├─ Restart policies (unless-stopped)
├─ Error handling global
├─ Logging de requests y errores
└─ Connection pooling en MongoDB

Observabilidad:
├─ Request logging con timestamps
├─ Status codes y duración de requests
├─ Health endpoints
└─ Docker logs centralizados
```

---

## 🔧 Arquitectura de Servicios

### 1️⃣ **Frontend Service** - React + Vite

**Responsabilidades:**
- Interfaz de usuario responsive
- Gestión de estado local (React Hooks)
- Autenticación JWT
- Detección facial del lado del cliente con face-api.js
- Comunicación con Backend API

**Tecnologías:**
```yaml
Framework: React 18
Build Tool: Vite 7.3.1
Face Detection: face-api.js
  - TinyFaceDetector (512px, threshold 0.5)
  - FaceLandmark68Net
  - FaceExpressionNet
Routing: React Router DOM
HTTP Client: Axios
```

**Estructura de Archivos:**
```
frontend-react/
├── src/
│   ├── components/
│   │   ├── BiometricLoginAdvanced.jsx    # Login biométrico
│   │   └── BiometricRegister.jsx         # Registro facial
│   ├── pages/
│   │   ├── Login.jsx                     # Página de login
│   │   ├── Register.jsx                  # Registro de usuarios
│   │   ├── Dashboard.jsx                 # Panel principal
│   │   ├── Weather.jsx                   # Clima
│   │   └── Admin.jsx                     # Administración
│   ├── services/
│   │   ├── api.js                        # Cliente Axios
│   │   ├── weatherService.js             # API del clima
│   │   ├── tripService.js                # API de viajes
│   │   └── destinationService.js         # API de destinos
│   └── config.js                         # Configuración
└── public/
    └── models/                           # Modelos ML face-api.js
```

**Puerto:** `3001`  
**URL:** `http://localhost:3001`

---

### 2️⃣ **Backend Service** - Node.js + Express

**Responsabilidades:**
- API RESTful
- Autenticación y autorización (JWT)
- Lógica de negocio
- Gestión de base de datos (MongoDB)
- Coordinación de microservicios
- Caché de datos (Redis-compatible)
- Logging y auditoría

**Tecnologías:**
```yaml
Runtime: Node.js 18
Framework: Express.js
Database ORM: Mongoose
Authentication: JWT + bcrypt
Security: 
  - helmet (headers seguros)
  - cors (CORS configurado)
  - express-rate-limit
  - AES-256 (cifrado biométrico)
Cache: Memory cache middleware
```

**Endpoints Principales:**

| Método | Ruta | Protección | Descripción |
|--------|------|------------|-------------|
| POST | `/api/auth/register` | Pública | Registro de usuario |
| POST | `/api/auth/login` | Pública | Login tradicional |
| POST | `/api/biometric/challenge` | Pública | Solicitar challenge |
| POST | `/api/biometric/verify` | Pública | Verificar identidad facial |
| POST | `/api/biometric/register` | Protegida | Registrar biometría |
| GET | `/api/biometric/status` | Protegida | Estado biométrico |
| GET | `/trips` | Protegida | Listar viajes |
| GET | `/destinations` | Protegida | Listar destinos |
| GET | `/weathers` | Protegida | Historial del clima |
| POST | `/weather` | Protegida | Buscar clima |
| GET | `/users` | Admin | Listar usuarios |

**Estructura de Archivos:**
```
backend-project/
├── src/
│   ├── controllers/
│   │   ├── authController.js           # Autenticación
│   │   ├── biometricController.js      # Biometría
│   │   ├── userController.js           # Usuarios
│   │   ├── tripController.js           # Viajes
│   │   ├── destinationController.js    # Destinos
│   │   └── weatherController.js        # Clima
│   ├── models/
│   │   ├── User.js                     # Usuario
│   │   ├── FacialBiometric.js          # Datos biométricos
│   │   ├── BiometricChallenge.js       # Challenges
│   │   ├── Trip.js                     # Viaje
│   │   ├── Destination.js              # Destino
│   │   └── Weather.js                  # Clima
│   ├── middlewares/
│   │   ├── auth.js                     # JWT validation
│   │   ├── cors.js                     # CORS config
│   │   ├── cache.js                    # Cache
│   │   └── errorHandler.js             # Error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── biometricRoutes.js
│   │   ├── tripRoutes.js
│   │   └── weatherRoutes.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── responseFormatter.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── app.js                          # Configuración Express
│   └── server.js                       # Entry point
└── .env                                # Variables de entorno
```

**Puerto:** `4000`  
**URL:** `http://localhost:4000`

---

### 3️⃣ **Facial Recognition Service** - Python + FastAPI

**Responsabilidades:**
- Extracción de características faciales (128D encodings)
- Comparación de rostros (distancia euclidiana)
- Detección de liveness (anti-spoofing)
- Análisis de calidad de imagen

**Tecnologías:**
```yaml
Runtime: Python 3.10
Framework: FastAPI + Uvicorn
Face Recognition: dlib 19.24.2 + face_recognition
Computer Vision: OpenCV
Numeric Computing: NumPy 1.24.3
Security: X-Internal-Token header
```

**Algoritmos de Liveness Detection:**
```python
# 5 métricas de anti-spoofing
1. Texture Analysis (Variación de Laplaciano)
2. Contrast Analysis (Desviación estándar)
3. Brightness Analysis (Media normalizada)
4. Moiré Pattern Detection (FFT)
5. Sharpness Analysis (Gradiente)

# Score final: promedio ponderado
liveness_score >= 0.6  # Threshold ajustado
```

**Endpoints:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/extract-features` | Extrae encoding 128D + liveness + quality |
| POST | `/compare-faces` | Compara dos encodings (distancia) |
| GET | `/health` | Health check |

**Estructura de Archivos:**
```
facial-recognition-service/
├── main.py                    # FastAPI app
├── requirements.txt           # Dependencias Python
├── Dockerfile                 # Imagen Docker
└── .env                       # Variables (INTERNAL_SERVICE_TOKEN)
```

**Puerto:** `8001` (solo accesible internamente)  
**URL:** `http://facial-recognition:8001` (red Docker interna)

**Seguridad:**
- Token interno compartido entre Backend y Facial Service
- Red privada Docker (no expuesta al host)
- Validación de headers `X-Internal-Token`

---

### 4️⃣ **Database Service** - MongoDB Atlas

**Responsabilidades:**
- Persistencia de datos
- Índices optimizados
- TTL para challenges temporales
- Geoespacial para destinos

**Colecciones:**
```javascript
// Usuarios
users {
  _id, email, username, password (bcrypt),
  name, role, status, createdAt, updatedAt
}

// Datos biométricos (cifrados con AES-256)
facialbiometrics {
  _id, userId, facialEncoding (Buffer),
  confidence, qualityScore, livenessScore,
  isActive, registeredAt, lastVerified
}

// Challenges temporales (TTL 2 min)
biometricchallenges {
  _id, email, token (UUID),
  operation (LOGIN/REGISTER),
  expiresAt, used
}

// Viajes
trips {
  _id, userId, title, destination,
  startDate, endDate, status, budget
}

// Destinos
destinations {
  _id, name, country, description,
  imageUrl, location (GeoJSON)
}

// Historial del clima
weathers {
  _id, userId, city, country,
  temperature, description, icon,
  timestamp
}
```

**Conexión:** `mongodb+srv://SrJCBM:***@cluster0.tjvfmrk.mongodb.net/travel_brain`

---

## 🔐 Seguridad y Autenticación

### Flujo de Autenticación Tradicional

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Usuario │                 │ Backend │                 │ MongoDB  │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ 1. POST /api/auth/login   │                           │
     │  { email, password }      │                           │
     ├──────────────────────────►│                           │
     │                           │ 2. Buscar usuario         │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │ 3. Usuario encontrado     │
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │ 4. bcrypt.compare()       │
     │                           │                           │
     │                           │ 5. Generar JWT            │
     │                           │ (expires: 24h)            │
     │                           │                           │
     │ 6. { token, user }        │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │ 7. Guardar en localStorage│                           │
     │                           │                           │
```

### Flujo de Autenticación Biométrica

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌────────┐
│ Usuario │    │ Frontend │    │ Backend │    │  Facial  │    │MongoDB │
└────┬────┘    └────┬─────┘    └────┬────┘    │  Service │    └───┬────┘
     │              │               │          └────┬─────┘        │
     │ 1. Click    │               │               │              │
     │  Login Face │               │               │              │
     ├────────────►│               │               │              │
     │              │               │               │              │
     │              │ 2. POST /biometric/challenge  │              │
     │              │    { email }                  │              │
     │              ├──────────────►│               │              │
     │              │               │ 3. Crear      │              │
     │              │               │  challenge    │              │
     │              │               ├──────────────────────────────►│
     │              │               │               │              │
     │              │ 4. { challengeToken }         │              │
     │              │◄──────────────┤               │              │
     │              │               │               │              │
     │ 5. Detectar │               │               │              │
     │  rostro     │               │               │              │
     ◄─────────────┤               │               │              │
     │              │               │               │              │
     │ 6. Parpadear│               │               │              │
     │  2 veces    │               │               │              │
     │  (liveness) │               │               │              │
     ├────────────►│               │               │              │
     │              │               │               │              │
     │              │ 7. Capturar  │               │              │
     │              │  imagen (3..2..1)             │              │
     ◄─────────────┤               │               │              │
     │              │               │               │              │
     │              │ 8. POST /biometric/verify     │              │
     │              │ FormData:                     │              │
     │              │  - face.jpg                   │              │
     │              │  - challengeToken             │              │
     │              │  - email                      │              │
     │              ├──────────────►│               │              │
     │              │               │               │              │
     │              │               │ 9. POST /extract-features    │
     │              │               │    (imagen)                  │
     │              │               ├──────────────►│              │
     │              │               │               │              │
     │              │               │               │ 10. dlib     │
     │              │               │               │  encoding    │
     │              │               │               │  + liveness  │
     │              │               │               │              │
     │              │               │ 11. { encoding, liveness, quality }
     │              │               │◄──────────────┤              │
     │              │               │               │              │
     │              │               │ 12. Obtener  │              │
     │              │               │  encoding    │              │
     │              │               │  guardado    │              │
     │              │               ├──────────────────────────────►│
     │              │               │               │              │
     │              │               │ 13. POST /compare-faces      │
     │              │               ├──────────────►│              │
     │              │               │               │              │
     │              │               │ 14. { match, distance, confidence }
     │              │               │◄──────────────┤              │
     │              │               │               │              │
     │              │               │ 15. Generar JWT              │
     │              │               │                              │
     │              │ 16. { token, user, verification }            │
     │              │◄──────────────┤               │              │
     │              │               │               │              │
     │ 17. Redirect│               │               │              │
     │  to Dashboard                │               │              │
     │◄─────────────┤               │               │              │
     │              │               │               │              │
```

### Variables de Seguridad

```bash
# JWT
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Comunicación interna (Backend ↔ Facial Service)
INTERNAL_SERVICE_TOKEN=4cbb87675864b66be014c97ab768328e58374144ed7005fe638e77cc92d38ffe

# Cifrado AES-256 para encodings faciales
BIOMETRIC_MASTER_KEY=\8YWvTNB9uR@HTMoSFs?Hl4wX:BBSEZ_

# Thresholds
VERIFICATION_THRESHOLD=0.6        # Similitud facial mínima
LIVENESS_THRESHOLD=0.6           # Score anti-spoofing mínimo
QUALITY_THRESHOLD=0.6            # Calidad de imagen mínima
BLINK_THRESHOLD=0.3              # EAR para detección de parpadeo
```

---

## 🔍 Integración con OWASP ZAP

### ¿Qué es OWASP ZAP?

**OWASP Zed Attack Proxy (ZAP)** es una herramienta de seguridad open-source para:
- Escaneo de vulnerabilidades
- Pruebas de penetración
- Análisis de tráfico HTTP/HTTPS
- Fuzzing de APIs
- Detección de XSS, SQL Injection, CSRF, etc.

### Configuración de ZAP como Proxy

```
┌──────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA CON ZAP                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐                                             │
│  │   Browser    │                                             │
│  │  (Usuario)   │                                             │
│  └──────┬───────┘                                             │
│         │                                                      │
│         │ HTTP Requests                                       │
│         ▼                                                      │
│  ┌──────────────────┐                                         │
│  │   OWASP ZAP      │ ◄──── Análisis de Seguridad            │
│  │ 127.0.0.1:8081   │       - Vulnerabilidades               │
│  │   (Proxy)        │       - Tráfico HTTP                   │
│  └──────┬───────────┘       - Headers                        │
│         │                   - Payloads                        │
│         │ Forwarded Requests                                  │
│         ▼                                                      │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐  │
│  │   Frontend   │─────▶│   Backend    │─────▶│  Facial   │  │
│  │  Port: 3001  │      │  Port: 4000  │      │  Service  │  │
│  └──────────────┘      └──────────────┘      └───────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Pasos de Integración

#### 1. Instalación de OWASP ZAP

```bash
# Descargar desde https://www.zaproxy.org/download/
# O usar Docker
docker pull zaproxy/zap-stable

# Ejecutar ZAP en modo daemon (headless)
docker run -u zap -p 8081:8080 -d zaproxy/zap-stable zap.sh -daemon \
  -host 0.0.0.0 -port 8080 -config api.key=your-api-key
```

#### 2. Configurar Proxy en el Navegador

**Configuración Manual:**
```
Proxy HTTP: 127.0.0.1
Puerto: 8081
```

**Extensiones Recomendadas:**
- FoxyProxy (Chrome/Firefox): cambio rápido de proxy
- ZAP HUD Extension: overlay de seguridad en el navegador

#### 3. Configurar CORS en Backend para ZAP

```javascript
// backend-project/src/middlewares/cors.js
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:8081',  // ZAP Proxy
    'http://127.0.0.1:8081'   // ZAP Proxy
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### 4. Certificado SSL de ZAP

```bash
# 1. Exportar certificado raíz de ZAP
# Tools > Options > Dynamic SSL Certificates > Save

# 2. Instalar en sistema operativo
# Windows: certmgr.msc > Trusted Root Certification Authorities
# Linux: sudo cp owasp_zap_root_ca.cer /usr/local/share/ca-certificates/
#        sudo update-ca-certificates

# 3. Configurar en navegador
# Firefox: Preferencias > Privacidad > Certificados > Ver > Autoridades > Importar
```

### Tipos de Escaneos

#### 🔍 **1. Passive Scan (Escaneo Pasivo)**

Analiza el tráfico sin modificar las peticiones.

```yaml
Ventajas:
  - No invasivo
  - Seguro para producción
  - No genera alertas

Detecciones:
  - Headers de seguridad faltantes
  - Información sensible en respuestas
  - Cookies inseguras
  - Mixed content (HTTP/HTTPS)
```

**Ejecución:**
```bash
# ZAP API
curl "http://127.0.0.1:8081/JSON/pscan/action/enableAllScanners/"

# Navegar la aplicación normalmente
# ZAP registrará automáticamente
```

#### ⚡ **2. Active Scan (Escaneo Activo)**

Envía payloads maliciosos para probar vulnerabilidades.

```yaml
⚠️ ADVERTENCIA: Solo usar en entornos de desarrollo/testing

Detecciones:
  - SQL Injection
  - XSS (Cross-Site Scripting)
  - Command Injection
  - Path Traversal
  - CSRF
  - SSRF
```

**Ejecución:**
```bash
# ZAP API
curl "http://127.0.0.1:8081/JSON/ascan/action/scan/" \
  -d "url=http://localhost:3001" \
  -d "recurse=true"

# Monitorear progreso
curl "http://127.0.0.1:8081/JSON/ascan/view/status/"
```

#### 🎯 **3. Spider (Rastreo)**

Descubre todos los endpoints de la aplicación.

```bash
# Iniciar spider
curl "http://127.0.0.1:8081/JSON/spider/action/scan/" \
  -d "url=http://localhost:3001"

# Ver URLs descubiertas
curl "http://127.0.0.1:8081/JSON/spider/view/results/"
```

#### 🔓 **4. Authentication Scan**

Prueba endpoints protegidos con autenticación.

```bash
# 1. Configurar contexto de autenticación
# Tools > Options > Authentication > Form-Based Authentication

# 2. Configurar usuario
# Users: email + password

# 3. Configurar parámetros de sesión
# Session Management: Cookie-Based

# 4. Ejecutar scan con autenticación
curl "http://127.0.0.1:8081/JSON/ascan/action/scanAsUser/" \
  -d "url=http://localhost:4000/api" \
  -d "contextId=1" \
  -d "userId=1"
```

### Configuración de Escaneo para TravelBrain

#### **zap-scan-config.yml**

```yaml
# Configuración de escaneo para TravelBrain
env:
  contexts:
    - name: TravelBrain
      urls:
        - http://localhost:3001
        - http://localhost:4000
      includePaths:
        - http://localhost:3001.*
        - http://localhost:4000/api/.*
      excludePaths:
        - http://localhost:4000/health
        - http://localhost:4000/api/biometric/.* # Excluir biometría (datos sensibles)
      
      authentication:
        method: json
        loginUrl: http://localhost:4000/api/auth/login
        loginRequestData: '{"email":"test@mail.com","password":"test123"}'
        usernameParameter: email
        passwordParameter: password
        
      sessionManagement:
        method: cookie
        
      users:
        - name: test-user
          credentials:
            username: test@mail.com
            password: test123
        - name: admin-user
          credentials:
            username: admin@mail.com
            password: admin123

jobs:
  - type: passiveScan-config
    parameters:
      maxAlertsPerRule: 10
      
  - type: spider
    parameters:
      url: http://localhost:3001
      maxDuration: 5
      maxDepth: 5
      
  - type: activeScan
    parameters:
      context: TravelBrain
      user: test-user
      policy: API-scan
      maxDuration: 10

  - type: report
    parameters:
      template: traditional-html
      reportDir: /zap/reports
      reportFile: TravelBrain-Security-Report
```

### Análisis de Endpoints Críticos

#### 🔐 **Endpoints de Autenticación**

```yaml
POST /api/auth/register:
  Vulnerabilidades a probar:
    - SQL Injection en email/username
    - XSS en campos name/username
    - Email validation bypass
    - Weak password policy
    - CSRF token missing
    - Rate limiting

POST /api/auth/login:
  Vulnerabilidades a probar:
    - Brute force attacks
    - Username enumeration
    - Timing attacks
    - Weak session management
    - Missing account lockout

POST /api/biometric/verify:
  Vulnerabilidades a probar:
    - File upload bypass (malicious images)
    - XXE (XML External Entity)
    - SSRF (Server-Side Request Forgery)
    - Race conditions (challenge reuse)
    - Token replay attacks
```

#### 📊 **Endpoints de Datos**

```yaml
GET /trips:
  Vulnerabilidades a probar:
    - IDOR (Insecure Direct Object Reference)
    - JWT tampering
    - Missing authorization
    - SQL Injection en query params
    
GET /weathers:
  Vulnerabilidades a probar:
    - Sensitive data exposure
    - Missing rate limiting
    - Cache poisoning
```

### Generación de Reportes

```bash
# Generar reporte HTML
curl "http://127.0.0.1:8081/OTHER/core/other/htmlreport/" > security-report.html

# Generar reporte XML
curl "http://127.0.0.1:8081/OTHER/core/other/xmlreport/" > security-report.xml

# Generar reporte JSON
curl "http://127.0.0.1:8081/JSON/core/view/alerts/" > security-report.json
```

### Integración CI/CD con ZAP

```yaml
# .github/workflows/security-scan.yml
name: Security Scan with ZAP

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1' # Lunes a las 2 AM

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Start Application
        run: |
          docker-compose up -d
          sleep 30
          
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3001'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
          
      - name: ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://localhost:3001'
          
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: zap-report
          path: report_html.html
```

### Recomendaciones de Seguridad Identificadas

```yaml
# Headers de Seguridad Faltantes
Agregar en backend:
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'
  X-XSS-Protection: 1; mode=block

# Implementación en Express
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

# Rate Limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requests por IP
});

app.use('/api/', limiter);

# Validación de Entrada
const { body, validationResult } = require('express-validator');

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... lógica de login
});

# Logging de Seguridad
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log intentos de login fallidos
logger.warn('Login failed', {
  email: email,
  ip: req.ip,
  timestamp: new Date()
});
```

---

## 🐳 Despliegue con Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Frontend Service
  frontend:
    build:
      context: ./frontend-react
      dockerfile: Dockerfile
    container_name: travelbrain-frontend
    ports:
      - "3001:3001"
    environment:
      - VITE_API_BASE_URL=http://localhost:4000
    networks:
      - travelbrain-network
    depends_on:
      - backend
    restart: unless-stopped

  # Backend Service
  backend:
    build:
      context: ./backend-project
      dockerfile: Dockerfile
    container_name: travelbrain-backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - PORT=4000
      - MONGO_URI=${MONGO_URI}
      - MONGO_DB=travel_brain
      - JWT_SECRET=${JWT_SECRET}
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
      - BIOMETRIC_MASTER_KEY=${BIOMETRIC_MASTER_KEY}
      - VERIFICATION_THRESHOLD=0.6
      - FACIAL_SERVICE_URL=http://facial-recognition:8001
    networks:
      - travelbrain-network
      - internal-network
    depends_on:
      - facial-recognition
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Facial Recognition Service (Internal)
  facial-recognition:
    build:
      context: ./facial-recognition-service
      dockerfile: Dockerfile
    container_name: travelbrain-facial-recognition
    expose:
      - "8001"
    environment:
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
    networks:
      - internal-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

networks:
  # Red pública (Frontend ↔ Backend)
  travelbrain-network:
    driver: bridge
    
  # Red privada (Backend ↔ Facial Service)
  internal-network:
    driver: bridge
    internal: true  # No acceso desde host
```

### Redes Docker

```
┌─────────────────────────────────────────────────────┐
│                 DOCKER NETWORKS                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │      travelbrain-network (Public)            │   │
│  │                                              │   │
│  │  ┌──────────────┐      ┌──────────────┐    │   │
│  │  │   Frontend   │      │   Backend    │    │   │
│  │  │  172.20.0.3  │◄────►│  172.20.0.2  │    │   │
│  │  └──────────────┘      └──────┬───────┘    │   │
│  │                               │             │   │
│  └───────────────────────────────┼─────────────┘   │
│                                  │                  │
│  ┌───────────────────────────────┼─────────────┐   │
│  │    internal-network (Private) │             │   │
│  │                               │             │   │
│  │                          ┌────▼──────┐      │   │
│  │                          │  Facial   │      │   │
│  │                          │  Service  │      │   │
│  │                          │172.21.0.2 │      │   │
│  │                          └───────────┘      │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Comandos Docker

```bash
# Construir e iniciar todos los servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f
docker logs travelbrain-backend --tail 50

# Ver estado
docker-compose ps
docker stats

# Reconstruir un servicio específico
docker-compose up -d --build frontend

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Ejecutar comando en contenedor
docker exec -it travelbrain-backend sh
docker exec -it travelbrain-facial-recognition python --version

# Ver redes
docker network ls
docker network inspect travelbrainls_internal-network
```

---

## 📈 Monitoreo y Observabilidad

### Health Checks

```javascript
// Backend Health Check
GET /health
Response:
{
  "status": "OK",
  "timestamp": "2026-01-20T01:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "database": "connected",
  "services": {
    "facial": "healthy"
  }
}

// Facial Service Health Check
GET http://facial-recognition:8001/health
Response:
{
  "status": "healthy",
  "timestamp": "2026-01-20T01:00:00Z",
  "version": "1.0.0"
}
```

### Métricas Recomendadas

```yaml
Performance:
  - Response time (p50, p95, p99)
  - Throughput (requests/second)
  - Error rate (4xx, 5xx)
  - Database query time
  - Cache hit rate

Security:
  - Failed login attempts
  - JWT token validation failures
  - Rate limit hits
  - Biometric verification failures
  - Challenge token abuse

Business:
  - New user registrations
  - Biometric enrollments
  - Successful logins (traditional vs biometric)
  - Weather searches
  - Trip creations
```

### Logging

```javascript
// Request Logger Middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const emoji = res.statusCode >= 400 ? '⚠️' : '✅';
    
    console.log(`${emoji} [${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};
```

---

## 🚀 Mejoras Futuras

### Escalabilidad

```yaml
Horizontal Scaling:
  - Load Balancer (Nginx/Traefik)
  - Múltiples instancias de Backend
  - Redis para sesiones compartidas
  - Message Queue (RabbitMQ/Kafka)

Vertical Scaling:
  - Aumentar recursos de Facial Service
  - Optimizar algoritmos de ML
  - Database indexing
  - Query optimization
```

### Seguridad Avanzada

```yaml
- Implementar 2FA (TOTP)
- API Key Management
- RBAC (Role-Based Access Control)
- Audit logs con SIEM
- DDoS protection (Cloudflare)
- WAF (Web Application Firewall)
- Secrets management (Vault)
```

### Características Adicionales

```yaml
- WebSockets para notificaciones en tiempo real
- GraphQL API como alternativa a REST
- Microservicio de notificaciones (Email/SMS)
- Integración con servicios de terceros (Google Maps, Amadeus)
- Machine Learning para recomendaciones
- Progressive Web App (PWA)
```

---

## 📚 Referencias

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Face Recognition Python](https://github.com/ageitgey/face_recognition)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 👥 Contribuidores

- Equipo TravelBrain Development
- Fecha: Enero 2026
- Versión: 1.0.0

---

**Nota:** Este documento debe actualizarse conforme evoluciona la arquitectura de la aplicación.
