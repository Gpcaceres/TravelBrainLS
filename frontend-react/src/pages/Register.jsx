import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { API_CONFIG } from '../config'
import BiometricRegister from '../components/BiometricRegister'
import '../styles/Auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)
  const { saveAuth } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // En lugar de registrar inmediatamente, mostrar modal biométrico primero
    setLoading(false)
    setShowBiometricSetup(true)
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
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Start your journey with TravelBrain</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
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
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                className="form-input"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                minLength={3}
                disabled={loading}
                placeholder="Choose a username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                disabled={loading}
                placeholder="Your full name"
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
                placeholder="Create a password"
              />
              <small className="form-hint">At least 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                minLength={6}
                disabled={loading}
                placeholder="Confirm your password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <p className="auth-footer-text">Already have an account?</p>
            <Link to="/login" className="auth-link">Sign In</Link>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="auth-illustration-section">
          <div className="auth-content-overlay">
            <h2 className="auth-overlay-title">Explore the World</h2>
            <p className="auth-overlay-subtitle">Plan trips, discover destinations, check weather</p>
          </div>
        </div>
      </div>

      {/* Modal de Registro Biométrico - OBLIGATORIO */}
      {showBiometricSetup && (
        <div className="biometric-modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
          <div className="biometric-modal-content" style={{ maxWidth: '700px' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '1rem',
              padding: '1rem',
              background: 'rgba(71, 245, 154, 0.1)',
              borderRadius: '8px',
              border: '1px solid var(--color-primary)'
            }}>
              <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: '600' }}>
                🔒 Registro Biométrico Requerido
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-neutral-light)', fontSize: '0.85rem' }}>
                Primero captura tu rostro, luego se creará tu cuenta
              </p>
            </div>
            <BiometricRegister
              registrationData={formData}
              onSuccess={async (faceBlob) => {
                // Ahora sí registrar el usuario con la biometría ya capturada
                setShowBiometricSetup(false)
                setLoading(true)
                try {
                  // Crear FormData para enviar datos + imagen
                  const formDataToSend = new FormData()
                  formDataToSend.append('email', formData.email)
                  formDataToSend.append('username', formData.username)
                  formDataToSend.append('name', formData.name)
                  formDataToSend.append('password', formData.password)
                  formDataToSend.append('face', faceBlob, 'face.jpg')

                  const registerResponse = await api.post(API_CONFIG.ENDPOINTS.REGISTER, formDataToSend, {
                    headers: {
                      'Content-Type': 'multipart/form-data'
                    }
                  })

                  if (registerResponse.data.success) {
                    navigate('/login', { state: { message: '¡Registro exitoso! Ahora puedes iniciar sesión con reconocimiento facial.' } })
                  } else {
                    setError(registerResponse.data.message || 'Registration failed')
                  }
                } catch (err) {
                  console.error('Registration error:', err)
                  let errorMessage = 'Error al crear la cuenta. Por favor, inténtalo nuevamente.'
                  
                  if (err.response?.status === 409) {
                    errorMessage = 'Este email o username ya está registrado.'
                  } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message
                  }
                  
                  setError(errorMessage)
                } finally {
                  setLoading(false)
                }
              }}
              onError={(error) => {
                console.error('Biometric error:', error)
                setError('Error al capturar biometría. Por favor, inténtalo nuevamente.')
                setShowBiometricSetup(false)
              }}
              onCancel={() => {
                setShowBiometricSetup(false)
                setError('Registro cancelado. El registro biométrico es obligatorio para usar la aplicación.')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
