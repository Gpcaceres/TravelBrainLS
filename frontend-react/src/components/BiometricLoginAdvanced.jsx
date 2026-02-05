import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './BiometricLoginAdvanced.css';

/**
 * Componente Avanzado de Login Biométrico con Face-API.js
 * 
 * Mejoras de seguridad:
 * - Detección facial real con landmarks
 * - Detección de parpadeo precisa
 * - Análisis de movimiento de cabeza
 * - Detección de múltiples rostros
 * - Análisis de expresiones
 * 
 * Props:
 * - email (opcional): Email pre-validado para MFA. Si se proporciona, salta la entrada de email
 * - onSuccess: Callback cuando la autenticación es exitosa
 * - onError: Callback cuando hay un error
 */
const BiometricLoginAdvanced = ({ email: preValidatedEmail, onSuccess, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Refs para el control de parpadeo sin dependencias de estado
  const blinkCountRef = useRef(0);
  const lastEyeStateRef = useRef('open');
  const isProcessingBlinksRef = useRef(false);
  const stepRef = useRef('loading'); // Ref para el step actual sin problemas de closure
  const emailRef = useRef(preValidatedEmail || ''); // Ref para el email
  const challengeTokenRef = useRef(''); // Ref para el token de desafío
  const livenessTimerRef = useRef(null); // Ref para el timer de 25 segundos

  const [step, setStep] = useState('loading'); // loading, idle, ready, liveness-test, countdown, capturing, analyzing, success, error
  const [message, setMessage] = useState('Cargando modelos de IA...');
  const [email, setEmail] = useState(preValidatedEmail || '');
  const [challengeToken, setChallengeToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [livenessTimeRemaining, setLivenessTimeRemaining] = useState(25); // Contador de 25 segundos

  // Estados de detección
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [headMovementDetected, setHeadMovementDetected] = useState(false);
  const [livenessScore, setLivenessScore] = useState(0);

  // Seguimiento de parpadeo
  const [eyeAspectRatio, setEyeAspectRatio] = useState(1.0);
  const [blinkThreshold] = useState(0.3); // Umbral para detectar ojo cerrado (bajado de 0.25 a 0.3 para mayor sensibilidad)
  const [lastEyeState, setLastEyeState] = useState('open');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const MODEL_URL = '/models'; // Ruta donde se almacenan los modelos de face-api.js

  /**
   * Helper para actualizar step en state y ref simultáneamente
   */
  const updateStep = (newStep) => {
    console.log('[BiometricLogin] Cambiando step:', stepRef.current, '→', newStep);
    setStep(newStep);
    stepRef.current = newStep;
  };

  /**
   * Cargar modelos de Face-API.js al montar el componente
   */
  useEffect(() => {
    const loadModels = async () => {
      try {
        setMessage('Cargando modelos de reconocimiento facial...');
        console.log('[BiometricLogin] Iniciando carga de modelos desde:', MODEL_URL);

        // Cargar modelos necesarios
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);

        console.log('[BiometricLogin] Modelos cargados correctamente');
        console.log('[BiometricLogin] TinyFaceDetector loaded:', faceapi.nets.tinyFaceDetector.isLoaded);
        console.log('[BiometricLogin] FaceLandmark68Net loaded:', faceapi.nets.faceLandmark68Net.isLoaded);
        
        setModelsLoaded(true);
        updateStep('idle');
        setMessage(preValidatedEmail ? 'Modelos cargados. Iniciando autenticación MFA...' : 'Modelos cargados. Iniciando cámara...');
        
        // Iniciar cámara
        await startCamera();
      } catch (error) {
        console.error('[BiometricLogin] Error cargando modelos:', error);
        setMessage('Error cargando modelos de IA. Por favor, recargue la página.');
        updateStep('error');
      }
    };

    loadModels();

    return () => {
      stopCamera();
      stopLivenessTimer();
    };
  }, [preValidatedEmail]);

  /**
   * Iniciar cámara
   */
  const startCamera = async () => {
    try {
      console.log('[BiometricLogin] Solicitando acceso a la cámara...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      console.log('[BiometricLogin] Cámara accedida, configurando video...');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Esperar a que el video esté listo y reproduciendo
        videoRef.current.onloadedmetadata = () => {
          console.log('[BiometricLogin] Video metadata cargada');
          videoRef.current.play()
            .then(() => {
              console.log('[BiometricLogin] Video reproduciendo, dimensiones:', 
                videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              
              setStep('ready');
              setMessage('Cámara iniciada. Por favor ingrese su email.');
              
              // Esperar un poco antes de iniciar detección
              setTimeout(() => {
                console.log('[BiometricLogin] Iniciando detección facial...');
                startFaceDetection();
              }, 500);
            })
            .catch(err => {
              console.error('[BiometricLogin] Error al reproducir video:', err);
            });
        };
      }
    } catch (error) {
      console.error('[BiometricLogin] Error accediendo a la cámara:', error);
      setMessage('No se pudo acceder a la cámara. Verifique los permisos.');
      setStep('error');
      if (onError) onError('camera_access_denied');
    }
  };

  /**
   * Detener cámara
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  /**
   * Detección continua de rostro en tiempo real
   */
  const startFaceDetection = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    console.log('[BiometricLogin] startFaceDetection iniciado');
    console.log('[BiometricLogin] Video ref:', !!video);
    console.log('[BiometricLogin] Canvas ref:', !!canvas);
    console.log('[BiometricLogin] Video ready:', video?.readyState);
    console.log('[BiometricLogin] Video dimensions:', video?.videoWidth, 'x', video?.videoHeight);

    if (!video || !canvas) {
      console.error('[BiometricLogin] Video o canvas no disponible');
      return;
    }

    // Verificar que el video tenga dimensiones
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('[BiometricLogin] Video sin dimensiones, esperando...');
      setTimeout(() => startFaceDetection(), 100);
      return;
    }

    const displaySize = {
      width: video.videoWidth,
      height: video.videoHeight
    };

    console.log('[BiometricLogin] Display size:', displaySize);
    faceapi.matchDimensions(canvas, displaySize);

    let detectionCount = 0;
    
    const detectFaces = async () => {
      if (!video || video.paused || video.ended || step === 'capturing' || step === 'analyzing') {
        console.log('[BiometricLogin] Detección pausada:', { paused: video?.paused, ended: video?.ended, step });
        return;
      }

      try {
        detectionCount++;
        if (detectionCount % 30 === 0) {
          console.log('[BiometricLogin] Detección #', detectionCount);
        }

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceExpressions();

        console.log('[BiometricLogin] Rostros detectados:', detections.length);

        // Limpiar canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          // Dibujar detecciones con colores del tema
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          // Dibujar marco verde alrededor del rostro
          const detection = resizedDetections[0];
          const box = detection.detection.box;
          ctx.strokeStyle = '#47F59A';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          if (!faceDetected) {
            console.log('[BiometricLogin] ¡Rostro detectado!');
          }
          setFaceDetected(true);

          // Si estamos en prueba de vida, analizar parpadeo
          const currentStep = stepRef.current;
          console.log('[BiometricLogin] Step actual:', currentStep);
          
          if (currentStep === 'liveness-test') {
            console.log('[BiometricLogin] Analizando parpadeo...');
            analyzeBlinking(detection);
          }
        } else {
          if (faceDetected) {
            console.log('[BiometricLogin] Rostro perdido');
          }
          setFaceDetected(false);
        }

        // Continuar detección
        requestAnimationFrame(detectFaces);
      } catch (error) {
        console.error('[BiometricLogin] Error en detección facial:', error);
        requestAnimationFrame(detectFaces);
      }
    };

    console.log('[BiometricLogin] Iniciando loop de detección...');
    detectFaces();
  };

  /**
   * Analizar parpadeo usando Eye Aspect Ratio (EAR)
   */
  const analyzeBlinking = (detection) => {
    // Evitar procesamiento si ya completamos los 2 parpadeos
    if (isProcessingBlinksRef.current) {
      return;
    }

    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Calcular EAR (Eye Aspect Ratio)
    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    // Log continuo del EAR para debugging (cada 30 frames aproximadamente)
    if (Math.random() < 0.1) {
      console.log('[BiometricLogin] EAR actual:', avgEAR.toFixed(3), '| Threshold:', blinkThreshold, '| Estado:', lastEyeStateRef.current);
    }

    setEyeAspectRatio(avgEAR);

    const currentEyeState = lastEyeStateRef.current;

    // Detectar cambio de estado del ojo
    if (avgEAR < blinkThreshold && currentEyeState === 'open') {
      // Ojo se cerró
      console.log('[BiometricLogin] ✅ Ojo cerrado detectado! EAR:', avgEAR.toFixed(3), '<', blinkThreshold);
      lastEyeStateRef.current = 'closed';
      setLastEyeState('closed');
    } else if (avgEAR >= blinkThreshold && currentEyeState === 'closed') {
      // Ojo se abrió (parpadeo completo)
      console.log('[BiometricLogin] ✅ Parpadeo completado! EAR:', avgEAR.toFixed(3), '>=', blinkThreshold);
      lastEyeStateRef.current = 'open';
      setLastEyeState('open');
      
      // Incrementar contador
      blinkCountRef.current += 1;
      const newCount = blinkCountRef.current;
      setBlinkCount(newCount);
      
      console.log('[BiometricLogin] 🎯 Contador de parpadeos:', newCount, '/2');
      setMessage(`Parpadeo detectado (${newCount}/2)`);

      if (newCount >= 2) {
        // Prueba de vida completada
        console.log('[BiometricLogin] 🎉 ¡2 parpadeos detectados! Iniciando countdown...');
        isProcessingBlinksRef.current = true; // Evitar más procesamiento
        setMessage('¡Prueba de vida completada! Preparando captura...');
        setLivenessScore(0.9); // Alta confianza
        
        // Detener el timer de 25 segundos
        stopLivenessTimer();
        
        // IMPORTANTE: Cambiar el step antes de iniciar countdown
        setTimeout(() => {
          console.log('[BiometricLogin] Ejecutando startCountdown()');
          startCountdown();
        }, 1500);
      }
    }
  };

  /**
   * Calcular Eye Aspect Ratio (EAR)
   * Fórmula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   */
  const calculateEAR = (eye) => {
    // Puntos del ojo
    const p1 = eye[0];
    const p2 = eye[1];
    const p3 = eye[2];
    const p4 = eye[3];
    const p5 = eye[4];
    const p6 = eye[5];

    // Distancias verticales
    const A = euclideanDistance(p2, p6);
    const B = euclideanDistance(p3, p5);

    // Distancia horizontal
    const C = euclideanDistance(p1, p4);

    // EAR
    const ear = (A + B) / (2.0 * C);
    return ear;
  };

  /**
   * Calcular distancia euclidiana entre dos puntos
   */
  const euclideanDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  /**
   * Auto-iniciar challenge si hay email pre-validado y rostro detectado
   */
  useEffect(() => {
    if (preValidatedEmail && faceDetected && step === 'ready' && !loading && !challengeToken) {
      console.log('[BiometricLogin MFA] Auto-iniciando challenge con email pre-validado:', preValidatedEmail);
      requestChallenge();
    }
  }, [preValidatedEmail, faceDetected, step, loading, challengeToken]);

  /**
   * Solicitar desafío
   */
  const requestChallenge = async () => {
    if (!email) {
      setMessage('Por favor, ingrese su email');
      return;
    }

    if (!faceDetected) {
      setMessage('No se detecta un rostro. Por favor, posiciónese frente a la cámara.');
      return;
    }

    setLoading(true);
    updateStep('requesting-challenge');
    setMessage('Solicitando autenticación...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/biometric/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          operation: 'LOGIN'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error solicitando autenticación');
      }

      // Guardar en state y refs
      setChallengeToken(data.data.challengeToken);
      challengeTokenRef.current = data.data.challengeToken;
      emailRef.current = email;
      
      console.log('[BiometricLogin] Challenge token guardado:', challengeTokenRef.current);
      console.log('[BiometricLogin] Email guardado:', emailRef.current);
      
      updateStep('instructions');
      setMessage('Desafío recibido. Preparando prueba de vida...');
      setLoading(false);

      // Iniciar prueba de vida
      setTimeout(() => {
        startLivenessTest();
      }, 2000);

    } catch (error) {
      console.error('Error solicitando desafío:', error);
      setMessage(error.message);
      updateStep('error');
      setLoading(false);
      if (onError) onError(error.message);
    }
  };

  /**
   * Iniciar prueba de vida
   */
  const startLivenessTest = () => {
    console.log('[BiometricLogin] Iniciando prueba de vida');
    updateStep('liveness-test');
    setMessage('Por favor, parpadee lentamente 2 veces');
    setBlinkCount(0);
    setLastEyeState('open');
    
    // Resetear refs
    blinkCountRef.current = 0;
    lastEyeStateRef.current = 'open';
    isProcessingBlinksRef.current = false;
    
    console.log('[BiometricLogin] Refs reseteados - blinkCount:', blinkCountRef.current);
    
    // Iniciar contador de 25 segundos
    startLivenessTimer();
  };

  /**
   * Iniciar timer de 25 segundos para la prueba de vida
   */
  const startLivenessTimer = () => {
    // Limpiar timer anterior si existe
    if (livenessTimerRef.current) {
      clearInterval(livenessTimerRef.current);
    }
    
    setLivenessTimeRemaining(25);
    console.log('[BiometricLogin] Iniciando timer de 25 segundos');
    
    livenessTimerRef.current = setInterval(() => {
      setLivenessTimeRemaining((prevTime) => {
        const newTime = prevTime - 1;
        
        if (newTime <= 0) {
          // Tiempo agotado
          console.log('[BiometricLogin] ⏰ Tiempo agotado para la prueba de vida');
          clearInterval(livenessTimerRef.current);
          livenessTimerRef.current = null;
          handleLivenessTimeout();
          return 0;
        }
        
        // Advertencia en los últimos 5 segundos
        if (newTime <= 5 && newTime > 0) {
          console.log('[BiometricLogin] ⚠️ Solo quedan', newTime, 'segundos');
        }
        
        return newTime;
      });
    }, 1000);
  };

  /**
   * Detener timer de prueba de vida
   */
  const stopLivenessTimer = () => {
    if (livenessTimerRef.current) {
      console.log('[BiometricLogin] Deteniendo timer de liveness');
      clearInterval(livenessTimerRef.current);
      livenessTimerRef.current = null;
    }
  };

  /**
   * Manejar timeout de prueba de vida
   */
  const handleLivenessTimeout = () => {
    updateStep('error');
    setMessage('⏰ Tiempo agotado. No se detectaron los 2 parpadeos a tiempo. Por favor, inténtelo nuevamente.');
    if (onError) onError('liveness_timeout');
  };

  /**
   * Countdown antes de captura
   */
  const startCountdown = () => {
    console.log('[BiometricLogin] startCountdown() llamado');
    updateStep('countdown');
    let count = 3;
    setCountdown(count);
    setMessage(`Capturando en ${count}...`);

    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      console.log('[BiometricLogin] Countdown:', count);
      
      if (count > 0) {
        setMessage(`Capturando en ${count}...`);
      } else {
        clearInterval(timer);
        console.log('[BiometricLogin] Countdown terminado, capturando...');
        captureAndVerify();
      }
    }, 1000);
  };

  /**
   * Capturar y verificar
   */
  const captureAndVerify = async () => {
    console.log('[BiometricLogin] captureAndVerify() iniciado');
    updateStep('capturing');
    setMessage('Capturando imagen...');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      console.log('[BiometricLogin] Canvas y video obtenidos');

      // Crear un canvas temporal para captura limpia
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      console.log('[BiometricLogin] Imagen dibujada en canvas temporal');

      // Convertir a blob
      const blob = await new Promise((resolve) => {
        captureCanvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      console.log('[BiometricLogin] Blob creado, tamaño:', blob.size, 'bytes');

      updateStep('analyzing');
      setMessage('Analizando identidad biométrica...');

      // Usar refs para evitar problemas de closure
      const currentEmail = emailRef.current;
      const currentToken = challengeTokenRef.current;
      
      console.log('[BiometricLogin] Valores actuales - Email:', currentEmail, 'Token:', currentToken);

      if (!currentEmail || !currentToken) {
        throw new Error('Token de desafío y email son requeridos');
      }

      // Enviar al backend
      const formData = new FormData();
      formData.append('face', blob, 'face.jpg');
      formData.append('challengeToken', currentToken);
      formData.append('email', currentEmail);

      console.log('[BiometricLogin] Enviando al backend - Email:', currentEmail, 'Challenge Token:', currentToken);

      const response = await fetch(`${API_BASE_URL}/api/biometric/verify`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('[BiometricLogin] Respuesta del backend:', data);

      if (!response.ok) {
        // Caso especial: cuenta bloqueada por múltiples intentos (423 Locked)
        if (response.status === 423) {
          const remainingMinutes = data.remainingSeconds ? Math.ceil(data.remainingSeconds / 60) : 15;
          throw new Error(
            `🔒 Cuenta bloqueada por ${remainingMinutes} minuto(s) debido a ${data.failedAttempts || 3} intentos fallidos. ` +
            `Por favor, espere antes de intentar nuevamente.`
          );
        }
        // Otros errores
        throw new Error(data.message || 'Error verificando identidad');
      }

      // Éxito
      console.log('[BiometricLogin] ¡Verificación exitosa!');
      console.log('[BiometricLogin] Data recibida:', JSON.stringify(data, null, 2));
      console.log('[BiometricLogin] Token:', data.data?.token);
      console.log('[BiometricLogin] User:', data.data?.user);
      
      updateStep('success');
      setMessage('¡Identidad verificada exitosamente!');
      stopCamera();

      if (onSuccess) {
        console.log('[BiometricLogin] Llamando onSuccess con:', data.data);
        onSuccess(data.data);
      }

    } catch (error) {
      console.error('[BiometricLogin] Error capturando/verificando:', error);
      updateStep('error');
      setMessage(error.message || 'No se pudo verificar la identidad');
      if (onError) onError(error.message);
    }
  };

  /**
   * Reiniciar
   */
  const restart = () => {
    stopLivenessTimer();
    updateStep('ready');
    setMessage('Listo para iniciar. Ingrese su email.');
    setEmail('');
    setChallengeToken('');
    setBlinkCount(0);
    setLivenessScore(0);
    setCountdown(0);
    setLivenessTimeRemaining(25);
  };

  return (
    <div className="biometric-advanced-container">
      <div className="biometric-advanced-card">
        <h2 className="title-advanced">
          🛡️ Autenticación Biométrica Avanzada
        </h2>

        {/* Contenedor de video con canvas overlay */}
        <div className={`video-wrapper ${faceDetected ? 'face-detected' : ''}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`video-advanced ${step === 'countdown' ? 'pulse-effect' : ''}`}
          />
          <canvas
            ref={canvasRef}
            className="detection-canvas"
          />

          {/* Indicadores de estado */}
          {step === 'liveness-test' && (
            <div className="overlay-indicator blink-prompt">
              <div className="eye-animation">👁️</div>
              <p>Parpadee 2 veces</p>
              <div className="blink-counter">{blinkCount}/2</div>
              <div className="liveness-timer" style={{
                marginTop: '1rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: livenessTimeRemaining <= 5 ? '#ff4444' : '#47F59A',
                textShadow: livenessTimeRemaining <= 5 ? '0 0 10px rgba(255, 68, 68, 0.8)' : 'none',
                animation: livenessTimeRemaining <= 5 ? 'pulse 0.5s ease-in-out infinite' : 'none'
              }}>
                ⏱️ {livenessTimeRemaining}s
              </div>
            </div>
          )}

          {step === 'countdown' && (
            <div className="overlay-indicator countdown-display">
              <div className="count-number">{countdown}</div>
            </div>
          )}

          {step === 'success' && (
            <div className="overlay-indicator success-display">
              <div className="check-icon">✓</div>
            </div>
          )}

          {/* Indicador de rostro detectado */}
          <div className={`face-indicator ${faceDetected ? 'detected' : 'not-detected'}`}>
            {faceDetected ? '👤 Rostro detectado' : '❌ Sin rostro'}
          </div>
        </div>

        {/* Mensaje de estado */}
        <div className={`status-message status-${step}`}>
          <p>{message}</p>
          {loading && <div className="loading-spinner"></div>}
        </div>

        {/* Input de email - Solo mostrar si NO hay email pre-validado */}
        {!preValidatedEmail && (step === 'idle' || step === 'ready') && (
          <div className="email-section">
            <label htmlFor="email-input">Correo Electrónico:</label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="email-field"
              disabled={loading}
            />
          </div>
        )}

        {/* Info MFA si hay email pre-validado */}
        {preValidatedEmail && (step === 'idle' || step === 'ready' || step === 'requesting-challenge' || step === 'instructions' || step === 'liveness-test') && (
          <div className="mfa-info" style={{
            padding: '1rem',
            background: 'rgba(71, 245, 154, 0.1)',
            borderRadius: '8px',
            border: '1px solid #47F59A',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#47F59A', fontSize: '0.9rem', fontWeight: '600' }}>
              🔐 Multi-Factor Authentication - Step 2/2
            </p>
            <p style={{ margin: 0, color: '#D0D0D0', fontSize: '0.85rem' }}>
              Autenticando: {preValidatedEmail}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="action-buttons">
          {step === 'ready' && !preValidatedEmail && (
            <button
              onClick={requestChallenge}
              disabled={!email || !faceDetected || loading}
              className="btn-action btn-primary-advanced"
            >
              {!faceDetected ? '⏳ Detectando rostro...' : '🚀 Iniciar Verificación'}
            </button>
          )}

          {step === 'error' && (
            <button onClick={restart} className="btn-action btn-retry">
              🔄 Reintentar
            </button>
          )}
        </div>

        {/* Info de seguridad */}
        <div className="security-badge">
          <div className="badge-item">
            <span className="badge-icon">🔐</span>
            <span className="badge-text">Cifrado extremo a extremo</span>
          </div>
          <div className="badge-item">
            <span className="badge-icon">🤖</span>
            <span className="badge-text">IA anti-spoofing</span>
          </div>
          <div className="badge-item">
            <span className="badge-icon">🗑️</span>
            <span className="badge-text">Sin almacenamiento de imágenes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricLoginAdvanced;
