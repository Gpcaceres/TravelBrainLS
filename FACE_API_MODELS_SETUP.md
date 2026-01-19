# 🔐 Instrucciones para Instalar y Usar los Modelos de face-api.js

## 📥 Descargar Modelos

Los modelos de face-api.js son necesarios para el componente avanzado de login biométrico (`BiometricLoginAdvanced.jsx`).

### Opción 1: Descarga Automática (Recomendado)

```bash
cd frontend-react
npm run download-models
```

### Opción 2: Descarga Manual

1. **Crear directorio de modelos:**
```bash
cd frontend-react/public
mkdir -p models
cd models
```

2. **Descargar archivos necesarios:**

**En Linux/Mac:**
```bash
# Tiny Face Detector
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-shard1

# Face Landmarks (68 puntos)
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-shard1

# Face Expressions
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-shard1
```

**En Windows PowerShell:**
```powershell
# Tiny Face Detector
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-weights_manifest.json" -OutFile "tiny_face_detector_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-shard1" -OutFile "tiny_face_detector_model-shard1"

# Face Landmarks
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-weights_manifest.json" -OutFile "face_landmark_68_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-shard1" -OutFile "face_landmark_68_model-shard1"

# Face Expressions
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-weights_manifest.json" -OutFile "face_expression_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-shard1" -OutFile "face_expression_model-shard1"
```

### Opción 3: Descarga desde GitHub

1. Visitar: https://github.com/justadudewhohacks/face-api.js-models
2. Descargar el repositorio completo como ZIP
3. Extraer los siguientes archivos a `frontend-react/public/models/`:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_expression_model-weights_manifest.json`
   - `face_expression_model-shard1`

## 📁 Estructura Final

Después de descargar, la estructura debe verse así:

```
frontend-react/
├── public/
│   ├── models/
│   │   ├── tiny_face_detector_model-weights_manifest.json
│   │   ├── tiny_face_detector_model-shard1
│   │   ├── face_landmark_68_model-weights_manifest.json
│   │   ├── face_landmark_68_model-shard1
│   │   ├── face_expression_model-weights_manifest.json
│   │   └── face_expression_model-shard1
│   └── ...
└── ...
```

## ✅ Verificar Instalación

1. **Iniciar el servidor de desarrollo:**
```bash
cd frontend-react
npm run dev
```

2. **Abrir navegador:** `http://localhost:5173`

3. **Verificar en consola:**
   - Debe aparecer: "Modelos cargados correctamente"
   - NO debe aparecer: "Error cargando modelos"

4. **Probar componente:**
   - Navegar a la página de login biométrico
   - La cámara debe iniciar
   - Los landmarks faciales deben dibujarse sobre tu rostro en tiempo real

## ⚠️ Solución de Problemas

### Error: "Failed to fetch models"

**Causa:** Archivos no están en la ubicación correcta

**Solución:**
```bash
# Verificar que los archivos existen
ls -la frontend-react/public/models/

# Debe mostrar los 6 archivos listados arriba
```

### Error: "CORS policy blocked"

**Causa:** Modelos servidos desde dominio externo

**Solución:** Asegurar que los modelos están en `public/models/` (no cargados desde CDN)

### Modelos Cargan Lento

**Causa:** Archivos grandes (3-5 MB cada uno)

**Solución:**
- Primera carga: esperar 5-10 segundos
- Siguientes cargas: cached por navegador
- En producción: usar CDN o compresión

## 📊 Tamaños de Archivos

| Modelo | Tamaño Aproximado |
|--------|-------------------|
| tiny_face_detector | ~900 KB |
| face_landmark_68 | ~350 KB |
| face_expression | ~300 KB |
| **Total** | **~1.5 MB** |

## 🔄 Actualizar Modelos

Para usar modelos más actualizados:

```bash
cd frontend-react/public/models
rm -rf *
# Luego repetir proceso de descarga
```

## 📚 Recursos Adicionales

- **Repositorio de modelos:** https://github.com/justadudewhohacks/face-api.js-models
- **Documentación face-api.js:** https://github.com/justadudewhohacks/face-api.js
- **Ejemplos:** https://justadudewhohacks.github.io/face-api.js/docs/index.html

---

## 🎯 Uso en Componentes

### BiometricLoginAdvanced.jsx

```javascript
// Los modelos se cargan automáticamente en useEffect
useEffect(() => {
  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    
    console.log('✅ Modelos cargados');
  };
  
  loadModels();
}, []);
```

### Alternativa: BiometricLogin.jsx (Sin modelos)

Si no quieres descargar los modelos, puedes usar el componente básico:

```javascript
import BiometricLogin from './components/BiometricLogin';
// En lugar de:
// import BiometricLoginAdvanced from './components/BiometricLoginAdvanced';
```

El componente básico usa análisis de píxeles simple (sin ML) pero sigue siendo efectivo para detección de parpadeo.

---

**¿Problemas?** Abrir issue en: https://github.com/Gpcaceres/TravelBrainLS/issues
