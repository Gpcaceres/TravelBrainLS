#!/bin/bash

# Script para descargar modelos de face-api.js
# Uso: ./download-models.sh

echo "🚀 Descargando modelos de face-api.js..."
echo ""

# Crear directorio si no existe
mkdir -p public/models
cd public/models

echo "📥 Descargando Tiny Face Detector..."
curl -L -o tiny_face_detector_model-weights_manifest.json \
  https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-weights_manifest.json

curl -L -o tiny_face_detector_model-shard1 \
  https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-shard1

echo "✅ Tiny Face Detector descargado"
echo ""

echo "📥 Descargando Face Landmarks 68..."
curl -L -o face_landmark_68_model-weights_manifest.json \
  https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-weights_manifest.json

curl -L -o face_landmark_68_model-shard1 \
  https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-shard1

echo "✅ Face Landmarks descargado"
echo ""

echo "📥 Descargando Face Expression Model..."
curl -L -o face_expression_model-weights_manifest.json \
  https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-weights_manifest.json

curl -L -o face_expression_model-shard1 \
  https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression_model-shard1

echo "✅ Face Expression descargado"
echo ""

echo "🎉 ¡Todos los modelos descargados exitosamente!"
echo ""
echo "Archivos descargados en: $(pwd)"
ls -lh

cd ../..
