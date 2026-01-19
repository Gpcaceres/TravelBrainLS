# 🧠 TravelBrain LS - Sistema Inteligente de Viajes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-green.svg)](./BIOMETRIC_AUTH_SYSTEM.md)

## 🌟 Características Principales

### 🗺️ Sistema de Planificación de Viajes
- Generación inteligente de itinerarios personalizados
- Integración con clima en tiempo real (OpenWeather API)
- Mapas interactivos con Mapbox
- Gestión de destinos y rutas favoritas

### 🔐 Autenticación Biométrica Avanzada (NUEVO)
- **Login facial con reconocimiento biométrico**
- **Anti-spoofing y liveness detection**
- **Cifrado AES-256-GCM de datos biométricos**
- **Arquitectura de microservicios segura**
- **Cumple con estándares enterprise de seguridad**

📖 [Ver documentación completa del sistema biométrico →](./BIOMETRIC_AUTH_SYSTEM.md)

### 👥 Gestión de Usuarios
- Autenticación con Google OAuth
- Sistema de roles (Admin, Registered, User)
- Perfiles de usuario personalizables

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────┐
│  Frontend React (Puerto 5173)              │
│  - UI/UX moderna con Vite                  │
│  - Autenticación biométrica con webcam    │
│  - Mapas interactivos                     │
└────────────┬────────────────────────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────────────┐
│  Backend Node.js (Puerto 3004)             │
│  - API RESTful con Express                 │
│  - JWT Authentication                      │
│  - Gestión de biometría                   │
└────┬────────────────────────────────┬───────┘
     │                                │
     ↓ (Red interna)                  ↓
┌────────────────────────┐   ┌───────────────┐
│ Microservicio Python   │   │ MongoDB Atlas │
│ Reconocimiento Facial  │   │ Base de Datos │
│ (Puerto 8001)          │   └───────────────┘
│ - Anti-spoofing        │
│ - Liveness detection   │
│ - SIN acceso Internet  │
└────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerequisitos
- Docker y Docker Compose (recomendado)
- O: Node.js 18+, Python 3.10+, MongoDB

### Instalación con Docker (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/Gpcaceres/TravelBrainLS.git
cd TravelBrainLS

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar claves de seguridad (CRÍTICO)
# Linux/Mac:
export INTERNAL_SERVICE_TOKEN=$(openssl rand -hex 32)
export BIOMETRIC_MASTER_KEY=$(openssl rand -base64 32 | head -c 32)

# Windows PowerShell:
$INTERNAL_SERVICE_TOKEN=[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
$BIOMETRIC_MASTER_KEY=[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))

# 4. Actualizar .env con las claves generadas

# 5. Ejecutar servicios
docker-compose up --build

# 6. Acceder a la aplicación
# Frontend: http://35.222.67.75:3001
# Backend API: http://35.222.67.75:4000
```

📘 [Guía detallada de inicio →](./QUICK_START.md)

---

## 📦 Estructura del Proyecto

```
TravelBrainLS/
├── backend-project/              # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── biometricController.js  # NUEVO: Biometría
│   │   │   └── ...
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── FacialBiometric.js      # NUEVO: Modelo biométrico
│   │   │   ├── BiometricChallenge.js   # NUEVO: Desafíos
│   │   │   ├── BiometricAuditLog.js    # NUEVO: Auditoría
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── biometricRoutes.js      # NUEVO: Rutas biométricas
│   │   │   └── ...
│   │   └── middlewares/
│   └── Dockerfile
│
├── facial-recognition-service/   # NUEVO: Microservicio Python
│   ├── main.py                   # FastAPI con reconocimiento facial
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── frontend-react/               # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── BiometricLogin.jsx           # NUEVO: Login básico
│   │   │   ├── BiometricLoginAdvanced.jsx   # NUEVO: Login avanzado
│   │   │   └── ...
│   │   ├── pages/
│   │   └── ...
│   ├── public/
│   │   └── models/               # Modelos de face-api.js
│   ├── download-models.sh        # NUEVO: Script descarga modelos
│   └── Dockerfile
│
├── docker-compose.yml            # Orquestación de servicios
├── .env.example                  # Variables de entorno de ejemplo
├── BIOMETRIC_AUTH_SYSTEM.md      # NUEVO: Documentación completa
├── QUICK_START.md                # NUEVO: Guía rápida
├── FACE_API_MODELS_SETUP.md      # NUEVO: Setup de modelos
└── README.md
```

---

## 🔐 Sistema de Autenticación Biométrica

### Flujo de Seguridad en 4 Pasos

1. **Solicitud de Permiso (Challenge)**
   - Token único de un solo uso
   - Expira en 120 segundos
   - Previene ataques de repetición

2. **Prueba de Vida (Liveness Detection)**
   - Detección de parpadeo real
   - Anti-spoofing avanzado
   - Análisis de textura y profundidad

3. **Análisis Biométrico (Microservicio Python)**
   - Extracción de características faciales
   - Vector de 128 dimensiones
   - Imagen destruida inmediatamente

4. **Verificación y Acceso**
   - Comparación con encoding almacenado (cifrado)
   - Distancia euclidiana
   - Generación de JWT token

### Capas de Seguridad

✅ **Data at Rest Encryption** - AES-256-GCM  
✅ **Liveness Detection** - Anti-spoofing multinivel  
✅ **Least Privilege Principle** - Microservicio aislado  
✅ **Network Isolation** - Red interna sin Internet  
✅ **Audit Logging** - Todos los intentos registrados  
✅ **Rate Limiting** - Protección contra fuerza bruta  

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **JWT** - Autenticación
- **Crypto** - Cifrado AES-256

### Microservicio Biométrico
- **Python 3.10+** - Lenguaje
- **FastAPI** - Framework web
- **face_recognition** - Reconocimiento facial
- **dlib** - Computer vision
- **OpenCV** - Procesamiento de imágenes
- **NumPy** - Cálculos matemáticos

### Frontend
- **React 19** - Librería UI
- **Vite** - Build tool
- **face-api.js** - Detección facial en navegador
- **React Router** - Navegación
- **Axios** - HTTP client

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación

---

## 📚 Documentación

- **[Sistema Biométrico Completo](./BIOMETRIC_AUTH_SYSTEM.md)** - Arquitectura, seguridad, flujos
- **[Guía Rápida de Inicio](./QUICK_START.md)** - Setup en 5 minutos
- **[Setup de Modelos Face-API](./FACE_API_MODELS_SETUP.md)** - Configuración de ML
- **[API Reference](./API_REFERENCE.md)** - Endpoints y ejemplos (TODO)

---

## 🧪 Testing

### Probar Sistema Biométrico

```bash
# 1. Verificar servicios activos
docker ps

# 2. Verificar aislamiento del microservicio Python
curl http://localhost:8001/health
# Esperado: Connection refused ✅

# 3. Probar backend
curl http://localhost:3004/health
# Esperado: {"status":"OK"} ✅

# 4. Probar registro biométrico
# - Abrir http://localhost:5173
# - Login tradicional
# - Ir a Perfil → Configurar Biometría
# - Seguir instrucciones
```

---

## 🔒 Seguridad

### Variables de Entorno Críticas

⚠️ **NUNCA commitear estas claves a Git**

```env
INTERNAL_SERVICE_TOKEN=<generar-con-openssl>
BIOMETRIC_MASTER_KEY=<generar-con-openssl>
JWT_SECRET=<generar-con-openssl>
```

### Generar Claves Seguras

```bash
# Token interno (64 caracteres hex)
openssl rand -hex 32

# Master key (32 bytes base64)
openssl rand -base64 32 | head -c 32

# JWT Secret (64 caracteres hex)
openssl rand -hex 32
```

### Checklist Pre-Producción

- [ ] Cambiar todas las claves por defecto
- [ ] Configurar HTTPS/SSL
- [ ] Restringir CORS origins
- [ ] Implementar rate limiting
- [ ] Configurar firewall
- [ ] Backup de claves en vault
- [ ] Monitoreo de logs
- [ ] Plan de respuesta a incidentes

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

---

## 👥 Equipo

- **TravelBrain Development Team**
- Email: dev@travelbrain.com
- GitHub: [@Gpcaceres](https://github.com/Gpcaceres)

---

## 🙏 Agradecimientos

- [face_recognition](https://github.com/ageitgey/face_recognition) por la librería de reconocimiento facial
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) por detección facial en navegador
- [FastAPI](https://fastapi.tiangolo.com/) por el framework Python
- Comunidad open source

---

## 📊 Estado del Proyecto

- ✅ Sistema de viajes funcionando
- ✅ Autenticación biométrica implementada
- ✅ Anti-spoofing avanzado
- ✅ Cifrado extremo a extremo
- ✅ Docker compose configurado
- 🚧 Pruebas de penetración (en progreso)
- 📋 Certificación de seguridad (planificado)

---

**Última actualización:** Enero 19, 2026  
**Versión:** 1.0.0 - Biometric Security Release  
**Estado:** Production Ready 🚀