# Microservicio de Reconocimiento Facial

## 🔒 Seguridad y Arquitectura

Este microservicio implementa reconocimiento facial con las siguientes capas de seguridad:

### 1. Aislamiento de Red
- **NO expuesto a Internet**: Solo accesible desde la red interna de Docker
- **Autenticación interna**: Requiere token de servicio para todas las operaciones
- **Principio de mínimo privilegio**: Usuario no-root, sin acceso a base de datos

### 2. Anti-Spoofing y Liveness Detection
- **Análisis de textura**: Detecta patrones de impresión
- **Análisis de profundidad**: Diferencia rostros 2D vs 3D
- **Detección de patrones moiré**: Identifica pantallas y fotos
- **Análisis de contraste y nitidez**: Verifica autenticidad

### 3. Privacidad de Datos
- **Sin almacenamiento de imágenes**: Las imágenes se destruyen después del procesamiento
- **Solo vectores matemáticos**: Se retornan embeddings de 128 dimensiones
- **Logging seguro**: Solo se registran hashes y métricas, nunca imágenes

### 4. Análisis de Calidad
- **Tamaño facial óptimo**: Verifica que la cara ocupe suficiente espacio
- **Iluminación uniforme**: Evalúa condiciones de luz
- **Nitidez**: Asegura que la imagen esté enfocada

## 📋 Endpoints

### GET /health
Verifica el estado del servicio.

### POST /extract-features
Extrae características faciales de una imagen.

**Headers requeridos:**
- `X-Internal-Token`: Token de autenticación interna

**Body:**
- `file`: Imagen del rostro (multipart/form-data)

**Response:**
```json
{
  "encoding": [0.123, -0.456, ...], // 128 valores
  "confidence": 0.95,
  "liveness_score": 0.85,
  "face_detected": true,
  "quality_score": 0.90,
  "message": "Características faciales extraídas exitosamente"
}
```

### POST /compare-faces
Compara dos encodings faciales.

**Headers requeridos:**
- `X-Internal-Token`: Token de autenticación interna

**Body:**
```json
{
  "encoding1": [0.123, -0.456, ...],
  "encoding2": [0.125, -0.454, ...],
  "threshold": 0.6
}
```

**Response:**
```json
{
  "match": true,
  "distance": 0.35,
  "confidence": 0.95,
  "message": "Identidad verificada con 95% de confianza"
}
```

## 🚀 Uso en Producción

### Variables de Entorno Requeridas
```bash
INTERNAL_SERVICE_TOKEN=tu_token_secreto_aqui
```

### Consideraciones de Seguridad
1. **Cambiar el token interno** en producción
2. **Solo comunicación con backend** autorizado
3. **No exponer puerto 8001** a Internet
4. **Usar HTTPS** en comunicaciones (manejado por backend)
5. **Monitorear logs** de intentos de acceso

## 🛠️ Tecnologías
- **FastAPI**: Framework web moderno
- **face_recognition**: Librería de reconocimiento facial (basada en dlib)
- **OpenCV**: Procesamiento de imágenes
- **NumPy**: Operaciones matemáticas
- **Pydantic**: Validación de datos

## ⚠️ Advertencias
- Este servicio debe ejecutarse SOLO en red interna
- NUNCA exponer directamente a Internet
- Las imágenes se procesan y destruyen inmediatamente
- Los logs no contienen información biométrica sensible
