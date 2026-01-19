# 📋 Reglas de Negocio - TravelBrain

## 🎯 Descripción General
TravelBrain es una plataforma de planificación de viajes que integra información de destinos, clima, rutas favoritas y gestión de itinerarios personalizados.

---

## 👤 GESTIÓN DE USUARIOS

### Registro de Usuarios
- **BR-USR-001**: El email es obligatorio y debe ser único en el sistema
- **BR-USR-002**: El email se almacena siempre en minúsculas (lowercase)
- **BR-USR-003**: Los usuarios pueden tener roles: `ADMIN`, `REGISTERED`, `USER` (por defecto: `USER`)
- **BR-USR-004**: Los usuarios pueden tener estados: `ACTIVE`, `INACTIVE` (por defecto: `ACTIVE`)
- **BR-USR-005**: Username puede ser opcional, pero si se proporciona debe ser único
- **BR-USR-006**: Zona horaria por defecto: `America/Guayaquil`
- **BR-USR-007**: Password debe tener mínimo 6 caracteres (frontend)
- **BR-USR-008**: El username no puede tener menos de 3 caracteres

### Autenticación
- **BR-AUTH-001**: Solo se puede hacer login con usuarios existentes registrados
- **BR-AUTH-002**: El registro de nuevos usuarios solo se realiza mediante el endpoint `/api/auth/register`
- **BR-AUTH-003**: No se crean usuarios automáticamente durante el login
- **BR-AUTH-004**: Los tokens JWT tienen una expiración configurable (por defecto: 7 días)
- **BR-AUTH-005**: El token JWT incluye: userId, email, role
- **BR-AUTH-006**: Si el usuario no existe al hacer login, se retorna error 401
- **BR-AUTH-007**: Durante el registro, si el email o username ya existen, se retorna error 409
- **BR-AUTH-008**: Al hacer logout, se redirige a la página principal (home)

### Integración OAuth
- **BR-AUTH-009**: Se soporta autenticación con Google OAuth (googleId único)
- **BR-AUTH-010**: Los usuarios de Google pueden tener foto de perfil (picture)

---

## ✈️ GESTIÓN DE VIAJES (TRIPS)

### Creación de Viajes
- **BR-TRIP-001**: Cada viaje debe estar asociado a un usuario (userId obligatorio)
- **BR-TRIP-002**: El título del viaje es obligatorio
- **BR-TRIP-003**: El destino es obligatorio
- **BR-TRIP-004**: La fecha de inicio (startDate) es obligatoria
- **BR-TRIP-005**: La fecha de fin (endDate) es obligatoria
- **BR-TRIP-006**: El presupuesto (budget) debe ser mayor o igual a 0
- **BR-TRIP-007**: La descripción es opcional

### Validaciones de Viajes
- **BR-TRIP-008**: El sistema calcula automáticamente la duración del viaje en días
- **BR-TRIP-009**: La duración se calcula como: `Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))`
- **BR-TRIP-010**: Los viajes se indexan por userId para búsquedas rápidas
- **BR-TRIP-011**: Los viajes se indexan por rango de fechas (startDate, endDate)
- **BR-TRIP-012**: Los viajes se ordenan por fecha de creación descendente

---

## 📍 GESTIÓN DE DESTINOS

### Datos de Destinos
- **BR-DEST-001**: El nombre del destino es obligatorio
- **BR-DEST-002**: El país es obligatorio
- **BR-DEST-003**: Las coordenadas geográficas son obligatorias
  - Latitud: entre -90 y 90 grados
  - Longitud: entre -180 y 180 grados
- **BR-DEST-004**: La descripción es opcional
- **BR-DEST-005**: Puede incluir una imagen (img)
- **BR-DEST-006**: Puede estar asociado a un usuario específico (userId opcional)
- **BR-DEST-007**: Se indexan por nombre y país para búsquedas eficientes
- **BR-DEST-008**: Se indexan por coordenadas (lat, lng) para búsquedas geoespaciales

---

## 🛣️ RUTAS FAVORITAS

### Definición de Rutas
- **BR-ROUTE-001**: Cada ruta debe estar asociada a un usuario (userId obligatorio)
- **BR-ROUTE-002**: El nombre de la ruta es obligatorio
- **BR-ROUTE-003**: Debe tener un punto de origen con:
  - Latitud (entre -90 y 90)
  - Longitud (entre -180 y 180)
  - Etiqueta opcional (label)
- **BR-ROUTE-004**: Debe tener un punto de destino con:
  - Latitud (entre -90 y 90)
  - Longitud (entre -180 y 180)
  - Etiqueta opcional (label)

### Métricas de Rutas
- **BR-ROUTE-005**: La distancia (distanceKm) debe ser mayor o igual a 0
- **BR-ROUTE-006**: La duración (durationSec) debe ser mayor o igual a 0
- **BR-ROUTE-007**: Los modos de transporte permitidos son:
  - `driving` (conducir) - por defecto
  - `walking` (caminar)
  - `cycling` (ciclismo)
  - `transit` (transporte público)
- **BR-ROUTE-008**: Las rutas se indexan por userId para acceso rápido

---

## 🌤️ GESTIÓN DE CLIMA

### Búsquedas de Clima
- **BR-WEATHER-001**: Las coordenadas geográficas son obligatorias
  - Latitud: entre -90 y 90 grados
  - Longitud: entre -180 y 180 grados
- **BR-WEATHER-002**: La temperatura (temp) es obligatoria
- **BR-WEATHER-003**: La etiqueta del lugar (label) es opcional
- **BR-WEATHER-004**: Puede estar asociada a un usuario (userId opcional)

### Datos Meteorológicos
- **BR-WEATHER-005**: La condición climática (condition) es opcional
- **BR-WEATHER-006**: La humedad (humidity) debe estar entre 0 y 100%
- **BR-WEATHER-007**: La velocidad del viento (windSpeed) debe ser mayor o igual a 0
- **BR-WEATHER-008**: La presión atmosférica (pressure) debe ser mayor o igual a 0
- **BR-WEATHER-009**: La precipitación (precipitation) debe ser mayor o igual a 0
- **BR-WEATHER-010**: Se calcula automáticamente la temperatura en Fahrenheit: `(temp * 9/5) + 32`
- **BR-WEATHER-011**: Las búsquedas se ordenan por fecha de creación descendente

---

## 🔐 SEGURIDAD Y PERMISOS

### JWT y Tokens
- **BR-SEC-001**: Todos los tokens JWT deben incluir el userId
- **BR-SEC-002**: Los tokens expiran según configuración (por defecto: 7 días)
- **BR-SEC-003**: El secret JWT es configurable mediante variables de entorno
- **BR-SEC-004**: Los tokens inválidos o expirados retornan error 401

### CORS y Orígenes
- **BR-SEC-005**: Los orígenes CORS permitidos son configurables
- **BR-SEC-006**: Orígenes por defecto:
  - `http://35.239.79.6:5173` (producción)
  - `http://localhost:5173` (desarrollo)
  - `http://localhost:8000` (desarrollo alternativo)

---

## 🗄️ PERSISTENCIA DE DATOS

### Base de Datos
- **BR-DATA-001**: Se utiliza MongoDB como base de datos
- **BR-DATA-002**: Las fechas de creación (createdAt) se asignan automáticamente
- **BR-DATA-003**: Los timestamps automáticos están deshabilitados (timestamps: false)
- **BR-DATA-004**: Los IDs son ObjectId de MongoDB
- **BR-DATA-005**: Las operaciones de eliminación son físicas (deleteOne)

### Índices
- **BR-DATA-006**: Todos los modelos tienen índices por userId para búsquedas rápidas
- **BR-DATA-007**: Los usuarios tienen índices únicos en email y googleId
- **BR-DATA-008**: Los destinos tienen índices compuestos (nombre, país) y geoespaciales (lat, lng)
- **BR-DATA-009**: Los viajes tienen índices por rango de fechas
- **BR-DATA-010**: Las búsquedas de clima tienen índices geoespaciales

---

## 🌍 INTEGRACIONES EXTERNAS

### APIs de Terceros
- **BR-INT-001**: Se integra con OpenWeather API para datos meteorológicos
- **BR-INT-002**: Se utiliza Mapbox para mapas y rutas
- **BR-INT-003**: Las API keys son configurables mediante variables de entorno
- **BR-INT-004**: Google OAuth para autenticación social

### Configuración
- **BR-INT-005**: API Key de OpenWeather: configurable (OPENWEATHER_API_KEY)
- **BR-INT-006**: Token de Mapbox: configurable (MAPBOX_TOKEN)
- **BR-INT-007**: Google Client ID: configurable (GOOGLE_CLIENT_ID)

---

## 📊 CACHÉ Y RENDIMIENTO

### Estrategia de Caché
- **BR-CACHE-001**: Se utiliza caché en memoria para optimizar consultas
- **BR-CACHE-002**: El caché se invalida al crear, actualizar o eliminar registros
- **BR-CACHE-003**: Las rutas cacheadas incluyen: `/users`, `/trips`, `/destinations`

---

## 🔄 REGLAS DE VALIDACIÓN FRONTEND

### Formularios
- **BR-FE-001**: Email debe ser un formato válido
- **BR-FE-002**: Username mínimo 3 caracteres
- **BR-FE-003**: Nombre completo es requerido en registro
- **BR-FE-004**: Las contraseñas deben coincidir en registro
- **BR-FE-005**: Password mínimo 6 caracteres
- **BR-FE-006**: Los formularios muestran mensajes de error específicos

### Navegación
- **BR-FE-007**: Usuarios autenticados son redirigidos al dashboard
- **BR-FE-008**: Usuarios no autenticados son redirigidos a login cuando intentan acceder a rutas protegidas
- **BR-FE-009**: Al hacer logout se redirige a la página principal (/)
- **BR-FE-010**: El token y datos del usuario se almacenan en localStorage

---

## ⚙️ CONFIGURACIÓN DEL SISTEMA

### Variables de Entorno
- **BR-CFG-001**: Puerto del servidor: 3004 (configurable)
- **BR-CFG-002**: Entorno: development/production (NODE_ENV)
- **BR-CFG-003**: MongoDB URI y DB name son configurables
- **BR-CFG-004**: JWT secret y expiración son configurables
- **BR-CFG-005**: Zona horaria de la aplicación: America/Guayaquil (configurable)

---

## 📝 NOTAS ADICIONALES

### Limitaciones Actuales
1. No hay sistema de roles con permisos específicos implementado
2. No hay validación de contraseñas (hash) - sistema simplificado para desarrollo
3. No hay límite de intentos de login
4. No hay recuperación de contraseña
5. No hay verificación de email
6. No hay paginación en las listas

### Futuras Mejoras Sugeridas
1. Implementar bcrypt para hashing de contraseñas
2. Agregar sistema de roles y permisos
3. Implementar paginación en endpoints de listado
4. Agregar validación de fechas (endDate > startDate)
5. Implementar límite de rate limiting
6. Agregar soft delete en lugar de eliminación física
7. Implementar sistema de notificaciones
8. Agregar validación de presupuesto vs costos estimados

---

**Versión del Documento**: 1.0  
**Fecha de Última Actualización**: 11 de Enero 2026  
**Proyecto**: TravelBrain  
**Ambiente**: Producción en VM (35.239.79.6)
