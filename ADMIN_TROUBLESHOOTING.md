# Guía de Resolución: Panel de Administración

## 🔍 Problema Reportado
"El backend de administrador no está trabajando, no hay comunicación con el CRUD"

## ✅ Verificación Realizada

### 1. Backend - Rutas Configuradas ✅
**Archivo**: `backend-project/src/routes/userRoutes.js`

Rutas disponibles:
```javascript
GET    /users              - Obtener todos los usuarios (Admin only)
GET    /users/stats        - Estadísticas de usuarios (Admin only)
GET    /users/:id          - Obtener usuario por ID (Admin o Owner)
POST   /users              - Crear usuario (Admin only)
PUT    /users/:id          - Actualizar usuario (Admin o Owner)
DELETE /users/:id          - Eliminar usuario (Admin only)
PATCH  /users/:id/activate - Activar usuario (Admin only)
PATCH  /users/:id/deactivate - Desactivar usuario (Admin only)
PATCH  /users/:id/role     - Cambiar rol de usuario (Admin only)
```

### 2. Backend - Controlador Implementado ✅
**Archivo**: `backend-project/src/controllers/userController.js`

Todos los métodos CRUD están implementados:
- `getAllUsers()` - Con paginación, búsqueda y filtros
- `getUserById()`
- `createUser()`
- `updateUser()`
- `deleteUser()`
- `activateUser()`
- `deactivateUser()`
- `changeUserRole()`
- `getUserStats()`

### 3. Backend - Rutas Montadas ✅
**Archivo**: `backend-project/src/app.js` (línea 55)

```javascript
app.use('/', userRoutes);
```

Las rutas están montadas correctamente en la raíz, por lo que son accesibles en `/users`.

### 4. Backend - Middleware de Autenticación ✅
**Archivo**: `backend-project/src/middlewares/auth.js`

Middlewares implementados:
- `authenticate` - Verifica token JWT
- `isAdmin` - Verifica rol ADMIN
- `isAdminOrOwner` - Verifica si es admin o el propietario del recurso

### 5. Frontend - Página de Admin Implementada ✅
**Archivo**: `frontend-react/src/pages/Admin.jsx`

Funcionalidades:
- Lista de usuarios con paginación
- Búsqueda de usuarios
- Filtros por estado y rol
- Activar/Desactivar usuarios
- Eliminar usuarios
- Cambiar roles
- Estadísticas

### 6. Frontend - Servicio API Configurado ✅
**Archivo**: `frontend-react/src/services/api.js`

- Interceptor que añade token JWT automáticamente
- Base URL configurada: `http://localhost:4000`
- Headers: `Authorization: Bearer <token>`

## 🔴 Posibles Causas del Problema

### Causa 1: Usuario No Tiene Rol ADMIN ⚠️

**Síntoma**: Error 403 (Forbidden) al acceder a `/users`

**Verificación**:
```javascript
// En el navegador, revisar localStorage
const user = JSON.parse(localStorage.getItem('travelbrain_user'));
console.log('Role:', user.role);
// Debe mostrar: "ADMIN"
```

**Solución**: Actualizar manualmente el rol del usuario en la base de datos.

#### Opción A: Usando MongoDB Compass
1. Conectar a MongoDB: `mongodb://localhost:27017`
2. Base de datos: `travelbrain`
3. Colección: `users`
4. Buscar el usuario por email
5. Editar el campo `role` a `"ADMIN"`
6. Guardar cambios

#### Opción B: Usando Mongo Shell
```bash
# Conectar a MongoDB
mongo

# Usar base de datos
use travelbrain

# Actualizar usuario
db.users.updateOne(
  { email: "tu-email@example.com" },
  { $set: { role: "ADMIN" } }
)

# Verificar
db.users.findOne({ email: "tu-email@example.com" })
```

#### Opción C: Crear Script de Backend
Crear `backend-project/scripts/create-admin.js`:
```javascript
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createAdmin() {
  await mongoose.connect('mongodb://localhost:27017/travelbrain');
  
  const email = 'admin@travelbrain.com';
  
  const user = await User.findOne({ email });
  if (user) {
    user.role = 'ADMIN';
    await user.save();
    console.log('✅ Usuario actualizado a ADMIN:', email);
  } else {
    console.log('❌ Usuario no encontrado:', email);
  }
  
  mongoose.disconnect();
}

createAdmin();
```

Ejecutar:
```bash
cd backend-project
node scripts/create-admin.js
```

### Causa 2: Token JWT No Se Guarda Después de Login MFA ⚠️

**Síntoma**: Error 401 (Unauthorized) al acceder a `/users`

**Verificación**:
```javascript
// En el navegador
const token = localStorage.getItem('travelbrain_token');
console.log('Token:', token);
// Si es null o undefined, el token no se guardó
```

**Solución**: Verificar que después del login MFA se guarde el token.

**Archivo a verificar**: `frontend-react/src/pages/Login.jsx`

Buscar la función `onBiometricSuccess`:
```javascript
const onBiometricSuccess = (authData) => {
  console.log('[Login MFA] Biometric success, authData:', authData);
  
  // VERIFICAR estas líneas:
  localStorage.setItem(STORAGE_KEYS.TOKEN, authData.token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));
  
  navigate('/dashboard');
};
```

### Causa 3: CORS Bloqueando Solicitudes ⚠️

**Síntoma**: Error de CORS en la consola del navegador

**Verificación**: Abrir DevTools → Console → Buscar errores de CORS

**Solución**: Verificar configuración CORS en backend.

**Archivo**: `backend-project/src/app.js`
```javascript
app.use(cors({
  origin: config.corsOrigins, // Debe incluir 'http://localhost:5173'
  credentials: true
}));
```

**Archivo**: `backend-project/src/config/env.js`
```javascript
corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173']
```

### Causa 4: Servicio Backend No Está Corriendo ⚠️

**Síntoma**: Error de conexión rechazada

**Verificación**:
```bash
# Verificar si el puerto 4000 está escuchando
curl http://localhost:4000/health

# En Windows PowerShell:
(Invoke-WebRequest -Uri http://localhost:4000/health).Content
```

**Solución**: Iniciar el backend
```bash
cd backend-project
npm start
```

### Causa 5: Base de Datos No Conectada ⚠️

**Síntoma**: Error 500 en las solicitudes

**Verificación**: Revisar logs del backend para errores de MongoDB

**Solución**: Verificar que MongoDB esté corriendo
```bash
# Verificar estado de MongoDB
# En Linux/Mac:
sudo systemctl status mongod

# En Windows (si se instaló como servicio):
# Services → MongoDB Server → Estado: Running
```

## 🚀 Lista de Verificación Paso a Paso

### Paso 1: Verificar Backend
```bash
cd backend-project
npm start
```
Debe mostrar:
```
Server running on port 4000
MongoDB conectado exitosamente
```

### Paso 2: Verificar Health Check
```bash
curl http://localhost:4000/health
```
Debe retornar:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123,
  "environment": "development"
}
```

### Paso 3: Verificar Frontend
```bash
cd frontend-react
npm run dev
```
Acceder a: `http://localhost:5173`

### Paso 4: Login MFA
1. Registrarse con email + password + biometría
2. Hacer login con los 3 factores
3. Verificar que llega al Dashboard

### Paso 5: Verificar Token en LocalStorage
Abrir DevTools → Application → Local Storage → `http://localhost:5173`

Debe contener:
- `travelbrain_token`: JWT token
- `travelbrain_user`: JSON con datos del usuario (incluyendo `role`)

### Paso 6: Verificar Rol ADMIN
```javascript
// En consola del navegador
const user = JSON.parse(localStorage.getItem('travelbrain_user'));
console.log('User role:', user.role);
```

Si el rol NO es `"ADMIN"`, actualizarlo en la base de datos (ver Causa 1).

### Paso 7: Acceder al Panel Admin
Navegar a: `http://localhost:5173/admin`

Si funciona, debe mostrar:
- Lista de usuarios
- Estadísticas
- Botones de acciones (Activar/Desactivar/Eliminar)

### Paso 8: Verificar Logs
**Backend Console**:
```
[Auth Middleware] Authorization header: Bearer eyJhbGc...
[Auth Middleware] Token decodificado - userId: 65abc...
[Auth Middleware] ✅ Usuario autenticado: user@example.com
Fetching users - Page: 1, Limit: 10, Search: ""
Found 5 users out of 5 total
```

**Frontend Console (DevTools)**:
```
[API Interceptor] Request to: /users
[API Interceptor] Token from localStorage: eyJhbGc...
[API Interceptor] Authorization header set
```

## 🔧 Soluciones Rápidas

### Solución 1: Recrear Usuario Admin Completo

```javascript
// backend-project/scripts/setup-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');

async function setupAdmin() {
  await mongoose.connect('mongodb://localhost:27017/travelbrain');
  
  const email = 'admin@travelbrain.com';
  const password = 'Admin123!';
  
  // Eliminar si existe
  await User.deleteOne({ email });
  
  // Crear nuevo
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({
    email,
    passwordHash: hashedPassword,
    name: 'Administrator',
    username: 'admin',
    role: 'ADMIN',
    status: 'ACTIVE'
  });
  
  await admin.save();
  console.log('✅ Admin creado:', email);
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  
  mongoose.disconnect();
}

setupAdmin();
```

### Solución 2: Verificar Token Manualmente

```bash
# Copiar el token de localStorage
# Ir a: https://jwt.io/
# Pegar el token
# Verificar el payload:
{
  "userId": "...",
  "email": "...",
  "role": "...",  // Debe ser "ADMIN"
  "authMethod": "biometric",
  "iat": ...,
  "exp": ...
}
```

### Solución 3: Endpoint de Test

Agregar endpoint temporal en `backend-project/src/app.js`:
```javascript
// Después de app.use('/api/auth', authRoutes);
app.get('/api/test-admin', authenticate, isAdmin, (req, res) => {
  res.json({
    message: 'Admin access verified',
    user: req.user
  });
});
```

Probar con:
```bash
curl -H "Authorization: Bearer <TU_TOKEN>" http://localhost:4000/api/test-admin
```

## 📝 Logs de Depuración

Para habilitar logs detallados, agregar en `backend-project/src/middlewares/auth.js`:

```javascript
exports.isAdmin = (req, res, next) => {
  console.log('[isAdmin] Verificando rol del usuario');
  console.log('[isAdmin] req.user:', req.user);
  console.log('[isAdmin] role:', req.user?.role);
  
  if (!req.user) {
    console.log('[isAdmin] ❌ No hay usuario autenticado');
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.role !== 'ADMIN') {
    console.log('[isAdmin] ❌ Usuario no es ADMIN, rol actual:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  
  console.log('[isAdmin] ✅ Usuario es ADMIN');
  next();
};
```

## 📞 Próximos Pasos

1. ✅ Verificar que el backend esté corriendo
2. ✅ Verificar que MongoDB esté conectado
3. ✅ Verificar que el usuario tenga rol ADMIN
4. ✅ Verificar que el token se guarde después del login
5. ✅ Verificar que el token se envíe en las solicitudes
6. ✅ Probar acceso al panel de administración

Si después de seguir todos los pasos el problema persiste, compartir:
- Logs del backend (consola donde corre `npm start`)
- Logs del frontend (DevTools → Console)
- Captura de pantalla del error

---

**Fecha**: 2024-01-28
**Sistema**: TravelBrain Admin Panel
**Versión**: 1.0.0
