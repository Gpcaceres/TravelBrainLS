# Verificación de Usuario Administrador

## 1. Verificar en la Base de Datos

El usuario en MongoDB debe tener:
```
username: "1thopc"
email: "1thopc@travelbrain-2026"
role: "ADMIN"
status: "ACTIVE"
```

## 2. Verificar en el Backend

Ejecuta esta prueba desde la terminal o Postman:

### Login:
```bash
POST http://localhost:3004/api/auth/login
Content-Type: application/json

{
  "email": "1thopc@travelbrain-2026"
}
```

**Respuesta esperada debe incluir:**
```json
{
  "success": true,
  "token": "...",
  "user": {
    "_id": "...",
    "email": "1thopc@travelbrain-2026",
    "username": "1thopc",
    "name": "1thopc",
    "role": "ADMIN"    <-- DEBE DECIR ADMIN
  }
}
```

## 3. Verificar en el Frontend

### A. Abrir DevTools (F12)
1. Ir a **Application** > **Local Storage** > http://localhost:5173
2. Buscar la key `travelbrain_user`
3. Ver el valor JSON, debe contener:
```json
{
  "_id": "...",
  "email": "1thopc@travelbrain-2026",
  "username": "1thopc",
  "name": "1thopc",
  "role": "ADMIN"    <-- VERIFICAR ESTO
}
```

### B. En la Consola del navegador:
```javascript
// Ver usuario actual
JSON.parse(localStorage.getItem('travelbrain_user'))

// Debería mostrar role: "ADMIN"
```

## 4. Pasos para Forzar Actualización

### Opción A - Limpiar todo:
```javascript
// En la consola del navegador:
localStorage.clear()
sessionStorage.clear()
location.href = '/login'
```

### Opción B - Desde la app:
1. Click en tu nombre (esquina superior derecha)
2. Click en "Logout"
3. Volver a Login con: `1thopc@travelbrain-2026`

## 5. Verificar que aparece el botón Admin

Después de login exitoso:
1. Click en tu nombre (esquina superior derecha)
2. En el dropdown debes ver: **"Admin Panel"** (con icono de filtro)
3. Si no aparece, revisar los pasos anteriores

## 6. Debugging adicional

### Ver en la consola del navegador:
```javascript
// Ejecutar en DevTools Console:
const user = JSON.parse(localStorage.getItem('travelbrain_user'))
console.log('Usuario actual:', user)
console.log('Rol:', user?.role)
console.log('Es Admin?', user?.role === 'ADMIN')
```

## 7. Si aún no funciona

### Verificar que los cambios están en el servidor:
```bash
# En la terminal del backend:
docker-compose logs backend | grep "role"

# O entrar al contenedor:
docker-compose exec backend cat src/pages/Dashboard.jsx | grep "ADMIN"
```

### Reconstruir Docker completamente:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 8. URL Directa

Después de hacer login, intenta acceder directamente a:
```
http://localhost:5173/admin
```

Si te redirige al dashboard, es que no detecta el rol ADMIN.
Si te muestra "No tienes permisos", es que el middleware funciona pero el rol no es correcto.
Si carga el panel de admin, ¡funcionó! 🎉
