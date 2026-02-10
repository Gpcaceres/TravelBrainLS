import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { STORAGE_KEYS } from '../config';
import './BiometricLoginAdvanced.css';

/**
 * Componente de Registro Biométrico
 * Captura el rostro del usuario para autenticación futura
 */
const BiometricRegister = ({ onSuccess, onError, onCancel, registrationData = null }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isDetectingRef = useRef(false);
  const blinkTimeoutRef = useRef(null);

  const [step, setStep] = useState('loading');
  const [message, setMessage] = useState('Cargando modelos de IA...');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estados de detección
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25);

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
      clearBlinkTimeout(); // Limpiar el timeout al desmontar
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

    // Iniciar prueba de vida con parpadeo
    isDetectingRef.current = false;
    setStep('liveness-test');
    setMessage('Por favor, parpadee lentamente 2 veces');
    setBlinkDetected(false);
    setTimeRemaining(25);
    
    // Iniciar temporizador de 25 segundos
    startBlinkTimeout();
    
    // Iniciar detección de parpadeo
    setTimeout(() => {
      detectBlinks();
    }, 500);
  };

  /**
   * Iniciar temporizador de 25 segundos para la prueba de parpadeo
   */
  const startBlinkTimeout = () => {
    let secondsLeft = 25;
    setTimeRemaining(secondsLeft);
    
    // Actualizar contador cada segundo
    const countdownInterval = setInterval(() => {
      secondsLeft--;
      setTimeRemaining(secondsLeft);
      
      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // Timeout principal de 25 segundos
    blinkTimeoutRef.current = setTimeout(() => {
      clearInterval(countdownInterval);
      handleBlinkTimeout();
    }, 25000);
  };

  /**
   * Manejar el timeout de la prueba de parpadeo
   */
  const handleBlinkTimeout = () => {
    console.log('[BiometricRegister] Timeout de prueba de vida alcanzado');
    setStep('timeout-error');
    setMessage('⏱️ Tiempo agotado. No se detectó el parpadeo requerido.');
    isDetectingRef.current = false;
  };

  /**
   * Limpiar el temporizador de parpadeo
   */
  const clearBlinkTimeout = () => {
    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current);
      blinkTimeoutRef.current = null;
    }
  };

  /**
   * Detección de parpadeo mediante análisis de frames
   * Adaptado del componente BiometricLogin para prueba de vida
   */
  const detectBlinks = () => {
    let blinkCount = 0;
    let lastState = 'open'; // open o closed

    const checkBlink = () => {
      if (step !== 'liveness-test') return;

      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return;

      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Análisis de región de ojos
      const imageData = context.getImageData(
        canvas.width * 0.3,
        canvas.height * 0.3,
        canvas.width * 0.4,
        canvas.height * 0.2
      );

      const brightness = calculateBrightness(imageData);

      // Detectar cambio de estado (parpadeo)
      if (brightness < 100 && lastState === 'open') {
        lastState = 'closed';
      } else if (brightness > 120 && lastState === 'closed') {
        lastState = 'open';
        blinkCount++;
        setMessage(`Parpadeo detectado (${blinkCount}/2)`);

        if (blinkCount >= 2) {
          setBlinkDetected(true);
          clearBlinkTimeout(); // Limpiar el timeout al completar exitosamente
          setMessage('¡Prueba de vida completada! Preparando captura...');
          setTimeout(() => {
            startCountdown();
          }, 1500);
          return;
        }
      }

      // Continuar verificando
      requestAnimationFrame(checkBlink);
    };

    checkBlink();
  };

  /**
   * Calcular brillo promedio de una imagen
   */
  const calculateBrightness = (imageData) => {
    let sum = 0;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Promedio RGB
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    return sum / (data.length / 4);
  };

  /**
   * Iniciar countdown después de la prueba de vida
   */
  const startCountdown = async () => {
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
    setMessage('Validando tu biometría...');

    try {
      // Si es un nuevo registro (registrationData existe), validar sin registrar
      if (registrationData) {
        const formData = new FormData();
        formData.append('face', capturedBlob, 'face.jpg');

        // Llamar al endpoint de validación (sin autenticación)
        const response = await fetch(`${API_BASE_URL}/api/biometric/validate-face`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          setStep('success');
          setMessage('✅ Biometría validada exitosamente');
          stopCamera();
          setTimeout(() => {
            onSuccess(capturedBlob); // Pasar el blob al padre
          }, 1500);
        } else {
          // Verificar si es un error de rostro duplicado
          if (response.status === 409 || data.isDuplicate) {
            setMessage(`⚠️ ${data.message || 'Este rostro ya está registrado en el sistema'}`);
            setStep('duplicate-error');
          } else {
            throw new Error(data.message || 'Error al validar biometría');
          }
          setLoading(false);
        }
        return;
      }

      // Flujo normal: usuario ya existe y está registrando biometría
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
        // Verificar si es un error de rostro duplicado
        if (response.status === 409 || data.isDuplicate) {
          setMessage(`⚠️ ${data.message || 'Este rostro ya está registrado en el sistema'}`);
          setStep('duplicate-error');
        } else {
          throw new Error(data.message || 'Error al registrar biometría');
        }
        setLoading(false);
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
    setBlinkDetected(false);
    clearBlinkTimeout(); // Limpiar timeout si existe
    setTimeRemaining(25);
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
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
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
          color: 'var(--color-neutral-light)',
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
          border: faceDetected ? '3px solid var(--color-primary)' : '3px solid var(--color-secondary)'
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
          
          {/* Overlay de instrucción de parpadeo */}
          {step === 'liveness-test' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              border: '2px solid var(--color-primary)',
              zIndex: 10
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👁️</div>
              <p style={{ 
                margin: '0 0 0.5rem 0', 
                color: 'var(--color-primary)', 
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                Parpadee lentamente
              </p>
              <p style={{
                margin: 0,
                color: timeRemaining <= 10 ? '#FFA500' : 'var(--color-neutral-light)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ⏱️ {timeRemaining}s restantes
              </p>
            </div>
          )}
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
            border: `2px solid ${faceDetected ? 'var(--color-primary)' : 'var(--color-secondary)'}`,
            borderRadius: '12px',
            marginBottom: '1rem',
            transition: 'all 0.3s ease'
          }}>
            <span className="status-icon" style={{ fontSize: '1.5rem' }}>
              {faceDetected ? '✅' : '👤'}
            </span>
            <span className="status-text" style={{
              color: faceDetected ? 'var(--color-primary)' : 'var(--color-secondary)',
              fontWeight: '600',
              fontSize: '1rem'
            }}>
              {faceDetected ? 'Rostro detectado' : 'Buscando rostro...'}
            </span>
          </div>

          <div className="message-box" style={{
            padding: '1rem',
            background: 'rgba(30, 30, 30, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(71, 245, 154, 0.2)'
          }}>
            <p className="status-message" style={{
              color: 'var(--color-neutral-light)',
              fontSize: '0.95rem',
              margin: '0'
            }}>{message}</p>
            {countdown > 0 && (
              <div className="countdown-display" style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: 'var(--color-primary)',
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
                  background: faceDetected ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' : 'rgba(45, 45, 45, 0.5)',
                  color: faceDetected ? 'var(--color-neutral-black)' : '#666',
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
              {onCancel && (
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    stopCamera();
                    onCancel();
                  }}
                  disabled={loading}
                  style={{
                    marginTop: '0.75rem',
                    background: 'transparent',
                    color: 'var(--color-neutral-light)',
                    border: '2px solid rgba(211, 218, 213, 0.2)',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--color-secondary)';
                    e.target.style.color = 'var(--color-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(211, 218, 213, 0.2)';
                    e.target.style.color = 'var(--color-neutral-light)';
                  }}
                >
                  ✕ Cancelar y Salir
                </button>
              )}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(71, 245, 154, 0.05)',
                borderRadius: '8px',
                border: '1px solid var(--color-primary)',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                  🔒 El registro biométrico es obligatorio para acceder a la aplicación
                </p>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                className="btn btn-primary btn-block"
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                  color: 'var(--color-neutral-black)',
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
                  color: 'var(--color-secondary)',
                  border: '2px solid var(--color-secondary)',
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
              {onCancel && (
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    stopCamera();
                    onCancel();
                  }}
                  disabled={loading}
                  style={{
                    marginTop: '0.5rem',
                    background: 'transparent',
                    color: 'var(--color-neutral-light)',
                    border: '2px solid rgba(211, 218, 213, 0.2)',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--color-secondary)';
                    e.target.style.color = 'var(--color-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(211, 218, 213, 0.2)';
                    e.target.style.color = 'var(--color-neutral-light)';
                  }}
                >
                  ✕ Cancelar y Salir
                </button>
              )}
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
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
            </div>
          )}

          {step === 'success' && (
            <div className="success-message" style={{
              padding: '1rem',
              background: 'rgba(71, 245, 154, 0.1)',
              border: '2px solid var(--color-primary)',
              borderRadius: '8px',
              color: 'var(--color-primary)',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              ✅ Biometría registrada correctamente
            </div>
          )}

          {step === 'error' && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(229, 74, 122, 0.1)',
              borderRadius: '8px',
              border: '1px solid var(--color-secondary)',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: 'var(--color-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>
                ❌ {message}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-neutral-light)', fontSize: '0.85rem' }}>
                Por favor, inténtalo nuevamente. El registro biométrico es requerido.
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  setStep('idle');
                  setMessage('Posiciona tu rostro en el centro.');
                  startCamera();
                }}
                style={{
                  marginTop: '1rem',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                  color: 'var(--color-neutral-black)',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                🔄 Intentar Nuevamente
              </button>
              {onCancel && (
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    stopCamera();
                    onCancel();
                  }}
                  style={{
                    marginTop: '0.5rem',
                    background: 'transparent',
                    color: 'var(--color-neutral-light)',
                    border: '2px solid rgba(211, 218, 213, 0.2)',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--color-secondary)';
                    e.target.style.color = 'var(--color-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(211, 218, 213, 0.2)';
                    e.target.style.color = 'var(--color-neutral-light)';
                  }}
                >
                  ✕ Cancelar y Salir
                </button>
              )}
            </div>
          )}

          {step === 'duplicate-error' && (
            <div style={{
              marginTop: '1rem',
              padding: '1.5rem',
              background: 'rgba(255, 165, 0, 0.1)',
              borderRadius: '12px',
              border: '2px solid #FFA500',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ margin: '0 0 0.5rem 0', color: '#FFA500', fontSize: '1.1rem', fontWeight: '700' }}>
                Rostro Ya Registrado
              </p>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--color-neutral-light)', fontSize: '0.9rem' }}>
                {message}
              </p>
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, color: 'var(--color-neutral-light)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <strong style={{ color: '#FFA500' }}>🔒 Política de Seguridad:</strong><br/>
                  Por seguridad, cada persona solo puede registrar su rostro una vez en el sistema.
                  Si este es tu rostro y olvidaste tu cuenta, contacta al soporte.
                </p>
              </div>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => {
                  stopCamera();
                  if (onCancel) {
                    onCancel();
                  }
                }}
                style={{
                  background: 'transparent',
                  color: '#FFA500',
                  border: '2px solid #FFA500',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ← Volver al Inicio
              </button>
            </div>
          )}

          {step === 'timeout-error' && (
            <div style={{
              marginTop: '1rem',
              padding: '1.5rem',
              background: 'rgba(229, 74, 122, 0.1)',
              borderRadius: '12px',
              border: '2px solid var(--color-secondary)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-secondary)', fontSize: '1.1rem', fontWeight: '700' }}>
                Reto No Superado
              </p>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--color-neutral-light)', fontSize: '0.9rem' }}>
                {message}
              </p>
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, color: 'var(--color-neutral-light)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <strong style={{ color: 'var(--color-secondary)' }}>⚠️ Challenge No Pass:</strong><br/>
                  No se detectó el parpadeo requerido dentro del tiempo límite de 25 segundos.
                  Asegúrate de parpadear claramente 2 veces cuando se te indique.
                </p>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  clearBlinkTimeout();
                  setTimeRemaining(25);
                  setStep('ready');
                  setMessage('Posiciona tu rostro en el centro.');
                  isDetectingRef.current = true;
                  startFaceDetection();
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                  color: 'var(--color-neutral-black)',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '0.5rem'
                }}
              >
                🔄 Intentar Nuevamente
              </button>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => {
                  stopCamera();
                  clearBlinkTimeout();
                  if (onCancel) {
                    onCancel();
                  }
                }}
                style={{
                  background: 'transparent',
                  color: 'var(--color-secondary)',
                  border: '2px solid var(--color-secondary)',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ← Volver al Inicio
              </button>
            </div>
          )}
        </div>

        <div className="biometric-tips" style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(71, 245, 154, 0.05)',
          borderRadius: '8px',
          borderLeft: '3px solid var(--color-primary)'
        }}>
          <h4 style={{
            margin: '0 0 0.75rem 0',
            color: 'var(--color-primary)',
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
              color: 'var(--color-neutral-light)',
              fontSize: '0.875rem',
              position: 'relative'
            }}>Asegúrate de tener buena iluminación</li>
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--color-neutral-light)',
              fontSize: '0.875rem',
              position: 'relative'
            }}>Mantén tu rostro centrado en la cámara</li>
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--color-neutral-light)',
              fontSize: '0.875rem',
              position: 'relative'
            }}>Evita usar lentes oscuros o accesorios que cubran tu cara</li>
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--color-neutral-light)',
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
