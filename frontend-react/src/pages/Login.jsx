import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BiometricLoginAdvanced from '../components/BiometricLoginAdvanced'
import '../styles/Auth.css'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showBiometric, setShowBiometric] = useState(false)
  const [validatedEmail, setValidatedEmail] = useState('')
  const [step, setStep] = useState('credentials') // 'credentials' | 'biometric'
  const { saveAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Mostrar mensaje de éxito del registro si existe
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }, [location])

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      // Validar credenciales sin generar token completo
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/validate-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Credenciales inválidas')
        setLoading(false)
        return
      }

      if (data.success) {
        // Verificar si tiene biometría registrada
        if (!data.hasBiometric) {
          setError('Debes registrar tu biometría facial antes de iniciar sesión. Contacta al administrador.')
          setLoading(false)
          return
        }

        // Credenciales válidas, pasar a reconocimiento facial
        setValidatedEmail(formData.email)
        setStep('biometric')
        setShowBiometric(true)
        setLoading(false)
      } else {
        setError(data.message || 'Error al validar credenciales')
        setLoading(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al validar credenciales. Por favor, intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      
      <div className="auth-container">
        {/* Left Side - Form */}
        <div className="auth-form-section">
          <div className="auth-logo-header">
            <img src="/assets/images/logo.png" alt="TravelBrain" className="auth-logo-img" />
          </div>

          <div className="auth-header">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">
              {step === 'credentials' ? 'Enter your credentials' : 'Verify your face'}
            </p>
          </div>

          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {step === 'credentials' && (
            <>
              <div className="biometric-required-info" style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(71, 245, 154, 0.1), rgba(57, 192, 112, 0.1))',
                borderRadius: '12px',
                border: '2px solid #47F59A',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#47F59A', fontSize: '1rem' }}>
                  Multi-Factor Authentication (MFA)
                </h3>
                <p style={{ margin: 0, color: '#D0D0D0', fontSize: '0.85rem' }}>
                  Step 1: Credentials → Step 2: Facial Recognition
                </p>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={loading}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                    disabled={loading}
                    placeholder="Enter your password"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Validating...' : '🔑 Continue to Face Recognition'}
                </button>
              </form>
            </>
          )}

          {step === 'biometric' && (
            <div className="biometric-step-info" style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(71, 245, 154, 0.1), rgba(57, 192, 112, 0.1))',
              borderRadius: '12px',
              border: '2px solid #47F59A',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#47F59A', fontSize: '1.1rem' }}>
                Credentials Validated
              </h3>
              <p style={{ margin: 0, color: '#D0D0D0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Step 2: Complete facial recognition to access your account
              </p>
              <p style={{ margin: 0, color: '#999', fontSize: '0.8rem' }}>
                Email: {validatedEmail}
              </p>
            </div>
          )}

          <div className="auth-footer">
            <p className="auth-footer-text">Don't have an account?</p>
            <Link to="/register" className="auth-link">Create Account</Link>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="auth-illustration-section">
          <div className="auth-content-overlay">
            <h2 className="auth-overlay-title">Start Planning Your Next Adventure</h2>
            <p className="auth-overlay-subtitle">Join thousands of travelers using TravelBrain</p>
          </div>
        </div>
      </div>

      {/* Modal Biométrico - Paso 2 de MFA */}
      {showBiometric && step === 'biometric' && (
        <div className="biometric-modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
          <div className="biometric-modal-content" role="dialog" aria-label="Facial recognition" onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '1rem',
              padding: '1rem',
              background: 'rgba(71, 245, 154, 0.1)',
              borderRadius: '8px',
              border: '1px solid #47F59A'
            }}>
              <p style={{ margin: 0, color: '#47F59A', fontSize: '0.9rem', fontWeight: '600' }}>
                🔒 Step 2/2: Facial Recognition Required
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#D0D0D0', fontSize: '0.85rem' }}>
                Validating: {validatedEmail}
              </p>
            </div>
            <BiometricLoginAdvanced
              email={validatedEmail}
              onSuccess={(data) => {
                console.log('[Login MFA] Biometric success data:', data)
                saveAuth(data.token, data.user)
                navigate('/dashboard')
              }}
              onError={(error) => {
                setError(error)
                setShowBiometric(false)
                setStep('credentials')
                setValidatedEmail('')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
