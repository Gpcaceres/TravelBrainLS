import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { tripService } from '../services/tripService'
import LocationAutocomplete from '../components/LocationAutocomplete'
import '../styles/Trips.css'

export default function Trips() {
  const { getUser, logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(getUser())
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showMenu, setShowMenu] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    description: ''
  })

  useEffect(() => {
    loadTrips()

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.user-menu')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMenu])

  const loadTrips = async () => {
    try {
      setLoading(true)
      const data = await tripService.getAllTrips()
      // El backend ya filtra por usuario autenticado
      setTrips(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading trips:', error)
      setMessage({ type: 'error', text: 'Failed to load trips' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const openModal = (trip = null) => {
    if (trip) {
      setEditingTrip(trip)
      setFormData({
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate?.split('T')[0] || '',
        endDate: trip.endDate?.split('T')[0] || '',
        budget: trip.budget || '',
        description: trip.description || ''
      })
    } else {
      setEditingTrip(null)
      setFormData({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: '',
        description: ''
      })
    }
    setShowModal(true)
    setMessage({ type: '', text: '' })
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTrip(null)
    setFormData({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      budget: '',
      description: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const tripData = {
        ...formData,
        userId: user._id,
        budget: formData.budget ? parseFloat(formData.budget) : 0
      }

      if (editingTrip) {
        await tripService.updateTrip(editingTrip._id, tripData)
        setMessage({ type: 'success', text: 'Trip updated successfully!' })
      } else {
        await tripService.createTrip(tripData)
        setMessage({ type: 'success', text: 'Trip created successfully!' })
      }

      closeModal()
      loadTrips()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save trip' 
      })
    }
  }

  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return

    try {
      await tripService.deleteTrip(tripId)
      setMessage({ type: 'success', text: 'Trip deleted successfully!' })
      loadTrips()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete trip' 
      })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return ''
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} day${days > 1 ? 's' : ''}` : ''
  }

  const handleLogout = () => {
    setShowMenu(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="trips-page">
      {/* Navbar */}
      <nav className="trips-navbar">
        <div className="container navbar-content">
          <div className="navbar-left">
            <img src="/assets/images/logo.png" alt="Logo" className="navbar-logo" />
            <span className="navbar-brand">TravelBrain</span>
          </div>
          
          <div className="navbar-center">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/trips" className="nav-link active">My Trips</Link>
            <Link to="/itineraries" className="nav-link">Itineraries</Link>
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
                  {(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}
                </div>
                <span className="user-name">{user?.name || user?.username || 'User'}</span>
                <span className={`dropdown-arrow ${showMenu ? 'rotated' : ''}`}>▼</span>
              </button>

              {showMenu && (
                <div className="user-menu-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar">
                        {(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="dropdown-name">{user?.name || user?.username || 'User'}</p>
                        <p className="dropdown-email">{user?.email}</p>
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
                  {user?.role === 'ADMIN' && (
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
      <div className="container trips-container">
        {/* Header */}
        <div className="trips-header">
          <div>
            <h1 className="trips-title">My Trips</h1>
            <p className="trips-subtitle">Plan and manage your travel adventures</p>
          </div>
          <button className="btn-primary" onClick={() => openModal()}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
            </svg>
            Create Trip
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Trips Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
              <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
            </svg>
            <h3>No trips yet</h3>
            <p>Start planning your first adventure!</p>
            <button className="btn-primary" onClick={() => openModal()}>
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <div key={trip._id} className="trip-card">
                <div className="trip-header">
                  <h3 className="trip-title">{trip.title}</h3>
                  <div className="trip-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => openModal(trip)}
                      title="Edit trip"
                    >
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.293-6.293z"/>
                      </svg>
                    </button>
                    <button 
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleDelete(trip._id)}
                      title="Delete trip"
                    >
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Detalles del viaje con usuario y fecha */}
                <div className="trip-user-details">
                  <strong>Usuario:</strong> {user?.name || user?.username || 'User'}<br />
                  <strong>Fecha de creación:</strong> {trip.createdAt ? formatDate(trip.createdAt) : 'N/A'}<br />
                  <strong>ID de viaje:</strong> {trip._id}
                </div>

                <div className="trip-destination">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/>
                  </svg>
                  {trip.destination}
                </div>

                <div className="trip-dates">
                  <div className="date-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1z"/>
                    </svg>
                    <span>{formatDate(trip.startDate)}</span>
                  </div>
                  <span className="date-separator">→</span>
                  <div className="date-item">
                    <span>{formatDate(trip.endDate)}</span>
                  </div>
                </div>

                {calculateDuration(trip.startDate, trip.endDate) && (
                  <div className="trip-duration">
                    {calculateDuration(trip.startDate, trip.endDate)}
                  </div>
                )}

                {trip.budget > 0 && (
                  <div className="trip-budget">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
                    </svg>
                    ${trip.budget.toLocaleString()}
                  </div>
                )}

                {trip.description && (
                  <p className="trip-description">{trip.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTrip ? 'Edit Trip' : 'Create New Trip'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="title">Trip Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer Vacation 2026"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="destination">Destination *</label>
                <LocationAutocomplete
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="e.g., Paris, France"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date *</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="budget">Budget (USD)</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add notes about your trip..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTrip ? 'Update Trip' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
