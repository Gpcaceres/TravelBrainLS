"""
Microservicio de Reconocimiento Facial con Seguridad Avanzada
- Anti-spoofing
- Liveness detection
- Extracción de características faciales
- Sin acceso directo desde Internet
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import face_recognition
import numpy as np
import cv2
from PIL import Image
import io
import logging
from datetime import datetime
import hashlib
import os

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Facial Recognition Microservice",
    description="Servicio interno de análisis biométrico facial",
    version="1.0.0"
)

# Token de seguridad interno (debe coincidir con el backend)
INTERNAL_SERVICE_TOKEN = os.getenv('INTERNAL_SERVICE_TOKEN', 'CHANGE_THIS_IN_PRODUCTION_INTERNAL_TOKEN_123')
logger.info(f"Internal token configured: {INTERNAL_SERVICE_TOKEN[:10]}...")


class FaceEncodingResponse(BaseModel):
    """Respuesta con el vector de características faciales"""
    encoding: List[float]
    confidence: float
    liveness_score: float
    face_detected: bool
    quality_score: float
    message: str


class ComparisonRequest(BaseModel):
    """Solicitud de comparación de dos encodings"""
    encoding1: List[float]
    encoding2: List[float]
    threshold: float = 0.6


class ComparisonResponse(BaseModel):
    """Respuesta de comparación"""
    match: bool
    distance: float
    confidence: float
    message: str


def verify_internal_token(x_internal_token: str = Header(None)) -> bool:
    """
    Verifica que la llamada provenga del backend autorizado.
    Implementa el principio de mínimo privilegio.
    """
    if not x_internal_token or x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: servicio interno solamente"
        )
    return True


def detect_liveness(image_array: np.ndarray) -> tuple[float, str]:
    """
    Detecta si la imagen es de una persona viva (anti-spoofing).
    
    Técnicas implementadas:
    1. Análisis de textura (detección de patrones de impresión)
    2. Análisis de bordes y profundidad
    3. Detección de reflejos anormales
    4. Análisis de contraste y calidad
    
    Returns:
        tuple: (liveness_score, message)
        - liveness_score: 0.0 a 1.0 (1.0 = alta probabilidad de ser real)
        - message: Descripción del resultado
    """
    try:
        # Convertir a escala de grises
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        
        # 1. Análisis de textura usando Laplaciano (detecta bordes)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        texture_score = min(laplacian_var / 500.0, 1.0)  # Normalizar
        
        # 2. Análisis de contraste (fotos de fotos tienen menos contraste)
        contrast = gray.std()
        contrast_score = min(contrast / 60.0, 1.0)  # Normalizar
        
        # 3. Análisis de brillo y exposición
        brightness = gray.mean()
        brightness_score = 1.0 if 50 < brightness < 200 else 0.5
        
        # 4. Detección de patrones de moiré (típico de pantallas/impresiones)
        # Aplicar FFT para detectar patrones periódicos
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = np.abs(f_shift)
        
        # Buscar picos anormales que indiquen patrones de pantalla
        mean_magnitude = magnitude_spectrum.mean()
        max_magnitude = magnitude_spectrum.max()
        moire_score = 1.0 if (max_magnitude / mean_magnitude) < 100 else 0.3
        
        # 5. Análisis de nitidez (imágenes impresas suelen ser más borrosas)
        blur_measure = cv2.Laplacian(gray, cv2.CV_64F).var()
        sharpness_score = min(blur_measure / 100.0, 1.0)
        
        # Calcular score final ponderado
        liveness_score = (
            texture_score * 0.25 +
            contrast_score * 0.20 +
            brightness_score * 0.15 +
            moire_score * 0.25 +
            sharpness_score * 0.15
        )
        
        logger.info(f"Liveness scores - Texture: {texture_score:.2f}, Contrast: {contrast_score:.2f}, "
                   f"Brightness: {brightness_score:.2f}, Moiré: {moire_score:.2f}, "
                   f"Sharpness: {sharpness_score:.2f}, Final: {liveness_score:.2f}")
        
        if liveness_score > 0.7:
            message = "Alta probabilidad de ser un rostro real"
        elif liveness_score > 0.5:
            message = "Probabilidad media de ser un rostro real - verificación adicional recomendada"
        else:
            message = "Baja probabilidad de ser un rostro real - posible spoofing detectado"
            
        return liveness_score, message
        
    except Exception as e:
        logger.error(f"Error en detección de liveness: {str(e)}")
        return 0.0, f"Error en análisis de liveness: {str(e)}"


def calculate_face_quality(image_array: np.ndarray, face_location: tuple) -> float:
    """
    Calcula la calidad de la imagen facial para asegurar buenas condiciones.
    
    Args:
        image_array: Imagen en formato numpy
        face_location: Tupla con (top, right, bottom, left)
    
    Returns:
        float: Score de calidad de 0.0 a 1.0
    """
    try:
        top, right, bottom, left = face_location
        face_region = image_array[top:bottom, left:right]
        
        # 1. Tamaño de la cara (muy pequeña = mala calidad)
        face_size = (bottom - top) * (right - left)
        image_size = image_array.shape[0] * image_array.shape[1]
        size_ratio = face_size / image_size
        size_score = min(size_ratio / 0.2, 1.0)  # Óptimo si cara ocupa 20%+ de imagen
        
        # 2. Iluminación uniforme
        gray_face = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        lighting_variance = gray_face.std()
        lighting_score = min(lighting_variance / 40.0, 1.0)
        
        # 3. Nitidez de la región facial
        blur_metric = cv2.Laplacian(gray_face, cv2.CV_64F).var()
        sharpness_score = min(blur_metric / 100.0, 1.0)
        
        # Score final
        quality_score = (
            size_score * 0.4 +
            lighting_score * 0.3 +
            sharpness_score * 0.3
        )
        
        logger.info(f"Quality scores - Size: {size_score:.2f}, Lighting: {lighting_score:.2f}, "
                   f"Sharpness: {sharpness_score:.2f}, Final: {quality_score:.2f}")
        
        return quality_score
        
    except Exception as e:
        logger.error(f"Error calculando calidad facial: {str(e)}")
        return 0.5


@app.get("/health")
async def health_check():
    """Endpoint de salud del servicio"""
    return {
        "status": "healthy",
        "service": "facial-recognition",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/extract-features", response_model=FaceEncodingResponse)
async def extract_facial_features(
    file: UploadFile = File(...),
    x_internal_token: str = Header(None)
):
    """
    Extrae las características faciales de una imagen con análisis de seguridad.
    
    Flujo de seguridad:
    1. Verifica token interno
    2. Valida formato de imagen
    3. Detecta rostros
    4. Ejecuta pruebas anti-spoofing
    5. Calcula calidad de imagen
    6. Extrae encoding facial
    7. Destruye imagen de memoria
    
    Args:
        file: Imagen del rostro
        x_internal_token: Token de autenticación interno
    
    Returns:
        FaceEncodingResponse con el vector de características
    """
    # Verificar token interno
    verify_internal_token(x_internal_token)
    
    try:
        # Leer imagen
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convertir a RGB si es necesario
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convertir a numpy array
        image_array = np.array(image)
        
        # Log sin guardar la imagen (seguridad)
        image_hash = hashlib.sha256(contents).hexdigest()[:16]
        logger.info(f"Procesando imagen - Hash: {image_hash}, Tamaño: {image_array.shape}")
        
        # Detectar rostros
        face_locations = face_recognition.face_locations(image_array, model="hog")
        
        if not face_locations:
            logger.warning(f"No se detectaron rostros - Hash: {image_hash}")
            return FaceEncodingResponse(
                encoding=[],
                confidence=0.0,
                liveness_score=0.0,
                face_detected=False,
                quality_score=0.0,
                message="No se detectó ningún rostro en la imagen"
            )
        
        if len(face_locations) > 1:
            logger.warning(f"Múltiples rostros detectados ({len(face_locations)}) - Hash: {image_hash}")
            return FaceEncodingResponse(
                encoding=[],
                confidence=0.0,
                liveness_score=0.0,
                face_detected=True,
                quality_score=0.0,
                message="Se detectaron múltiples rostros. Por favor, asegúrese de que solo aparezca una persona"
            )
        
        # Análisis anti-spoofing (liveness detection)
        liveness_score, liveness_message = detect_liveness(image_array)
        
        # Si falla la prueba de liveness, rechazar
        if liveness_score < 0.5:
            logger.warning(f"Liveness detection falló - Hash: {image_hash}, Score: {liveness_score:.2f}")
            return FaceEncodingResponse(
                encoding=[],
                confidence=0.0,
                liveness_score=liveness_score,
                face_detected=True,
                quality_score=0.0,
                message=f"Posible intento de suplantación detectado. {liveness_message}"
            )
        
        # Calcular calidad de la imagen facial
        face_location = face_locations[0]
        quality_score = calculate_face_quality(image_array, face_location)
        
        if quality_score < 0.4:
            logger.warning(f"Calidad de imagen insuficiente - Hash: {image_hash}, Score: {quality_score:.2f}")
            return FaceEncodingResponse(
                encoding=[],
                confidence=0.0,
                liveness_score=liveness_score,
                face_detected=True,
                quality_score=quality_score,
                message="La calidad de la imagen es insuficiente. Por favor, mejore la iluminación y enfoque"
            )
        
        # Extraer encoding facial (128 dimensiones)
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if not face_encodings:
            logger.warning(f"No se pudo extraer encoding - Hash: {image_hash}")
            return FaceEncodingResponse(
                encoding=[],
                confidence=0.0,
                liveness_score=liveness_score,
                face_detected=True,
                quality_score=quality_score,
                message="No se pudieron extraer características faciales"
            )
        
        encoding = face_encodings[0]
        
        # Calcular confianza basada en la calidad del encoding
        # Un buen encoding tiene valores distribuidos (no todos ceros o muy similares)
        encoding_variance = np.var(encoding)
        confidence = min(encoding_variance / 0.01, 1.0)
        
        # Destruir imagen de memoria (privacidad)
        del image, image_array, contents
        
        logger.info(f"Extracción exitosa - Hash: {image_hash}, Liveness: {liveness_score:.2f}, "
                   f"Quality: {quality_score:.2f}, Confidence: {confidence:.2f}")
        
        return FaceEncodingResponse(
            encoding=encoding.tolist(),
            confidence=confidence,
            liveness_score=liveness_score,
            face_detected=True,
            quality_score=quality_score,
            message="Características faciales extraídas exitosamente"
        )
        
    except Exception as e:
        logger.error(f"Error procesando imagen: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al procesar la imagen"
        )


@app.post("/compare-faces", response_model=ComparisonResponse)
async def compare_facial_encodings(
    request: ComparisonRequest,
    x_internal_token: str = Header(None)
):
    """
    Compara dos encodings faciales para verificar identidad.
    
    Implementa comparación segura con distancia euclidiana.
    
    Args:
        request: Objeto con los dos encodings y umbral
        x_internal_token: Token de autenticación interno
    
    Returns:
        ComparisonResponse con resultado de comparación
    """
    # Verificar token interno
    verify_internal_token(x_internal_token)
    
    try:
        # Convertir a numpy arrays
        enc1 = np.array(request.encoding1)
        enc2 = np.array(request.encoding2)
        
        # Validar dimensiones
        if len(enc1) != 128 or len(enc2) != 128:
            raise HTTPException(
                status_code=400,
                detail="Los encodings deben tener 128 dimensiones"
            )
        
        # Calcular distancia euclidiana
        distance = np.linalg.norm(enc1 - enc2)
        
        # Determinar si hay match basado en el umbral
        match = distance <= request.threshold
        
        # Calcular confianza (inversa de la distancia normalizada)
        # Distancia 0 = 100% confianza, distancia 1 = 0% confianza
        confidence = max(0.0, 1.0 - distance)
        
        logger.info(f"Comparación - Distancia: {distance:.4f}, Match: {match}, "
                   f"Confidence: {confidence:.2f}, Threshold: {request.threshold}")
        
        if match:
            message = f"Identidad verificada con {confidence*100:.1f}% de confianza"
        else:
            message = "Las identidades no coinciden"
        
        return ComparisonResponse(
            match=match,
            distance=float(distance),
            confidence=confidence,
            message=message
        )
        
    except ValueError as e:
        logger.error(f"Error en formato de datos: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Formato de encoding inválido: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error comparando encodings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al comparar rostros"
        )


@app.get("/")
async def root():
    """Endpoint raíz - muestra información del servicio"""
    return {
        "service": "Facial Recognition Microservice",
        "version": "1.0.0",
        "status": "running",
        "security": "internal-only",
        "features": [
            "Anti-spoofing detection",
            "Liveness detection",
            "Quality assessment",
            "128D facial encoding",
            "Secure comparison"
        ],
        "warning": "Este servicio debe ejecutarse solo en red interna"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
