import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { API_CONFIG } from '../config'
import BiometricLoginAdvanced from '../components/BiometricLoginAdvanced'
import '../styles/Auth.css'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showBiometric, setShowBiometric] = useState(false)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.LOGIN, formData)
      
      if (response.data.success && response.data.token) {
        saveAuth(response.data.token, response.data.user)
        navigate('/dashboard')
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
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
            <p className="auth-subtitle">Sign in to continue your journey</p>
          </div>

          {successMessage && <div className="alert alert-success">{successMessage}</div>}
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => setShowBiometric(true)}
            style={{ 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #47F59A, #39C070)',
              color: '#101110',
              border: 'none',
              fontWeight: '600'
            }}
          >
            🔐 Sign In with Face Recognition
          </button>

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

      {/* Modal Biométrico */}
      {showBiometric && (
        <div className="biometric-modal-overlay" onClick={() => setShowBiometric(false)}>
          <div className="biometric-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="biometric-modal-close"
              onClick={() => setShowBiometric(false)}
            >
              ✕
            </button>
            <BiometricLoginAdvanced
              onSuccess={(data) => {
                console.log('[Login] Biometric success data:', data)
                console.log('[Login] Token:', data.token)
                console.log('[Login] User:', data.user)
                saveAuth(data.token, data.user)
                console.log('[Login] Auth guardado, navegando a dashboard')
                navigate('/dashboard')
              }}
              onError={(error) => {
                setError(error)
                setShowBiometric(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
