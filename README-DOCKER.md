# TravelBrain - Docker Setup

## 🚀 Inicio Rápido

### Requisitos Previos
- Docker Desktop instalado
- Docker Compose instalado

### Levantar el Proyecto

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# O en modo detached (segundo plano)
docker-compose up -d --build
```

### Acceder a los Servicios

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3004

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Ver logs solo del frontend
docker-compose logs -f frontend

# Detener los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir los servicios
docker-compose up --build

# Ver contenedores en ejecución
docker-compose ps
```

### Estructura de Servicios

- **backend**: API REST en Node.js/Express (Puerto 3004)
- **frontend**: Aplicación React con Vite (Puerto 5173)

### Variables de Entorno

Las variables de entorno están configuradas en el archivo `docker-compose.yml`. Para cambiarlas:

1. Edita el archivo `docker-compose.yml`
2. Reinicia los servicios: `docker-compose restart`

### Desarrollo

Los volúmenes están montados para desarrollo en tiempo real:
- Cambios en `backend-project/` se reflejan automáticamente
- Cambios en `frontend-react/` se reflejan automáticamente (hot reload)

### Troubleshooting

Si tienes problemas:

```bash
# Limpiar todo y empezar de nuevo
docker-compose down -v
docker system prune -a
docker-compose up --build
```
