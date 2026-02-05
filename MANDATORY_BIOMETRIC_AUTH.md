# 🔐 Autenticación Multi-Factor (MFA) - Guía de Implementación

## 📅 Fecha de Implementación
**5 de Febrero de 2026**

---

## 🎯 Objetivo

Implementar un sistema de **autenticación multi-factor (MFA)** de 3 factores para TravelBrain, combinando:

1. ✅ **Email** (Identificación)
2. ✅ **Contraseña** (Algo que sabes - hasheada con bcrypt)
3. ✅ **Reconocimiento Facial** (Algo que eres - con prueba de vida)

Este sistema proporciona la máxima seguridad al requerir múltiples métodos de verificación antes de conceder acceso.

---

## 🔄 Arquitectura MFA

### Flujo Simplificado

```
LOGIN:
Usuario → Email + Contraseña → Validación Backend → 
Reconocimiento Facial → Verificación Biométrica → Acceso Concedido

REGISTRO:
Usuario → Datos + Contraseña → Cuenta Creada → 
Registro Biométrico (Obligatorio) → Login Disponible
```

### Diagrama Detallado

```
┌──────────────────────────────────────────────────────┐
│                  PÁGINA LOGIN                        │
│                                                      │
│  [Formulario]                                        │
│    Email: ________________                           │
│    Password: ____________                            │
│                                                      │
│    [🔑 Continue to Face Recognition]                │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│          BACKEND: Validación de Credenciales        │
│                                                      │
│  POST /api/auth/validate-credentials                │
│    ✓ Usuario existe en MongoDB                      │
│    ✓ Cuenta está activa                             │
│    ✓ bcrypt.compare(password, passwordHash)         │
│    ✓ Tiene biometría registrada                     │
│                                                      │
│  ❌ Falla → Error: "Credenciales inválidas"         │
│  ✅ Éxito → { success: true, hasBiometric: true }   │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│          FRONTEND: Modal Biométrico (Auto)           │
│                                                      │
│  🔒 Step 2/2: Facial Recognition Required           │
│  Authenticating: user@example.com                   │
│                                                      │
│  [Video Feed con detección facial]                  │
│                                                      │
│  Auto-inicia:                                        │
│    1. Solicita challenge token                      │
│    2. Detecta rostro                                 │
│    3. Prueba de vida (2 parpadeos)                  │
│    4. Captura y envía imagen                         │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│        BACKEND: Verificación Biométrica              │
│                                                      │
│  POST /api/biometric/verify                          │
│    ✓ Challenge token válido                         │
│    ✓ Rostro coincide con biometría almacenada       │
│    ✓ Genera JWT token                               │
│                                                      │
│  ✅ Éxito → { token, user }                          │
└──────────────────────────────────────────────────────┘
                        ↓
              🎉 ACCESO CONCEDIDO
              → Redirect to /dashboard
```

---

## ✅ Cambios Implementados

### 1. Backend - Deshabilitación del Login Tradicional

**Archivo:** `backend-project/src/controllers/authController.js`

```javascript
/**
 * Simple Login - DISABLED
 * Login biométrico es ahora obligatorio para todos los usuarios
 * @route POST /api/auth/login
 * @deprecated Use /api/biometric/verify instead
 */
exports.simpleLogin = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message: 'El inicio de sesión tradicional está deshabilitado. Por favor, utilice el reconocimiento facial para iniciar sesión.',
      requiresBiometric: true
    });
  } catch (error) {
    console.error('Error en simple login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};
```

**Impacto:**
- ❌ El endpoint `/api/auth/login` ahora retorna un error 403
- ✅ Los usuarios son notificados que deben usar reconocimiento facial
- ✅ El endpoint `/api/biometric/verify` es la única forma de autenticarse

---

### 2. Frontend - Modificación de la Página de Login

**Archivo:** `frontend-react/src/pages/Login.jsx`

#### Cambios Principales:

1. **Eliminación del formulario tradicional:**
   - ❌ Campos de email y password eliminados
   - ❌ Botón "Sign In" tradicional eliminado
   - ❌ Función `handleSubmit` ya no es necesaria

2. **Nueva interfaz centrada en biometría:**
   ```jsx
   <div className="biometric-required-info">
     <div style={{ fontSize: '3rem' }}>🔐</div>
     <h3>Secure Biometric Authentication</h3>
     <p>
       For your security, facial recognition is now required 
       to access your account
     </p>
   </div>
   ```

3. **Modal biométrico siempre visible:**
   - El componente `BiometricLoginAdvanced` se muestra automáticamente
   - El modal tiene fondo oscuro para mayor enfoque
   - Se eliminó el botón de cerrar (×) para evitar evasión

**Estado inicial:**
```javascript
const [showBiometric, setShowBiometric] = useState(true)  // Antes era false
```

---

### 3. Frontend - Registro Biométrico Obligatorio

**Archivo:** `frontend-react/src/pages/Register.jsx`

#### Cambios:

1. **Modal de registro con advertencia clara:**
   ```jsx
   <div style={{ /* estilos */ }}>
     <p>🔒 Registro Biométrico Requerido</p>
     <p>El reconocimiento facial es obligatorio para acceder a tu cuenta</p>
   </div>
   ```

2. **Eliminación del callback `onSkip`:**
   - Los usuarios ya no pueden omitir el registro biométrico
   - Solo existe `onSuccess` y `onError`

3. **Manejo de errores mejorado:**
   - Si hay error en el registro biométrico, el usuario permanece en la página
   - Se muestra un mensaje de error claro

---

### 4. Componente BiometricRegister

**Archivo:** `frontend-react/src/components/BiometricRegister.jsx`

#### Cambios:

1. **Eliminación de la propiedad `onSkip`:**
   ```javascript
   // Antes:
   const BiometricRegister = ({ onSuccess, onError, onSkip }) => { ... }
   
   // Ahora:
   const BiometricRegister = ({ onSuccess, onError }) => { ... }
   ```

2. **Botón "Omitir por ahora" eliminado:**
   - Reemplazado por un mensaje informativo sobre la obligatoriedad
   
   ```jsx
   <div style={{
     marginTop: '1rem',
     padding: '0.75rem',
     background: 'rgba(71, 245, 154, 0.1)',
     borderRadius: '8px',
     border: '1px solid #47F59A',
     textAlign: 'center'
   }}>
     <p style={{ margin: 0, color: '#47F59A', fontSize: '0.85rem' }}>
       🔒 El registro biométrico es obligatorio para acceder a la aplicación
     </p>
   </div>
   ```

3. **Manejo de errores actualizado:**
   - En caso de error, se muestra botón para "Intentar Nuevamente"
   - El botón "Continuar sin biometría" fue removido

---

## 🔄 Flujo de Usuario Actualizado

### Nuevo Usuario (Registro)

```
1. Usuario completa formulario de registro
   ↓
2. Cuenta creada exitosamente
   ↓
3. Modal de registro biométrico aparece (NO SE PUEDE CERRAR)
   ↓
4. Usuario debe capturar su rostro
   ↓
5. Biometría registrada con éxito
   ↓
6. Redirigido a /login con mensaje de éxito
```

### Usuario Existente (Login)

```
1. Usuario navega a /login
   ↓
2. Solo ve la opción de reconocimiento facial
   ↓
3. Click en "Sign In with Face Recognition"
   ↓
4. Modal biométrico se abre automáticamente
   ↓
5. Sistema solicita desafío (challenge)
   ↓
6. Usuario posiciona su rostro y parpadea
   ↓
7. Verificación biométrica exitosa
   ↓
8. Acceso concedido → Dashboard
```

---

## 🔐 Consideraciones de Seguridad

### Ventajas de la Autenticación Obligatoria

1. **Eliminación de vectores de ataque comunes:**
   - ❌ Ataques de fuerza bruta a contraseñas
   - ❌ Phishing de credenciales
   - ❌ Reutilización de contraseñas comprometidas
   - ❌ Ingeniería social

2. **Autenticación fuerte por defecto:**
   - ✅ Factor biométrico (algo que eres)
   - ✅ Prueba de vida (anti-spoofing)
   - ✅ Desafíos únicos (nonce) por sesión
   - ✅ Tokens de sesión seguros

3. **Auditoría completa:**
   - ✅ Todos los intentos de acceso quedan registrados
   - ✅ Detección de anomalías más efectiva
   - ✅ Trazabilidad completa de accesos

### Consideraciones Importantes

⚠️ **Accesibilidad:**
- Asegurar que los usuarios tienen acceso a una cámara funcional
- Proporcionar soporte técnico para usuarios con dificultades

⚠️ **Recuperación de cuenta:**
- Considerar proceso de recuperación si el usuario no puede usar la cámara
- Puede requerir verificación manual o proceso administrativo

⚠️ **Privacidad:**
- Las imágenes faciales NO se almacenan
- Solo se guardan vectores matemáticos cifrados
- Cumplimiento con GDPR y regulaciones de privacidad

---

## 🧪 Testing y Verificación

### Tests a Realizar

1. **Flujo de Registro:**
   ```bash
   ✅ Usuario crea cuenta
   ✅ Modal biométrico aparece
   ✅ Botón "Skip" no está presente
   ✅ Captura facial exitosa
   ✅ Registro completo y redirección a login
   ```

2. **Flujo de Login:**
   ```bash
   ✅ Página de login solo muestra opción biométrica
   ✅ No hay formulario de email/password
   ✅ Modal se abre automáticamente
   ✅ Autenticación facial exitosa
   ✅ Acceso concedido al dashboard
   ```

3. **Intentos de Bypass:**
   ```bash
   ✅ POST directo a /api/auth/login → 403 Forbidden
   ✅ Cerrar modal biométrico en registro → No es posible
   ✅ Acceder directo a /dashboard sin token → Redirección a login
   ```

---

## 📝 Migraciones y Usuarios Existentes

### Usuarios Sin Biometría Registrada

Si existen usuarios en la base de datos sin biometría registrada:

1. **Al intentar login:**
   - El sistema solicitará el desafío
   - El backend verificará si hay biometría registrada
   - Si no existe, retornará error indicando que debe registrarla

2. **Proceso de migración recomendado:**
   - Enviar notificación a usuarios existentes
   - Solicitar que registren su biometría en el siguiente login
   - Período de gracia (opcional) con login tradicional habilitado temporalmente
   - Después del período, aplicar política estricta

### Script de Verificación

```javascript
// Script para verificar usuarios sin biometría
const User = require('./models/User');
const FacialBiometric = require('./models/FacialBiometric');

async function checkUsersWithoutBiometrics() {
  const users = await User.find({ status: 'ACTIVE' });
  
  for (const user of users) {
    const biometric = await FacialBiometric.findOne({ 
      userId: user._id, 
      isActive: true 
    });
    
    if (!biometric) {
      console.log(`Usuario sin biometría: ${user.email}`);
    }
  }
}
```

---

## 🚀 Despliegue

### Checklist Pre-Despliegue

- [ ] Backup de la base de datos
- [ ] Verificar que el servicio facial-recognition está funcionando
- [ ] Probar el flujo completo en ambiente de staging
- [ ] Notificar a usuarios sobre el cambio (si hay usuarios existentes)
- [ ] Documentar proceso de soporte para problemas de cámara
- [ ] Configurar monitoreo de logs de autenticación
- [ ] Preparar FAQ para usuarios

### Pasos de Despliegue

1. **Backend:**
   ```bash
   cd backend-project
   git pull origin main
   npm install
   pm2 restart travelbrainn-backend
   ```

2. **Frontend:**
   ```bash
   cd frontend-react
   git pull origin main
   npm install
   npm run build
   # Desplegar build/ al servidor web
   ```

3. **Verificación:**
   ```bash
   # Verificar que los servicios están corriendo
   curl http://localhost:3004/api/health
   curl http://localhost:8001/health
   
   # Intentar login tradicional (debe fallar)
   curl -X POST http://localhost:3004/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   
   # Respuesta esperada: {"success":false,"message":"El inicio de sesión tradicional está deshabilitado...","requiresBiometric":true}
   ```

---

## 📞 Soporte

### Problemas Comunes

**1. Usuario sin cámara:**
- Proporcionar acceso temporal mediante proceso manual
- Verificación de identidad por otro medio
- Activación temporal del login tradicional para ese usuario específico

**2. Cámara no funciona correctamente:**
- Verificar permisos del navegador
- Probar en navegador diferente
- Verificar que face-api.js modelos están cargados
- Revisar logs del navegador (Console)

**3. Reconocimiento facial falla:**
- Verificar iluminación adecuada
- Probar sin gafas/accesorios
- Verificar que el servicio Python está respondiendo
- Revisar logs del backend

---

## 📊 Métricas a Monitorear

1. **Tasa de éxito de autenticación biométrica:**
   - Meta: >95% de intentos exitosos

2. **Tiempo promedio de autenticación:**
   - Meta: <10 segundos desde captura hasta acceso

3. **Intentos de bypass:**
   - Monitorear intentos a /api/auth/login
   - Alertar si hay picos inusuales

4. **Usuarios bloqueados:**
   - Usuarios que no pueden completar registro biométrico
   - Proporcionar soporte proactivo

---

## 🔄 Rollback (En caso de emergencia)

Si es necesario revertir los cambios:

### 1. Backend
```javascript
// En authController.js, revertir simpleLogin a su versión anterior
exports.simpleLogin = async (req, res) => {
  // Código original con validación de email/password
  // ...
};
```

### 2. Frontend
```javascript
// En Login.jsx
const [showBiometric, setShowBiometric] = useState(false)  // Cambiar a false

// Restaurar formulario de email/password
// Restaurar función handleSubmit
```

### 3. Componentes
```javascript
// En BiometricRegister.jsx
const BiometricRegister = ({ onSuccess, onError, onSkip }) => {
  // Restaurar prop onSkip
  // Restaurar botones de omitir
}
```

---

## ✅ Conclusión

La implementación de autenticación biométrica obligatoria mejora significativamente la seguridad de TravelBrain al:

- Eliminar vulnerabilidades de autenticación tradicional
- Garantizar identidad verificada de todos los usuarios
- Proporcionar auditoría completa de accesos
- Cumplir con estándares de seguridad modernos

Para más información, consultar:
- [BIOMETRIC_AUTH_SYSTEM.md](./BIOMETRIC_AUTH_SYSTEM.md) - Documentación completa del sistema
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md) - Arquitectura de seguridad
- [QUICK_START.md](./QUICK_START.md) - Guía de inicio rápido

---

**Última actualización:** 5 de Febrero de 2026  
**Versión:** 1.0.0  
**Autor:** TravelBrain Development Team
