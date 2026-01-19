# 🖥️ Configuración de VM - 35.222.67.75

## 📝 Resumen de Cambios

Se ha actualizado toda la configuración del proyecto para usar la VM con IP `35.222.67.75` y nuevos puertos:

### Puertos Configurados

| Servicio | Puerto Anterior | Puerto Nuevo | Acceso |
|----------|----------------|--------------|---------|
| **Backend** | 3004 | **4000** | Público (0.0.0.0:4000) |
| **Frontend** | 5173 | **3001** | Público (0.0.0.0:3001) |
| **Python Microservice** | 8001 | 8001 | Solo red interna |

### URLs de Acceso

```
✅ Frontend:     http://35.222.67.75:3001
✅ Backend API:  http://35.222.67.75:4000
✅ Health Check: http://35.222.67.75:4000/health
```

---

## 📦 Archivos Modificados

### 1. Docker Compose
**Archivo:** `docker-compose.yml`
- ✅ Backend: puerto `4000:4000`
- ✅ Frontend: puerto `3001:3001`
- ✅ CORS_ORIGINS: `http://35.222.67.75:3001`
- ✅ VITE_API_URL: `http://35.222.67.75:4000`
- ✅ Healthcheck: `http://localhost:4000/health`

### 2. Frontend Configuration
**Archivo:** `frontend-react/src/config.js`
- ✅ BASE_URL: `http://35.222.67.75:4000`

**Archivo:** `frontend-react/vite.config.js`
```javascript
server: {
  port: 3001,
  host: true,
  strictPort: true
}
```

**Archivo:** `frontend-react/Dockerfile`
- ✅ EXPOSE 3001

### 3. Backend Configuration
**Archivo:** `backend-project/src/config/env.js`
- ✅ port: 4000
- ✅ corsOrigins: `['http://35.222.67.75:3001', 'http://localhost:3001', 'http://localhost:8000']`
- ✅ serverUrl: `http://35.222.67.75:4000`

### 4. Environment Variables
**Archivo:** `.env.example`
- ✅ PORT=4000
- ✅ CORS_ORIGINS=http://35.222.67.75:3001,http://localhost:3001

### 5. Documentación
- ✅ README.md - Arquitectura y URLs actualizadas
- ✅ SECURITY_ARCHITECTURE.md - Diagramas actualizados
- ✅ BIOMETRIC_AUTH_SYSTEM.md - Health check actualizado
- ✅ BUSINESS_RULES.md - Puerto y VM actualizados
- ✅ CHECK_ADMIN.md - URLs de testing actualizadas
- ✅ WEATHER_SETUP.md - HTTP referrers actualizados

---

## 🚀 Comandos de Despliegue

### 1. Detener servicios actuales (si están corriendo)
```bash
docker-compose down
```

### 2. Reconstruir imágenes con nueva configuración
```bash
docker-compose build --no-cache
```

### 3. Iniciar servicios
```bash
docker-compose up -d
```

### 4. Verificar estado
```bash
# Ver logs
docker-compose logs -f

# Verificar contenedores
docker ps

# Health check
curl http://35.222.67.75:4000/health
```

---

## 🔒 Configuración de Firewall (VM)

Asegúrate de abrir los siguientes puertos en tu VM:

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 4000/tcp  # Backend
sudo ufw allow 3001/tcp  # Frontend
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=4000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### Google Cloud Platform (GCP)
Si tu VM está en GCP, crea reglas de firewall:

```bash
# Permitir tráfico al backend
gcloud compute firewall-rules create allow-backend \
    --allow tcp:4000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags travelbrain-vm

# Permitir tráfico al frontend
gcloud compute firewall-rules create allow-frontend \
    --allow tcp:3001 \
    --source-ranges 0.0.0.0/0 \
    --target-tags travelbrain-vm

# Aplicar tags a tu VM
gcloud compute instances add-tags [NOMBRE-VM] \
    --tags travelbrain-vm \
    --zone [TU-ZONA]
```

---

## 🔍 Verificación Post-Despliegue

### 1. Backend Health Check
```bash
curl http://35.222.67.75:4000/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2026-01-19T...",
  "environment": "development"
}
```

### 2. Frontend Accessibility
```bash
curl -I http://35.222.67.75:3001

# Respuesta esperada:
HTTP/1.1 200 OK
```

### 3. CORS Configuration
```bash
curl -H "Origin: http://35.222.67.75:3001" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://35.222.67.75:4000/api/auth/login

# Debe incluir:
Access-Control-Allow-Origin: http://35.222.67.75:3001
```

### 4. Microservicio Python (Red Interna)
```bash
# Desde DENTRO del contenedor backend:
docker exec -it travelbrain-backend sh
curl http://facial-recognition:8001/health

# NO debe ser accesible desde fuera:
curl http://35.222.67.75:8001/health
# Debe fallar (Connection refused)
```

---

## 🌐 Configuración de APIs Externas

### Google Cloud Console (Mapbox, OAuth)
Actualizar URLs autorizadas:
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services > Credentials
3. Editar OAuth 2.0 Client ID
4. Agregar a "Authorized JavaScript origins":
   - `http://35.222.67.75:3001`
5. Agregar a "Authorized redirect URIs":
   - `http://35.222.67.75:3001/auth/callback`

### OpenWeather API (Weather Data)
Si tienes restricciones de dominio:
1. Ir a [OpenWeather Account](https://home.openweathermap.org/api_keys)
2. API Keys > API Key Settings
3. Agregar `35.222.67.75` a allowed domains

---

## 🐛 Troubleshooting

### Error: "Connection Refused" al acceder al frontend
```bash
# Verificar que Vite esté escuchando en 0.0.0.0
docker logs travelbrain-frontend

# Debe mostrar:
# VITE v5.x ready in X ms
# ➜  Local:   http://localhost:3001/
# ➜  Network: http://0.0.0.0:3001/
```

### Error: CORS al hacer peticiones
```bash
# Verificar variable de entorno
docker exec travelbrain-backend printenv | grep CORS

# Debe mostrar:
CORS_ORIGINS=http://35.222.67.75:3001,http://localhost:3001
```

### Error: "facial-recognition not found"
```bash
# Verificar red interna
docker network inspect travelbrain_internal-network

# Debe listar:
# - travelbrain-backend
# - travelbrain-facial-recognition
```

### Puerto ya en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :4000
sudo lsof -i :3001

# Matar proceso
sudo kill -9 [PID]
```

---

## 📋 Checklist de Migración

- [x] Actualizar docker-compose.yml con nuevos puertos
- [x] Actualizar frontend config.js con nueva IP
- [x] Actualizar vite.config.js con puerto 3001
- [x] Actualizar backend env.js con puerto 4000
- [x] Actualizar CORS origins
- [x] Actualizar .env.example
- [x] Actualizar toda la documentación
- [ ] Abrir puertos en firewall de VM
- [ ] Configurar reglas de firewall en GCP
- [ ] Actualizar OAuth redirect URIs en Google Cloud
- [ ] Actualizar allowed domains en OpenWeather
- [ ] Reconstruir imágenes Docker
- [ ] Iniciar servicios y verificar logs
- [ ] Probar health checks
- [ ] Probar login/registro desde frontend
- [ ] Probar API endpoints
- [ ] Verificar que Python microservice NO sea accesible externamente

---

## 📝 Notas Importantes

1. **Seguridad:** El microservicio Python (puerto 8001) NUNCA debe ser expuesto públicamente. Solo debe ser accesible por el backend a través de la red interna.

2. **HTTPS:** En producción, se recomienda usar un reverse proxy (Nginx/Caddy) con SSL:
   ```
   https://travelbrain.example.com → Frontend (3001)
   https://api.travelbrain.example.com → Backend (4000)
   ```

3. **Monitoreo:** Configurar logs centralizados y alertas:
   ```bash
   # Ver logs en tiempo real
   docker-compose logs -f --tail=100
   ```

4. **Backups:** Asegurar backups de:
   - MongoDB (datos de usuarios y biometría)
   - Variables de entorno (.env con claves maestras)
   - Certificados SSL (si se usan)

---

**Fecha de Configuración:** 19 de Enero 2026  
**VM IP:** 35.222.67.75  
**Backend Port:** 4000  
**Frontend Port:** 3001  
**Estado:** ✅ Configuración Completa
