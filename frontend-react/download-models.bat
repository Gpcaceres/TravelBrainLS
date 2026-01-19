@echo off
REM Script para descargar modelos de face-api.js en Windows
REM Uso: download-models.bat

echo Descargando modelos de face-api.js...
echo.

REM Crear directorio si no existe
if not exist "public\models" mkdir public\models
cd public\models

echo Descargando Tiny Face Detector...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-weights_manifest.json' -OutFile 'tiny_face_detector_model-weights_manifest.json'"
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-shard1' -OutFile 'tiny_face_detector_model-shard1'"
echo OK - Tiny Face Detector descargado
echo.

echo Descargando Face Landmarks 68...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-weights_manifest.json' -OutFile 'face_landmark_68_model-weights_manifest.json'"
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-shard1' -OutFile 'face_landmark_68_model-shard1'"
echo OK - Face Landmarks descargado
echo.

echo Descargando Face Expression Model...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-weights_manifest.json' -OutFile 'face_expression_model-weights_manifest.json'"
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-shard1' -OutFile 'face_expression_model-shard1'"
echo OK - Face Expression descargado
echo.

echo Todos los modelos descargados exitosamente!
echo.
echo Archivos descargados en: %cd%
dir

cd ..\..
pause
