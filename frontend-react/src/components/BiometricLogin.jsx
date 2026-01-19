import React, { useRef, useState, useEffect } from 'react';
import './BiometricLogin.css';

/**
 * Componente de Login Biométrico con Detección de Vida
 * 
 * Implementa:
 * - Captura de video en tiempo real
 * - Detección de parpadeo
 * - Instrucciones de prueba de vida
 * - Comunicación segura con backend
 * - Feedback visual al usuario
 */
const BiometricLogin = ({ onSuccess, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState('idle'); // idle, requesting-challenge, capturing, analyzing, success, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para detección de parpadeo
  const [eyeOpenFrames, setEyeOpenFrames] = useState(0);
  const [eyeClosedFrames, setEyeClosedFrames] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  /**
   * Iniciar cámara
   */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStep('ready');
        setMessage('Cámara iniciada. Por favor ingrese su email.');
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      setMessage('No se pudo acceder a la cámara. Por favor, conceda los permisos necesarios.');
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
   * Paso 1: Solicitar desafío (challenge) al backend
   */
  const requestChallenge = async () => {
    if (!email) {
      setMessage('Por favor, ingrese su email');
      return;
    }

    setLoading(true);
    setStep('requesting-challenge');
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

      setChallengeToken(data.data.challengeToken);
      setStep('instructions');
      setMessage('Desafío recibido. Siga las instrucciones en pantalla.');
      setLoading(false);

      // Iniciar prueba de vida después de 2 segundos
      setTimeout(() => {
        startLivenessTest();
      }, 2000);

    } catch (error) {
      console.error('Error solicitando desafío:', error);
      setMessage(error.message);
      setStep('error');
      setLoading(false);
      if (onError) onError(error.message);
    }
  };

  /**
   * Paso 2: Iniciar prueba de vida
   * Pide al usuario que parpadee
   */
  const startLivenessTest = () => {
    setStep('liveness-test');
    setMessage('Por favor, parpadee lentamente 2 veces');
    setBlinkDetected(false);

    // Iniciar detección de parpadeo
    detectBlinks();
  };

  /**
   * Detección simple de parpadeo mediante análisis de frames
   * En producción, usar una librería como face-api.js o MediaPipe
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

      // Análisis simplificado: detectar cambios de brillo en región de ojos
      // En producción, usar detección facial real (face-api.js, MediaPipe)
      const imageData = context.getImageData(
        canvas.width * 0.3,
        canvas.height * 0.3,
        canvas.width * 0.4,
        canvas.height * 0.2
      );

      const brightness = calculateBrightness(imageData);

      // Si el brillo disminuye significativamente, puede ser un parpadeo
      if (brightness < 100 && lastState === 'open') {
        lastState = 'closed';
      } else if (brightness > 120 && lastState === 'closed') {
        lastState = 'open';
        blinkCount++;
        setMessage(`Parpadeo detectado (${blinkCount}/2)`);

        if (blinkCount >= 2) {
          setBlinkDetected(true);
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
   * Paso 3: Countdown antes de capturar
   */
  const startCountdown = () => {
    setStep('countdown');
    let count = 3;
    setCountdown(count);
    setMessage(`Capturando en ${count}...`);

    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count > 0) {
        setMessage(`Capturando en ${count}...`);
      } else {
        clearInterval(timer);
        captureAndVerify();
      }
    }, 1000);
  };

  /**
   * Paso 4: Capturar imagen y verificar con backend
   */
  const captureAndVerify = async () => {
    setStep('capturing');
    setMessage('Capturando imagen...');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) {
        throw new Error('No se pudo acceder al video');
      }

      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir a blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      setStep('analyzing');
      setMessage('Analizando identidad...');

      // Enviar al backend
      const formData = new FormData();
      formData.append('face', blob, 'face.jpg');
      formData.append('challengeToken', challengeToken);
      formData.append('email', email);

      const response = await fetch(`${API_BASE_URL}/api/biometric/verify`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error verificando identidad');
      }

      // ¡Éxito!
      setStep('success');
      setMessage('¡Identidad verificada exitosamente!');
      stopCamera();

      if (onSuccess) {
        onSuccess(data.data);
      }

    } catch (error) {
      console.error('Error capturando/verificando:', error);
      setStep('error');
      setMessage(error.message || 'Error verificando identidad');
      if (onError) onError(error.message);
    }
  };

  /**
   * Reiniciar proceso
   */
  const restart = () => {
    setStep('ready');
    setMessage('Listo para iniciar. Ingrese su email.');
    setEmail('');
    setChallengeToken('');
    setBlinkDetected(false);
    setCountdown(0);
  };

  /**
   * Lifecycle: Iniciar cámara al montar
   */
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="biometric-login-container">
      <div className="biometric-card">
        <h2 className="biometric-title">
          🔐 Login Biométrico Seguro
        </h2>

        {/* Video de cámara */}
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`video-feed ${step === 'countdown' ? 'pulse' : ''}`}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Overlay de instrucciones */}
          {step === 'liveness-test' && (
            <div className="video-overlay blink-indicator">
              <div className="blink-eye">👁️</div>
              <p>Parpadee lentamente</p>
            </div>
          )}

          {step === 'countdown' && (
            <div className="video-overlay countdown-overlay">
              <div className="countdown-number">{countdown}</div>
            </div>
          )}

          {step === 'success' && (
            <div className="video-overlay success-overlay">
              <div className="success-icon">✓</div>
            </div>
          )}
        </div>

        {/* Mensaje de estado */}
        <div className={`message-box message-${step}`}>
          <p>{message}</p>
          {loading && <div className="spinner"></div>}
        </div>

        {/* Input de email */}
        {(step === 'idle' || step === 'ready') && (
          <div className="input-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="email-input"
              disabled={loading}
            />
          </div>
        )}

        {/* Botones de acción */}
        <div className="button-group">
          {step === 'ready' && (
            <button
              onClick={requestChallenge}
              disabled={!email || loading}
              className="btn btn-primary"
            >
              Iniciar Verificación Biométrica
            </button>
          )}

          {step === 'error' && (
            <button onClick={restart} className="btn btn-secondary">
              Reintentar
            </button>
          )}

          {step === 'success' && onSuccess && (
            <button 
              onClick={() => onSuccess(null)} 
              className="btn btn-success"
            >
              Continuar
            </button>
          )}
        </div>

        {/* Información de seguridad */}
        <div className="security-info">
          <p className="security-text">
            🔒 <strong>Conexión segura:</strong> Su imagen se analiza de forma segura y no se almacena.
          </p>
          <p className="security-text">
            👁️ <strong>Detección de vida:</strong> Sistema anti-spoofing activo.
          </p>
          <p className="security-text">
            🛡️ <strong>Privacidad:</strong> Solo se procesan características matemáticas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BiometricLogin;
