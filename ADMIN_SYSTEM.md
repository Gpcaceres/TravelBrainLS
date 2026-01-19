# Sistema de Administración de Usuarios

## Descripción General

Se ha implementado un sistema completo de administración de usuarios que permite a los administradores gestionar el estado (activo/inactivo) y los roles de todos los usuarios del sistema.

## Características Implementadas

### 1. Backend - Middleware de Autenticación

**Archivo:** `backend-project/src/middlewares/auth.js`

- **`authenticate`**: Verifica el token JWT y valida que el usuario esté activo
- **`isAdmin`**: Verifica que el usuario tenga rol de administrador
- **`isAdminOrOwner`**: Permite acceso al administrador o al dueño del recurso

### 2. Backend - Endpoints de Administración

**Archivo:** `backend-project/src/controllers/userController.js`

#### Nuevos Endpoints:

1. **GET /users** (Admin only) - Con paginación y búsqueda
   - Query params:
     - `page` (default: 1): Número de página
     - `limit` (default: 10): Usuarios por página
     - `search`: Buscar por email, nombre o username
     - `status`: Filtrar por ACTIVE/INACTIVE
     - `role`: Filtrar por ADMIN/REGISTERED/USER
   - Respuesta incluye:
     - `data`: Array de usuarios
     - `pagination`: Información de paginación (currentPage, totalPages, totalUsers, hasNextPage, hasPrevPage)

2. **GET /users/stats** (Admin only)
   - Obtiene estadísticas de usuarios
   - Respuesta: Total de usuarios, usuarios por estado, usuarios por rol

3. **PATCH /users/:id/activate** (Admin only)
   - Activa un usuario
   - Cambia el status a 'ACTIVE'

4. **PATCH /users/:id/deactivate** (Admin only)
   - Desactiva un usuario
   - Cambia el status a 'INACTIVE'
   - No permite que un admin se desactive a sí mismo

5. **PATCH /users/:id/role** (Admin only)
   - Cambia el rol de un usuario
   - Roles válidos: ADMIN, REGISTERED, USER

#### Endpoints Actualizados con Protección:

- **GET /users** - Solo administradores
- **GET /users/:id** - Administrador o propietario
- **PUT /users/:id** - Administrador o propietario
- **POST /users** - Solo administradores
- **DELETE /users/:id** - Solo administradores

### 3. Backend - Validación en Login

**Archivo:** `backend-project/src/controllers/authController.js`

Se agregó validación para que usuarios inactivos no puedan iniciar sesión:

```javascript
if (user.status !== 'ACTIVE') {
  return res.status(403).json({
    success: false,
    message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
  });
}
```

### 4. Frontend - Panel de Administración

**Archivo:** `frontend-react/src/pages/Admin.jsx`

Panel completo de administración con:

- **Búsqueda avanzada:**
  - Campo de búsqueda en tiempo real
  - Busca en email, nombre y username simultáneamente
  - Botón para limpiar búsqueda
  - Icono visual de búsqueda

- **Filtros:**
  - Filtro por estado (Todos/Activos/Inactivos)
  - Filtro por rol (Todos/Admin/Registrado/Usuario)
  - Los filtros se combinan con la búsqueda

- **Paginación inteligente:**
  - 10 usuarios por página
  - Botones Anterior/Siguiente
  - Números de página clickeables
  - Muestra páginas alrededor de la actual
  - Indicador de página actual
  - Ellipsis (...) para saltos grandes
  - Total de páginas y usuarios

- **Estadísticas en tiempo real:**
  - Total de usuarios
  - Usuarios activos
  - Usuarios inactivos
  - Total de administradores

- **Tabla de gestión de usuarios:**
  - Email, nombre, username
  - Selector de rol (USER, REGISTERED, ADMIN)
  - Estado (Activo/Inactivo)
  - Fecha de creación
  - Botones de activar/desactivar

- **Acciones disponibles:**
  - Cambiar rol de usuario
  - Activar usuario
  - Desactivar usuario

### 5. Frontend - Integración en Dashboard

**Archivo:** `frontend-react/src/pages/Dashboard.jsx`

- Se agregó un enlace "Admin Panel" en el menú de usuario
- El enlace solo es visible para usuarios con rol 'ADMIN'
- Ubicado en el dropdown del menú superior

### 6. Frontend - Rutas Protegidas

**Archivo:** `frontend-react/src/App.jsx`

Se agregó la ruta `/admin` protegida que requiere autenticación.

## Modelo de Usuario

El modelo de usuario ya incluye los siguientes campos:

```javascript
{
  email: String,
  username: String,
  name: String,
  role: String,          // 'ADMIN', 'REGISTERED', 'USER'
  status: String,        // 'ACTIVE', 'INACTIVE'
  passwordHash: String,
  googleId: String,
  picture: String,
  tz: String,
  createdAt: Date
}
```

## Flujo de Uso

### Para Usuarios Regulares:

1. Los usuarios regulares pueden usar la aplicación normalmente
2. Si un admin desactiva su cuenta, no podrán iniciar sesión
3. Recibirán el mensaje: "Tu cuenta ha sido desactivada. Contacta al administrador."

### Para Administradores:

1. **Acceder al panel:**
   - Iniciar sesión como admin
   - Click en el menú de usuario (esquina superior derecha)
   - Seleccionar "Admin Panel"

2. **Ver estadísticas:**
   - Dashboard con métricas de usuarios
   - Visualización de totales y distribución

3. **Buscar usuarios:**
   - Usar el campo de búsqueda para encontrar usuarios específicos
   - La búsqueda es en tiempo real y busca en email, nombre y username
   - Click en la X para limpiar la búsqueda

4. **Filtrar usuarios:**
   - Usar los selectores de filtro para estado y rol
   - Los filtros se pueden combinar con la búsqueda
   - Select "Todos" para quitar un filtro

5. **Navegar entre páginas:**
   - Usar los botones Anterior/Siguiente
   - Click en números de página específicos
   - Ver información de página actual y total

6. **Gestionar usuarios:**
   - Ver todos los usuarios en tabla
   - Cambiar roles usando el selector
   - Activar/Desactivar usuarios con botones
   - Ver fecha de creación de cada usuario
   - Información de resultados mostrados

## Seguridad

### Validaciones Implementadas:

1. **Autenticación obligatoria:** Todos los endpoints requieren token JWT válido
2. **Verificación de estado:** Los usuarios inactivos no pueden iniciar sesión
3. **Autorización de admin:** Solo administradores pueden gestionar usuarios
4. **Auto-protección:** Un admin no puede desactivarse a sí mismo
5. **Validación de roles:** Solo se aceptan roles válidos (ADMIN, REGISTERED, USER)

### Respuestas de Error:

- **401 Unauthorized:** Token faltante, inválido o expirado
- **403 Forbidden:** Usuario inactivo o sin permisos de administrador
- **404 Not Found:** Usuario no encontrado
- **400 Bad Request:** Rol inválido o intento de auto-desactivación

## Estilos

**Archivo:** `frontend-react/src/styles/Admin.css`

- Diseño moderno con gradientes
- Cards con sombras y efectos hover
- Tabla responsive
- Badges de estado con colores distintivos
- Botones con animaciones
- Diseño adaptable (responsive)

## Testing

### Para probar la funcionalidad:

1. **Crear un usuario administrador:**
   - Registrar un usuario normal
   - Actualizar manualmente en MongoDB: `db.users.updateOne({email: "tu@email.com"}, {$set: {role: "ADMIN"}})`

2. **Acceder al panel:**
   - Iniciar sesión con el usuario admin
   - Navegar a `/admin` o usar el menú

3. **Probar funcionalidades:**
   - Cambiar roles de usuarios
   - Desactivar un usuario
   - Intentar iniciar sesión con usuario desactivado (debe fallar)
   - Reactivar el usuario
   - Verificar estadísticas

## Próximas Mejoras Sugeridas

1. Logs de auditoría para acciones de admin
2. ~~Búsqueda de usuarios~~ ✅ Implementado
3. ~~Paginación para grandes cantidades de usuarios~~ ✅ Implementado
4. Exportar lista de usuarios a CSV/Excel
5. Notificaciones por email cuando se desactiva una cuenta
6. Dashboard con gráficos de actividad de usuarios
7. Historial de cambios de rol
8. Confirmación antes de desactivar usuarios
9. Ordenamiento de columnas en la tabla
10. Bulk actions (acciones masivas)

## Notas Importantes

- Los cambios toman efecto inmediatamente
- Los usuarios desactivados pierden acceso al instante
- Las sesiones activas de usuarios desactivados seguirán funcionando hasta que expire el token JWT
- Se recomienda configurar un tiempo corto de expiración de tokens para mayor seguridad

## Endpoints de API Resumen

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | /users/stats | ✓ | Admin | Estadísticas de usuarios |
| GET | /users?page=1&limit=10&search=query&status=ACTIVE&role=USER | ✓ | Admin | Listar usuarios con paginación y búsqueda |
| GET | /users/:id | ✓ | Admin/Owner | Obtener usuario por ID |
| POST | /users | ✓ | Admin | Crear usuario |
| PUT | /users/:id | ✓ | Admin/Owner | Actualizar usuario |
| DELETE | /users/:id | ✓ | Admin | Eliminar usuario |
| PATCH | /users/:id/activate | ✓ | Admin | Activar usuario |
| PATCH | /users/:id/deactivate | ✓ | Admin | Desactivar usuario |
| PATCH | /users/:id/role | ✓ | Admin | Cambiar rol de usuario |

### Ejemplos de uso de la API:

#### Búsqueda de usuarios por email:
```bash
GET /users?search=john@example.com&page=1&limit=10
```

#### Filtrar usuarios activos:
```bash
GET /users?status=ACTIVE&page=1&limit=10
```

#### Filtrar por rol de administrador:
```bash
GET /users?role=ADMIN&page=1&limit=10
```

#### Combinar búsqueda y filtros:
```bash
GET /users?search=john&status=ACTIVE&role=USER&page=2&limit=10
```

#### Respuesta de paginación:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 47,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
