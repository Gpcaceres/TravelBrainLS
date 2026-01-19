# 🔐 Sistema de Autenticación Biométrica Facial - TravelBrain

## 📋 Resumen Ejecutivo

Este documento describe la implementación completa de un sistema de autenticación biométrica facial de alta seguridad para la aplicación TravelBrain, siguiendo las mejores prácticas de la industria y cumpliendo con estándares de seguridad empresariales.

---

## 🏗️ Arquitectura del Sistema

### Principio de Capas de Seguridad (Defense in Depth)

```
┌─────────────────────────────────────────────────────┐
│              ZONA PÚBLICA (El Lobby)                │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Frontend React (Puerto 5173)               │  │
│  │  - Captura de video con webcam             │  │
│  │  - Detección de vida (parpadeo)            │  │
│  │  - Interfaz de usuario                     │  │
│  └─────────────────────────────────────────────┘  │
│                      ↓ HTTPS                       │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│          ZONA CONTROLADA (La Recepción)            │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Backend Node.js (Puerto 3004)              │  │
│  │  - Gestión de desafíos (nonce)             │  │
│  │  - Validación de tokens                    │  │
│  │  - Cifrado/descifrado AES-256              │  │
│  │  - Logs de auditoría                       │  │
│  │  - Control de acceso                       │  │
│  └─────────────────────────────────────────────┘  │
│                      ↓ HTTP Interno                │
│                (Solo red privada)                  │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│      ZONA RESTRINGIDA (La Bóveda/Laboratorio)      │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Microservicio Python (Puerto 8001)         │  │
│  │  - Reconocimiento facial (face_recognition)│  │
│  │  - Anti-spoofing detection                 │  │
│  │  - Liveness detection                      │  │
│  │  - Análisis de calidad de imagen           │  │
│  │  - SIN acceso a Internet                   │  │
│  │  - SIN acceso a base de datos              │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  MongoDB Atlas (Base de datos)              │  │
│  │  - Encodings cifrados (AES-256-GCM)        │  │
│  │  - Logs de auditoría                       │  │
│  │  - Desafíos temporales                     │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Flujo de Seguridad en 4 Pasos

### Paso 1: Solicitud de Permiso (Challenge Request)

**Objetivo:** Prevenir ataques de repetición (replay attacks)

1. Usuario ingresa email en frontend
2. Frontend solicita `POST /api/biometric/challenge`
3. Backend genera un **nonce** (token único) con:
   - Timestamp
   - Email del usuario
   - IP del cliente
   - User Agent
   - **Expiración: 120 segundos**

**Seguridad:**
- Token de un solo uso
- Auto-destrucción después de 2 minutos
- Vinculado al email específico
- No reutilizable

```javascript
// Estructura del desafío
{
  token: "a8f93bc8d...", // 64 caracteres hex
  email: "usuario@ejemplo.com",
  operation: "LOGIN",
  expiresIn: 120,
  createdAt: "2026-01-19T10:30:00Z"
}
```

### Paso 2: Prueba de Vida (Liveness Detection)

**Objetivo:** Prevenir spoofing (fotos, videos, máscaras)

#### Implementación Básica (BiometricLogin.jsx)
- Análisis de brillo en región de ojos
- Detección de cambios de estado (abierto/cerrado)
- Requiere 2 parpadeos consecutivos

#### Implementación Avanzada (BiometricLoginAdvanced.jsx)
Usando **face-api.js**:

1. **Detección de landmarks faciales (68 puntos)**
   - Ojos, nariz, boca, contorno facial

2. **Cálculo de Eye Aspect Ratio (EAR)**
   ```
   EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   ```
   - EAR < 0.25 → Ojo cerrado
   - EAR ≥ 0.25 → Ojo abierto
   - Transición cerrado→abierto = 1 parpadeo

3. **Análisis de expresiones faciales**
   - Detecta si es una cara estática (foto)

4. **Movimiento natural**
   - Micro-movimientos de cabeza
   - Variaciones en posición de landmarks

**Indicadores de vida exitosos:**
- ✅ 2 parpadeos detectados
- ✅ Movimientos naturales
- ✅ Profundidad 3D detectada

### Paso 3: Análisis y Extracción (Microservicio Python)

**Objetivo:** Extraer características matemáticas sin almacenar imágenes

Backend envía imagen al microservicio Python con:
- Header: `X-Internal-Token` (autenticación interna)
- Body: Imagen JPEG

El microservicio ejecuta:

1. **Detección de rostro**
   - Verifica que haya exactamente 1 rostro
   - Rechaza múltiples rostros

2. **Anti-Spoofing avanzado**
   - Análisis de textura (Laplaciano)
   - Detección de patrones moiré (pantallas)
   - Análisis de contraste
   - Medición de nitidez
   - Score de liveness: 0.0 - 1.0

3. **Evaluación de calidad**
   - Tamaño facial en imagen (mínimo 20%)
   - Iluminación uniforme
   - Enfoque adecuado

4. **Extracción de encoding**
   - Vector de 128 dimensiones (números flotantes)
   - Representación matemática única del rostro
   - **NO es la imagen**

5. **Destrucción de imagen**
   - Imagen eliminada de memoria inmediatamente
   - Solo se retorna el vector matemático

**Respuesta del microservicio:**
```json
{
  "encoding": [0.123, -0.456, ...], // 128 valores
  "confidence": 0.95,
  "liveness_score": 0.85,
  "face_detected": true,
  "quality_score": 0.90,
  "message": "Características extraídas exitosamente"
}
```

### Paso 4: Verificación y Comparación

**Objetivo:** Comparar identidad de forma segura

1. **Backend descifra encoding almacenado**
   - Lee de MongoDB el encoding cifrado
   - Usa BIOMETRIC_MASTER_KEY para descifrar
   - Algoritmo: AES-256-GCM
   - Verifica integridad con authTag

2. **Solicita comparación al microservicio**
   ```json
   POST /compare-faces
   {
     "encoding1": [...], // Del usuario actual
     "encoding2": [...], // Del almacenado
     "threshold": 0.6
   }
   ```

3. **Microservicio calcula distancia euclidiana**
   ```python
   distance = np.linalg.norm(enc1 - enc2)
   match = distance <= threshold
   confidence = 1.0 - distance
   ```

4. **Backend evalúa resultado**
   - ✅ Match → Genera JWT token
   - ❌ No match → Incrementa contador de fallos
   - Después de 5 fallos en 15 min → Bloqueo temporal

---

## 🛡️ Capas de Seguridad Implementadas

### 1. Data at Rest Encryption (Cifrado en Reposo)

**Problema:** Si hackean MongoDB, ¿pueden robar biometría?
**Solución:** Cifrado AES-256-GCM

#### Proceso de Cifrado (Registro)
```javascript
// 1. Generar salt único (32 bytes)
const salt = crypto.randomBytes(32);

// 2. Derivar clave con PBKDF2
const key = crypto.pbkdf2Sync(
  MASTER_KEY,    // Clave maestra del sistema
  salt,          // Salt único del usuario
  100000,        // 100k iteraciones
  32,            // 256 bits
  'sha512'
);

// 3. Generar IV único (16 bytes)
const iv = crypto.randomBytes(16);

// 4. Cifrar con AES-256-GCM
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = cipher.update(encodingBuffer);
const authTag = cipher.getAuthTag(); // Para verificar integridad
```

#### Almacenamiento en MongoDB
```javascript
{
  userId: ObjectId("..."),
  encryptedEncoding: Buffer, // Cifrado
  iv: Buffer,                // IV único
  authTag: Buffer,           // Tag de autenticación
  salt: Buffer,              // Salt único
  qualityScore: 0.90,
  livenessScore: 0.85
}
```

**Garantías:**
- Sin la MASTER_KEY, los datos son inútiles
- Cada usuario tiene salt único (no rainbow tables)
- Integridad verificada con authTag (no modificable)

### 2. Liveness Detection (Detección de Vida)

**Problema:** Atacante usa foto/video pregrabado
**Solución:** Múltiples técnicas anti-spoofing

#### En el Microservicio Python:

**a) Análisis de Textura**
```python
laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
# Fotos impresas tienen baja varianza
```

**b) Detección de Patrones Moiré**
```python
# FFT para detectar patrones periódicos de pantallas
f_transform = np.fft.fft2(gray)
magnitude_spectrum = np.abs(f_shift)
# Pantallas tienen picos anormales en frecuencia
```

**c) Análisis de Contraste**
```python
contrast = gray.std()
# Fotos de fotos tienen menos contraste
```

**d) Medición de Nitidez**
```python
blur_measure = cv2.Laplacian(gray, cv2.CV_64F).var()
# Impresiones suelen ser borrosas
```

**Score final ponderado:**
```python
liveness_score = (
    texture_score * 0.25 +
    contrast_score * 0.20 +
    brightness_score * 0.15 +
    moire_score * 0.25 +
    sharpness_score * 0.15
)
```

**Umbral:** liveness_score > 0.5 para aceptar

#### En el Frontend (face-api.js):

**Eye Aspect Ratio (EAR)** para detectar parpadeo real:
- Mide apertura del ojo en tiempo real
- Parpadeo natural: 100-400ms
- Videos en loop: timing irregular
- Fotos: EAR constante

### 3. Least Privilege Principle (Mínimo Privilegio)

**Implementación:**

#### Microservicio Python
```yaml
# NO tiene acceso a:
- Base de datos MongoDB ❌
- Internet externo ❌
- Sistema de archivos del host ❌

# Solo puede:
- Recibir peticiones del backend ✅
- Procesar imágenes en memoria ✅
- Devolver vectores matemáticos ✅
```

#### Usuario no-root
```dockerfile
# En Dockerfile
RUN useradd -m -u 1000 facialuser
USER facialuser
```

#### Red interna aislada
```yaml
# docker-compose.yml
internal-network:
  driver: bridge
  internal: true  # Sin acceso a Internet
```

---

## 📊 Modelo de Datos

### FacialBiometric (Colección MongoDB)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,             // Referencia a User
  encryptedEncoding: Buffer,    // 128D cifrado
  iv: Buffer,                   // 16 bytes
  authTag: Buffer,              // 16 bytes
  salt: Buffer,                 // 32 bytes
  qualityScore: Number,         // 0.0 - 1.0
  livenessScore: Number,        // 0.0 - 1.0
  registeredAt: Date,
  lastUpdated: Date,
  failedAttempts: Number,       // Contador de fallos
  lastFailedAttempt: Date,
  isActive: Boolean
}
```

### BiometricChallenge (Colección MongoDB)
```javascript
{
  _id: ObjectId,
  token: String,                // 64 char hex
  email: String,
  operation: "LOGIN" | "REGISTER" | "UPDATE",
  status: "PENDING" | "USED" | "EXPIRED",
  createdAt: Date,              // TTL: 120 segundos
  usedAt: Date,
  clientIp: String,
  userAgent: String
}
```

### BiometricAuditLog (Colección MongoDB)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  email: String,
  operation: String,
  result: "SUCCESS" | "FAILURE" | "ERROR",
  reason: String,
  metrics: {
    livenessScore: Number,
    qualityScore: Number,
    confidence: Number,
    matchDistance: Number
  },
  clientInfo: {
    ip: String,
    userAgent: String
  },
  timestamp: Date,              // TTL: 90 días
  processingTime: Number        // milisegundos
}
```

---

## 🚀 Despliegue y Configuración

### Requisitos del Sistema

**Backend (Node.js):**
- Node.js 18+
- 512MB RAM mínimo
- 1GB RAM recomendado

**Microservicio Python:**
- Python 3.10+
- 1GB RAM mínimo
- 2GB RAM recomendado
- CPU: 2 cores recomendado

### Instalación

1. **Clonar repositorio:**
```bash
git clone https://github.com/tu-repo/TravelBrainLS.git
cd TravelBrainLS
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
nano .env
```

**CRÍTICO - Cambiar estos valores:**
```env
INTERNAL_SERVICE_TOKEN=$(openssl rand -hex 32)
BIOMETRIC_MASTER_KEY=$(openssl rand -base64 32)
```

3. **Construir y ejecutar con Docker:**
```bash
docker-compose up --build
```

4. **Verificar servicios:**
```bash
# Backend
curl http://localhost:3004/health

# Microservicio Python (solo desde backend)
# Este comando fallará si la seguridad está correcta
curl http://localhost:8001/health
# Debería dar error de conexión (puerto no expuesto)
```

### Instalación Manual (Sin Docker)

#### Backend:
```bash
cd backend-project
npm install
npm run dev
```

#### Microservicio Python:
```bash
cd facial-recognition-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

#### Frontend:
```bash
cd frontend-react
npm install

# Descargar modelos de face-api.js
mkdir -p public/models
# Descargar desde: https://github.com/justadudewhohacks/face-api.js-models
# Colocar en public/models/

npm run dev
```

---

## 🔧 API Endpoints

### Endpoints de Biometría

#### 1. Solicitar Desafío
```http
POST /api/biometric/challenge
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "operation": "LOGIN"
}

Response 200:
{
  "success": true,
  "data": {
    "challengeToken": "a8f93bc8d...",
    "expiresIn": 120,
    "operation": "LOGIN"
  },
  "message": "Desafío generado"
}
```

#### 2. Verificar Biometría
```http
POST /api/biometric/verify
Content-Type: multipart/form-data

challengeToken: "a8f93bc8d..."
email: "usuario@ejemplo.com"
face: [imagen JPEG]

Response 200:
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "...",
      "email": "usuario@ejemplo.com",
      "name": "Usuario",
      "role": "USER"
    },
    "verification": {
      "confidence": 0.95,
      "method": "facial-biometric"
    }
  },
  "message": "Autenticación exitosa"
}
```

#### 3. Registrar Biometría
```http
POST /api/biometric/register
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

face: [imagen JPEG]

Response 200:
{
  "success": true,
  "data": {
    "registered": true,
    "qualityScore": 0.90,
    "livenessScore": 0.85
  },
  "message": "Biometría registrada"
}
```

#### 4. Estado de Biometría
```http
GET /api/biometric/status
Authorization: Bearer JWT_TOKEN

Response 200:
{
  "success": true,
  "data": {
    "registered": true,
    "isActive": true,
    "qualityScore": 0.90,
    "registeredAt": "2026-01-19T10:00:00Z",
    "lastUpdated": "2026-01-19T10:00:00Z"
  }
}
```

---

## 📈 Monitoreo y Logs

### Logs de Auditoría

Todos los intentos se registran en `BiometricAuditLog`:

**Ejemplo de log exitoso:**
```javascript
{
  userId: ObjectId("..."),
  email: "usuario@ejemplo.com",
  operation: "LOGIN_ATTEMPT",
  result: "SUCCESS",
  reason: "Identidad verificada exitosamente",
  metrics: {
    livenessScore: 0.85,
    qualityScore: 0.90,
    confidence: 0.95,
    matchDistance: 0.35
  },
  clientInfo: {
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0..."
  },
  timestamp: ISODate("2026-01-19T10:30:00Z"),
  processingTime: 2340
}
```

**Ejemplo de log fallido:**
```javascript
{
  userId: ObjectId("..."),
  email: "usuario@ejemplo.com",
  operation: "LOGIN_ATTEMPT",
  result: "FAILURE",
  reason: "Posible spoofing detectado",
  metrics: {
    livenessScore: 0.35,  // Bajo
    qualityScore: 0.60,
    confidence: 0.0
  },
  clientInfo: {
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0..."
  },
  timestamp: ISODate("2026-01-19T10:30:00Z"),
  processingTime: 1850
}
```

### Consultas de Análisis

**Intentos fallidos recientes:**
```javascript
db.biometric_audit_logs.find({
  result: "FAILURE",
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ timestamp: -1 })
```

**Usuarios con múltiples fallos:**
```javascript
db.biometric_audit_logs.aggregate([
  {
    $match: {
      result: "FAILURE",
      timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
    }
  },
  {
    $group: {
      _id: "$userId",
      failureCount: { $sum: 1 },
      lastAttempt: { $max: "$timestamp" }
    }
  },
  {
    $match: { failureCount: { $gte: 5 } }
  },
  {
    $sort: { failureCount: -1 }
  }
])
```

---

## ⚠️ Consideraciones de Producción

### 1. Escalabilidad

**Microservicio Python:**
- Escalar horizontalmente con múltiples instancias
- Usar load balancer interno
- Caché de modelos ML en memoria compartida

**Backend Node.js:**
- Pool de conexiones a MongoDB
- Rate limiting por IP
- Caché de encodings frecuentes (Redis)

### 2. Alta Disponibilidad

- Health checks cada 30 segundos
- Restart automático en fallos
- Circuit breaker para comunicación backend ↔ Python

### 3. Seguridad Adicional

**HTTPS Obligatorio:**
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

**Rate Limiting:**
```javascript
// Backend: express-rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: "Demasiados intentos. Intente más tarde."
});

app.use('/api/biometric', limiter);
```

**CORS Estricto:**
```javascript
cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  optionsSuccessStatus: 200
})
```

### 4. Backup y Recuperación

**Claves de cifrado:**
- Guardar BIOMETRIC_MASTER_KEY en secret manager (AWS Secrets, Azure Key Vault)
- Backup cifrado fuera del servidor
- Plan de rotación cada 90 días

**Base de datos:**
- Backup diario de MongoDB
- Retención de logs: 90 días
- Replica sets para redundancia

### 5. Cumplimiento Legal

- **GDPR/CCPA:** Usuario puede solicitar eliminación de biometría
- **Consentimiento explícito:** Mostrar términos antes de registro
- **Transparencia:** Informar qué datos se almacenan (solo vectores matemáticos)
- **Derecho al olvido:** Implementar endpoint de eliminación

---

## 🧪 Testing

### Test de Seguridad

**1. Intentar acceso directo al microservicio:**
```bash
curl http://localhost:8001/extract-features
# Esperado: Connection refused (puerto no expuesto)
```

**2. Intentar sin token interno:**
```bash
curl -X POST http://facial-recognition:8001/extract-features
# Esperado: 403 Forbidden
```

**3. Test de replay attack:**
```bash
# Usar mismo challengeToken dos veces
# Esperado: "Desafío inválido o expirado"
```

### Test de Funcionalidad

**1. Registro de biometría:**
```javascript
// Test: Usuario registra su rostro
POST /api/biometric/register
// Verificar: encoding cifrado en MongoDB
```

**2. Login exitoso:**
```javascript
// Test: Usuario autentica con rostro
POST /api/biometric/challenge
POST /api/biometric/verify
// Verificar: JWT token generado
```

**3. Detección de spoofing:**
```javascript
// Test: Enviar foto de una foto
// Esperado: liveness_score < 0.5
// Resultado: Login rechazado
```

---

## 📚 Referencias y Recursos

### Tecnologías Utilizadas

- **Backend:** Node.js, Express, Mongoose, Multer
- **Microservicio:** Python, FastAPI, face_recognition, OpenCV, dlib
- **Frontend:** React, face-api.js, Vite
- **Base de datos:** MongoDB Atlas
- **Contenedores:** Docker, Docker Compose

### Documentación Técnica

- [face_recognition](https://github.com/ageitgey/face_recognition)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)

### Papers Académicos

- Eye Aspect Ratio (EAR): Soukupová & Čech (2016)
- Face Anti-Spoofing: "Face Liveness Detection" (2019)
- AES-GCM: NIST Special Publication 800-38D

---

## 👥 Soporte y Mantenimiento

### Contacto
- **Equipo:** TravelBrain Development Team
- **Email:** dev@travelbrain.com

### Contribuciones
Ver [CONTRIBUTING.md](CONTRIBUTING.md)

### Licencia
Ver [LICENSE](LICENSE)

---

**Última actualización:** Enero 19, 2026  
**Versión del sistema:** 1.0.0  
**Estado:** Producción Ready ✅
