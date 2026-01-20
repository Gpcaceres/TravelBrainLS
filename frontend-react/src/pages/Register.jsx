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

    setLoading(true)

    try {
      // Register new user
      const registerResponse = await api.post(API_CONFIG.ENDPOINTS.REGISTER, {
        email: formData.email,
        username: formData.username,
        name: formData.name,
        password: formData.password
      })

      if (registerResponse.data.success && registerResponse.data.token) {
        saveAuth(registerResponse.data.token, registerResponse.data.user)
        setLoading(false)
        // Mostrar modal de registro biométrico
        setShowBiometricSetup(true)
      } else {
        setError(registerResponse.data.message || 'Registration failed')
        setLoading(false)
      }
    } catch (err) {
      console.error('Registration error:', err)
      let errorMessage = 'Registration failed. Please try again.'
      
      if (err.response?.status === 409) {
        errorMessage = 'This email or username is already registered. Please use a different one.'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
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

      {/* Modal de Registro Biométrico */}
      {showBiometricSetup && (
        <div className="biometric-modal-overlay">
          <div className="biometric-modal-content" style={{ maxWidth: '700px' }}>
            <BiometricRegister
              onSuccess={() => {
                setShowBiometricSetup(false)
                // Limpiar sesión y redirigir al login
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                navigate('/login', { state: { message: '¡Registro exitoso! Ahora puedes iniciar sesión.' } })
              }}
              onSkip={() => {
                setShowBiometricSetup(false)
                // Limpiar sesión y redirigir al login
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                navigate('/login', { state: { message: 'Registro completado. Ahora puedes iniciar sesión.' } })
              }}
              onError={(error) => {
                console.error('Biometric error:', error)
                setShowBiometricSetup(false)
                // Limpiar sesión y redirigir al login
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                navigate('/login', { state: { message: 'Registro completado. Ahora puedes iniciar sesión.' } })
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
