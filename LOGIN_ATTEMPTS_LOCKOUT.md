# Sistema de Bloqueo por Intentos Fallidos de Login

## 📋 Resumen
Se implementó un sistema de seguridad que **bloquea temporalmente** a los usuarios después de **3 intentos fallidos** de autenticación biométrica.

## 🔒 Características Implementadas

### 1. Límite de Intentos
- **Intentos permitidos**: 3
- **Duración del bloqueo**: 15 minutos
- **Desbloqueo automático**: Sí, después de 15 minutos

### 2. Modificaciones en el Modelo

**Archivo**: `backend-project/src/models/FacialBiometric.js`

#### Nuevos Campos:
```javascript
// Timestamp hasta cuando la cuenta está bloqueada
lockedUntil: {
  type: Date,
  default: null
}
```

#### Nuevos Métodos:

**`incrementFailedAttempts()`**
- Incrementa el contador de intentos fallidos
- Bloquea la cuenta por 15 minutos al alcanzar 3 intentos
- Registra `lockedUntil` con timestamp futuro

**`isLocked()`**
- Verifica si la cuenta está bloqueada actualmente
- Retorna `true` si `lockedUntil` es mayor a la fecha actual
- Retorna `false` si el bloqueo ya expiró

**`getRemainingLockTime()`**
- Calcula el tiempo restante de bloqueo en segundos
- Retorna 0 si no está bloqueada

### 3. Modificaciones en el Controlador

**Archivo**: `backend-project/src/controllers/biometricController.js`

#### Lógica de Bloqueo:
```javascript
// Verificar bloqueo temporal antes de procesar
if (storedBiometric.isLocked()) {
  const remainingSeconds = storedBiometric.getRemainingLockTime();
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  
  return res.status(423).json({ // 423 Locked
    success: false,
    message: `Demasiados intentos fallidos. Cuenta bloqueada por ${remainingMinutes} minuto(s).`,
    lockedUntil: storedBiometric.lockedUntil,
    remainingSeconds: remainingSeconds,
    failedAttempts: storedBiometric.failedAttempts
  });
}
```

#### Desbloqueo Automático:
```javascript
// Si el bloqueo expiró, resetear intentos fallidos
if (storedBiometric.lockedUntil && storedBiometric.lockedUntil < new Date()) {
  storedBiometric.failedAttempts = 0;
  storedBiometric.lockedUntil = null;
  await storedBiometric.save();
  console.log(`[Security] Bloqueo expirado para usuario ${email}. Intentos reseteados.`);
}
```

### 4. Modificaciones en el Frontend

**Archivo**: `frontend-react/src/components/BiometricLoginAdvanced.jsx`

#### Manejo del Error 423 (Locked):
```javascript
if (response.status === 423) {
  const remainingMinutes = data.remainingSeconds ? Math.ceil(data.remainingSeconds / 60) : 15;
  throw new Error(
    `🔒 Cuenta bloqueada por ${remainingMinutes} minuto(s) debido a ${data.failedAttempts || 3} intentos fallidos. ` +
    `Por favor, espere antes de intentar nuevamente.`
  );
}
```

## 🔄 Flujo de Seguridad

### Escenario 1: Intentos Fallidos
1. Usuario intenta login biométrico
2. Falla la verificación (rostro no coincide, mala calidad, etc.)
3. Sistema incrementa `failedAttempts`
4. Si llega a 3, se establece `lockedUntil = now + 15 minutos`
5. Usuario ve mensaje: "🔒 Cuenta bloqueada por X minuto(s)"

### Escenario 2: Login Exitoso
1. Usuario completa verificación biométrica exitosamente
2. Sistema ejecuta `resetFailedAttempts()`
3. Se resetean: `failedAttempts = 0`, `lockedUntil = null`
4. Usuario recibe token JWT y accede al sistema

### Escenario 3: Desbloqueo Automático
1. Usuario espera 15 minutos
2. Intenta login nuevamente
3. Sistema detecta que `lockedUntil < now`
4. Resetea automáticamente los intentos
5. Permite nueva autenticación

## 📊 Respuestas HTTP

### 423 Locked (Cuenta Bloqueada)
```json
{
  "success": false,
  "message": "Demasiados intentos fallidos. Cuenta bloqueada por 14 minuto(s).",
  "lockedUntil": "2024-01-28T15:45:00.000Z",
  "remainingSeconds": 840,
  "failedAttempts": 3
}
```

### 401 Unauthorized (Verificación Fallida)
```json
{
  "success": false,
  "message": "No se pudo verificar la identidad"
}
```

### 200 OK (Login Exitoso)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER"
    },
    "verification": {
      "confidence": 0.95,
      "method": "facial-biometric"
    }
  },
  "message": "Autenticación biométrica exitosa"
}
```

## 🧪 Cómo Probar

### Prueba 1: Bloqueo por Intentos Fallidos
1. Registrar un usuario con biometría facial
2. Intentar login con una foto diferente (o sin rostro)
3. Repetir 3 veces
4. Verificar mensaje de bloqueo con tiempo restante
5. Intentar login inmediatamente → Debe rechazar con 423

### Prueba 2: Desbloqueo Automático
1. Esperar 15 minutos después del bloqueo
2. Intentar login con biometría correcta
3. Debe permitir autenticación exitosamente

### Prueba 3: Login Exitoso Resetea Intentos
1. Fallar 2 intentos de login
2. Hacer un login exitoso en el tercer intento
3. Verificar que los intentos se resetean
4. Realizar 3 intentos fallidos nuevos
5. Debe bloquear solo después de los 3 nuevos intentos

## 📝 Logs de Auditoría

Todos los intentos se registran en `BiometricAuditLog`:

```javascript
{
  userId: ObjectId,
  email: "user@example.com",
  operation: "LOGIN_ATTEMPT",
  result: "FAILURE",
  reason: "Cuenta bloqueada temporalmente. 14 minuto(s) restantes",
  metrics: {
    failedAttempts: 3,
    remainingLockSeconds: 840
  },
  clientInfo: {
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0..."
  },
  processingTime: 1234
}
```

## ⚙️ Configuración

### Cambiar Límite de Intentos
Editar en `backend-project/src/models/FacialBiometric.js`:
```javascript
// Cambiar de 3 a otro número
if (this.failedAttempts >= 3) {
  // ...
}
```

### Cambiar Duración del Bloqueo
Editar en `backend-project/src/models/FacialBiometric.js`:
```javascript
// Cambiar 15 minutos a otra duración
this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
// Para 30 minutos: 30 * 60 * 1000
// Para 1 hora: 60 * 60 * 1000
```

## 🔐 Seguridad Adicional

### Medidas Implementadas:
1. ✅ Contador de intentos fallidos por usuario
2. ✅ Bloqueo temporal automático
3. ✅ Desbloqueo automático después del tiempo
4. ✅ Reset de intentos en login exitoso
5. ✅ Logs de auditoría de todos los intentos
6. ✅ Timestamps de último intento fallido

### Medidas Recomendadas (Futuras):
- [ ] Notificación por email al usuario cuando es bloqueado
- [ ] Panel de administración para desbloquear manualmente
- [ ] Incremento progresivo del tiempo de bloqueo (ej: 15min, 30min, 1h)
- [ ] Alerta a administradores después de múltiples bloqueos
- [ ] Registro de IP y dispositivo para detección de patrones

## 🚀 Despliegue

### Verificar Instalación:
```bash
# Backend
cd backend-project
npm install
npm start

# Verificar logs
# Buscar: "[Security] Usuario bloqueado hasta:"
```

### Reconstruir Docker (si usa Docker):
```bash
docker-compose down
docker-compose up --build
```

## 📞 Soporte

Si un usuario legítimo es bloqueado:
1. Esperar 15 minutos para desbloqueo automático
2. O contactar al administrador para desbloqueo manual (requiere agregar endpoint)

---

**Fecha de Implementación**: 2024-01-28
**Versión**: 1.0.0
**Desarrollado para**: TravelBrain Multi-Factor Authentication System
