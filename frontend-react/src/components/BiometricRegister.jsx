import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { STORAGE_KEYS } from '../config';
import './BiometricLoginAdvanced.css';

/**
 * Componente de Registro Biométrico
 * Captura el rostro del usuario para autenticación futura
 */
const BiometricRegister = ({ onSuccess, onError, onSkip }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isDetectingRef = useRef(false);

  const [step, setStep] = useState('loading');
  const [message, setMessage] = useState('Cargando modelos de IA...');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estados de detección
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const MODEL_URL = '/models';

  useEffect(() => {
    const loadModels = async () => {
      try {
        setMessage('Cargando modelos de reconocimiento facial...');
        console.log('[BiometricRegister] Iniciando carga de modelos desde:', MODEL_URL);
        console.log('[BiometricRegister] Modelos ya cargados?', {
          tinyFaceDetector: faceapi.nets.tinyFaceDetector.isLoaded,
          faceLandmark68Net: faceapi.nets.faceLandmark68Net.isLoaded,
          faceExpressionNet: faceapi.nets.faceExpressionNet.isLoaded
        });

        // Solo cargar si no están ya cargados
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          console.log('[BiometricRegister] Cargando tinyFaceDetector...');
          await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        }
        if (!faceapi.nets.faceLandmark68Net.isLoaded) {
          console.log('[BiometricRegister] Cargando faceLandmark68Net...');
          await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        }
        if (!faceapi.nets.faceExpressionNet.isLoaded) {
          console.log('[BiometricRegister] Cargando faceExpressionNet...');
          await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        }

        console.log('[BiometricRegister] Modelos listos');
        console.log('[BiometricRegister] TinyFaceDetector loaded:', faceapi.nets.tinyFaceDetector.isLoaded);
        console.log('[BiometricRegister] FaceLandmark68Net loaded:', faceapi.nets.faceLandmark68Net.isLoaded);
        console.log('[BiometricRegister] FaceExpressionNet loaded:', faceapi.nets.faceExpressionNet.isLoaded);
        
        setModelsLoaded(true);
        setStep('idle');
        setMessage('Modelos cargados. Iniciando cámara...');
        
        await startCamera();
      } catch (error) {
        console.error('[BiometricRegister] Error cargando modelos:', error);
        setMessage('Error cargando modelos de IA. Por favor, recargue la página.');
        setStep('error');
      }
    };

    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log('[BiometricRegister] Solicitando acceso a la cámara...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      console.log('[BiometricRegister] Cámara accedida, configurando video...');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        videoRef.current.onloadedmetadata = () => {
          console.log('[BiometricRegister] Video metadata cargada');
          videoRef.current.play()
            .then(() => {
              console.log('[BiometricRegister] Video reproduciendo, dimensiones:', 
                videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              
              setStep('ready');
              setMessage('Cámara iniciada. Posiciona tu rostro en el centro.');
              isDetectingRef.current = true;
              
              setTimeout(() => {
                console.log('[BiometricRegister] Iniciando detección facial...');
                startFaceDetection();
              }, 500);
            })
            .catch(err => {
              console.error('[BiometricRegister] Error al reproducir video:', err);
            });
        };
      }
    } catch (error) {
      console.error('[BiometricRegister] Error accediendo a la cámara:', error);
      setMessage('No se pudo acceder a la cámara. Verifique los permisos.');
      setStep('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startFaceDetection = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    console.log('[BiometricRegister] startFaceDetection iniciado');
    console.log('[BiometricRegister] Video ref:', !!video);
    console.log('[BiometricRegister] Canvas ref:', !!canvas);
    console.log('[BiometricRegister] Video ready:', video?.readyState);
    console.log('[BiometricRegister] Video dimensions:', video?.videoWidth, 'x', video?.videoHeight);

    if (!video || !canvas) {
      console.error('[BiometricRegister] Video o canvas no disponible');
      return;
    }

    // Verificar que el video tenga dimensiones
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('[BiometricRegister] Video sin dimensiones, esperando...');
      setTimeout(() => startFaceDetection(), 100);
      return;
    }

    const displaySize = {
      width: video.videoWidth,
      height: video.videoHeight
    };

    console.log('[BiometricRegister] Display size:', displaySize);
    faceapi.matchDimensions(canvas, displaySize);

    let detectionCount = 0;

    const detectFace = async () => {
      if (!video || video.paused || video.ended || !isDetectingRef.current) {
        console.log('[BiometricRegister] Detección pausada:', { 
          paused: video?.paused, 
          ended: video?.ended, 
          isDetecting: isDetectingRef.current,
          step 
        });
        return;
      }

      try {
        detectionCount++;
        if (detectionCount % 30 === 0) {
          console.log('[BiometricRegister] Detección #', detectionCount);
        }

        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detectionCount % 30 === 0) {
          console.log('[BiometricRegister] Rostro detectado:', !!detection);
        }

        if (canvas && video) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detection) {
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            
            // Dibujar detección con colores del tema
            faceapi.draw.drawDetections(canvas, resizedDetection);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
            
            // Dibujar marco verde alrededor del rostro
            const box = resizedDetection.detection.box;
            ctx.strokeStyle = '#47F59A';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            if (!faceDetected) {
              console.log('[BiometricRegister] ¡Rostro detectado!');
            }
            setFaceDetected(true);
            if (message === 'Posiciona tu rostro en el centro.' || message.includes('Cámara iniciada')) {
              setMessage('✅ Rostro detectado correctamente');
            }
          } else {
            if (faceDetected) {
              console.log('[BiometricRegister] Rostro perdido');
            }
            setFaceDetected(false);
            if (message !== 'Posiciona tu rostro en el centro.' && message !== 'Cámara iniciada. Posiciona tu rostro en el centro.') {
              setMessage('Posiciona tu rostro en el centro.');
            }
          }
        }
      } catch (error) {
        console.error('[BiometricRegister] Error en detección facial:', error);
      }

      if (isDetectingRef.current && step !== 'countdown' && step !== 'capturing') {
        requestAnimationFrame(detectFace);
      }
    };

    console.log('[BiometricRegister] Iniciando loop de detección...');
    detectFace();
  };

  const handleCapture = async () => {
    if (!faceDetected) {
      setMessage('⚠️ No se detecta un rostro. Posiciona tu cara en el centro.');
      return;
    }

    isDetectingRef.current = false; // Detener detección durante captura
    setStep('countdown');
    setMessage('Preparando captura...');

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      setMessage(`Capturando en ${i}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await captureImage();
  };

  const captureImage = async () => {
    setStep('capturing');
    setMessage('📸 Capturando imagen...');

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Importante: NO voltear la imagen para el backend
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      setCapturedBlob(blob); // Guardar blob para enviar al backend
      setCapturedImage(URL.createObjectURL(blob));
      setStep('preview');
      setMessage('Revisa tu foto. ¿Se ve bien?');
    }, 'image/jpeg', 0.95);
  };

  const handleConfirm = async () => {
    if (!capturedBlob) {
      setMessage('❌ Error: No hay imagen capturada');
      return;
    }

    setLoading(true);
    setStep('uploading');
    setMessage('Registrando tu biometría...');

    try {
      const formData = new FormData();
      formData.append('face', capturedBlob, 'face.jpg');

      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      console.log('[BiometricRegister] Token found:', !!token);
      console.log('[BiometricRegister] Blob size:', capturedBlob.size, 'bytes');
      
      if (!token) {
        throw new Error('Token inválido. Por favor, intenta registrarte nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/api/biometric/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        setMessage('✅ Biometría registrada exitosamente');
        stopCamera();
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error(data.message || 'Error al registrar biometría');
      }
    } catch (error) {
      console.error('[BiometricRegister] Error:', error);
      setMessage('❌ Error: ' + error.message);
      setStep('error');
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setStep('ready');
    setMessage('Posiciona tu rostro en el centro.');
    isDetectingRef.current = true;
    startFaceDetection();
  };

  return (
    <div className="biometric-container" style={{ 
      background: 'transparent',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="biometric-header" style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h2 className="biometric-title" style={{
          background: 'linear-gradient(135deg, #47F59A, #39C070)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          🔐 Registro Biométrico
        </h2>
        <p className="biometric-subtitle" style={{
          color: '#D3DAD5',
          fontSize: '1rem'
        }}>
          Registra tu rostro para acceso seguro y rápido
        </p>
      </div>

      <div className="biometric-content">
        <div className="video-container" style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          border: faceDetected ? '3px solid #47F59A' : '3px solid #E54A7A'
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="biometric-video"
            onLoadedMetadata={() => {
              console.log('[BiometricRegister] Video metadata loaded in JSX');
            }}
            onPlay={() => {
              console.log('[BiometricRegister] Video playing in JSX');
            }}
            style={{ 
              display: capturedImage ? 'none' : 'block',
              width: '100%',
              height: 'auto',
              transform: 'scaleX(-1)'
            }}
          />
          <canvas
            ref={canvasRef}
            className="biometric-canvas"
            style={{ 
              display: capturedImage ? 'none' : 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)'
            }}
          />
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured face"
              className="captured-preview"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                transform: 'scaleX(-1)'
              }}
            />
          )}
        </div>

        <div className="biometric-status" style={{
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <div className={`status-indicator ${faceDetected ? 'active' : ''}`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: faceDetected ? 'rgba(71, 245, 154, 0.1)' : 'rgba(229, 74, 122, 0.1)',
            border: `2px solid ${faceDetected ? '#47F59A' : '#E54A7A'}`,
            borderRadius: '12px',
            marginBottom: '1rem',
            transition: 'all 0.3s ease'
          }}>
            <span className="status-icon" style={{ fontSize: '1.5rem' }}>
              {faceDetected ? '✅' : '👤'}
            </span>
            <span className="status-text" style={{
              color: faceDetected ? '#47F59A' : '#E54A7A',
              fontWeight: '600',
              fontSize: '1rem'
            }}>
              {faceDetected ? 'Rostro detectado' : 'Buscando rostro...'}
            </span>
          </div>

          <div className="message-box" style={{
            padding: '1rem',
            background: 'rgba(71, 245, 154, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(71, 245, 154, 0.2)'
          }}>
            <p className="status-message" style={{
              color: '#D3DAD5',
              fontSize: '0.95rem',
              margin: '0'
            }}>{message}</p>
            {countdown > 0 && (
              <div className="countdown-display" style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: '#47F59A',
                marginTop: '1rem'
              }}>{countdown}</div>
            )}
          </div>
        </div>

        <div className="biometric-actions" style={{
          marginTop: '1.5rem'
        }}>
          {step === 'ready' && (
            <>
              <button
                className="btn btn-primary btn-block"
                onClick={handleCapture}
                disabled={!faceDetected || loading}
                style={{
                  background: faceDetected ? 'linear-gradient(135deg, #47F59A, #39C070)' : '#2d2d2d',
                  color: faceDetected ? '#101110' : '#666',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: faceDetected ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  opacity: faceDetected ? 1 : 0.6
                }}
              >
                📸 Capturar Rostro
              </button>
              <button
                className="btn btn-secondary btn-block"
                onClick={onSkip}
                style={{
                  marginTop: '0.5rem',
                  background: 'transparent',
                  color: '#D3DAD5',
                  border: '2px solid #D3DAD5',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                Omitir por ahora
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                className="btn btn-primary btn-block"
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #47F59A, #39C070)',
                  color: '#101110',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Registrando...' : '✅ Confirmar'}
              </button>
              <button
                className="btn btn-secondary btn-block"
                onClick={handleRetake}
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  background: 'transparent',
                  color: '#E54A7A',
                  border: '2px solid #E54A7A',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                🔄 Tomar otra foto
              </button>
            </>
          )}

          {(step === 'loading' || step === 'idle' || step === 'countdown' || step === 'capturing' || step === 'uploading') && (
            <div className="loading-spinner" style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(71, 245, 154, 0.2)',
                borderTopColor: '#47F59A',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
            </div>
          )}

          {step === 'success' && (
            <div className="success-message" style={{
              padding: '1rem',
              background: 'rgba(71, 245, 154, 0.1)',
              border: '2px solid #47F59A',
              borderRadius: '8px',
              color: '#47F59A',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              ✅ Biometría registrada correctamente
            </div>
          )}

          {step === 'error' && (
            <button
              className="btn btn-secondary btn-block"
              onClick={onSkip}
              style={{
                background: 'transparent',
                color: '#D3DAD5',
                border: '2px solid #D3DAD5',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Continuar sin biometría
            </button>
          )}
        </div>

        <div className="biometric-tips" style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(71, 245, 154, 0.05)',
          borderRadius: '8px',
          borderLeft: '3px solid #47F59A'
        }}>
          <h4 style={{
            margin: '0 0 0.75rem 0',
            color: '#47F59A',
            fontSize: '0.95rem',
            fontWeight: '600'
          }}>💡 Consejos para mejor captura:</h4>
          <ul style={{
            margin: '0',
            paddingLeft: '1.25rem',
            listStyle: 'none'
          }}>
            <li style={{
              marginBottom: '0.5rem',
              color: '#D3DAD5',
              fontSize: '0.875rem',
              position: 'relative'
            }}>Asegúrate de tener buena iluminación</li>
            <li style={{
              marginBottom: '0.5rem',
              color: '#D3DAD5',
              fontSize: '0.875rem',
              position: 'relative'
            }}>Mantén tu rostro centrado en la cámara</li>
            <li style={{
              marginBottom: '0.5rem',
              color: '#D3DAD5',
              fontSize: '0.875rem',
              position: 'relative'
            }}>Evita usar lentes oscuros o accesorios que cubran tu cara</li>
            <li style={{
              marginBottom: '0.5rem',
              color: '#D3DAD5',
              fontSize: '0.875rem',
              position: 'relative'
            }}>Mantén una expresión neutral</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BiometricRegister;
