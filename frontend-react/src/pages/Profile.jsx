import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { API_CONFIG } from '../config'
import '../styles/Profile.css'

export default function Profile() {
  const { getUser, logout } = useAuth()
  const navigate = useNavigate()
  const currentUser = getUser()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [user, setUser] = useState({
    name: currentUser?.name || '',
    username: currentUser?.username || '',
    email: currentUser?.email || ''
  })
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser?._id) {
      loadUserData()
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.user-menu')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [currentUser?._id, showMenu])

  const loadUserData = async () => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.USER_BY_ID}/${currentUser._id}`)
      if (response.data) {
        setUser({
          name: response.data.name || '',
          username: response.data.username || '',
          email: response.data.email || ''
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleInputChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.put(`${API_CONFIG.ENDPOINTS.USER_BY_ID}/${currentUser._id}`, {
        name: user.name,
        username: user.username,
        email: user.email
      })

      if (response.data) {
        // Update localStorage with new user data
        const token = localStorage.getItem('token')
        localStorage.setItem('user', JSON.stringify(response.data))
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setIsEditing(false)
        
        // Refresh page after 1.5 seconds
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setShowMenu(false)
    logout()
    navigate('/login')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await api.put(`${API_CONFIG.ENDPOINTS.USER_BY_ID}/${currentUser._id}`, {
        currentPassword: passwords.current,
        newPassword: passwords.new
      })

      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setIsChangingPassword(false)
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      await api.delete(`${API_CONFIG.ENDPOINTS.USER_BY_ID}/${currentUser._id}`)
      logout()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete account' 
      })
    }
  }

  return (
    <div className="profile-page">
      {/* Navbar */}
      <nav className="profile-navbar">
        <div className="container navbar-content">
          <div className="navbar-left">
            <img src="/assets/images/logo.png" alt="Logo" className="navbar-logo" />
            <span className="navbar-brand">TravelBrain</span>
          </div>
          
          <div className="navbar-center">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/trips" className="nav-link">My Trips</Link>
            <Link to="/destinations" className="nav-link">Destinations</Link>
            <Link to="/weather" className="nav-link">Weather</Link>
          </div>

          <div className="navbar-right">
            <div className="user-menu">
              <button 
                className="user-menu-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                <div className="user-avatar">
                  {(currentUser?.name || currentUser?.username || 'U').substring(0, 2).toUpperCase()}
                </div>
                <span className="user-name">{currentUser?.name || currentUser?.username || 'User'}</span>
                <span className={`dropdown-arrow ${showMenu ? 'rotated' : ''}`}>▼</span>
              </button>

              {showMenu && (
                <div className="user-menu-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar">
                        {(currentUser?.name || currentUser?.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="dropdown-name">{currentUser?.name || currentUser?.username || 'User'}</p>
                        <p className="dropdown-email">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2.5 1h-5A2.5 2.5 0 003 11.5V13a1 1 0 001 1h8a1 1 0 001-1v-1.5A2.5 2.5 0 0010.5 9z"/>
                    </svg>
                    Profile Settings
                  </Link>
                  {currentUser?.role === 'ADMIN' && (
                    <Link to="/admin" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1.5 1.5A.5.5 0 012 1h12a.5.5 0 01.5.5v2a.5.5 0 01-.128.334L10 8.692V13.5a.5.5 0 01-.342.474l-3 1A.5.5 0 016 14.5V8.692L1.628 3.834A.5.5 0 011.5 3.5v-2z"/>
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/>
                      <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {(user.name || user.username || 'U').substring(0, 2).toUpperCase()}
          </div>
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">{user.email}</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Profile Information */}
        <div className="profile-card">
          <div className="card-header">
            <h2 className="card-title">Profile Information</h2>
            {!isEditing && (
              <button 
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="profile-info">
              <div className="info-item">
                <label className="info-label">Full Name</label>
                <p className="info-value">{user.name || 'Not set'}</p>
              </div>

              <div className="info-item">
                <label className="info-label">Username</label>
                <p className="info-value">{user.username || 'Not set'}</p>
              </div>

              <div className="info-item">
                <label className="info-label">Email Address</label>
                <p className="info-value">{user.email}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={user.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={user.username}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false)
                    loadUserData()
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Settings */}
        <div className="profile-card">
          <div className="card-header">
            <h2 className="card-title">Security Settings</h2>
            {!isChangingPassword && (
              <button 
                className="btn-edit"
                onClick={() => setIsChangingPassword(true)}
              >
                Change Password
              </button>
            )}
          </div>

          {!isChangingPassword ? (
            <div className="profile-info">
              <div className="info-item">
                <label className="info-label">Password</label>
                <p className="info-value">••••••••</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label htmlFor="current">Current Password</label>
                <input
                  type="password"
                  id="current"
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new">New Password</label>
                <input
                  type="password"
                  id="new"
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  className="form-input"
                  minLength={6}
                  required
                />
                <span className="form-hint">At least 6 characters</span>
              </div>

              <div className="form-group">
                <label htmlFor="confirm">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  className="form-input"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswords({ current: '', new: '', confirm: '' })
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Danger Zone */}
        <div className="profile-card danger-zone">
          <div className="card-header">
            <h2 className="card-title">Danger Zone</h2>
          </div>
          
          <div className="danger-content">
            <div>
              <h3 className="danger-title">Delete Account</h3>
              <p className="danger-text">
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>
            <button 
              className="btn-danger"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
