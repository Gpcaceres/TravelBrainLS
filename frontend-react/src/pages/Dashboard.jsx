import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { API_CONFIG } from '../config'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const { getUser, logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(getUser())
  const [stats, setStats] = useState({ trips: 0, destinations: 0, favorites: 0 })
  const [showMenu, setShowMenu] = useState(false)
  const [recentActivities, setRecentActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest('.user-menu')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMenu])

  const loadDashboardData = async () => {
    try {
      setLoadingActivities(true)
      const [tripsRes, destinationsRes, weatherRes] = await Promise.all([
        api.get(API_CONFIG.ENDPOINTS.TRIPS),
        api.get(API_CONFIG.ENDPOINTS.DESTINATIONS),
        api.get(API_CONFIG.ENDPOINTS.WEATHERS).catch(() => ({ data: [] }))
      ])

      const trips = Array.isArray(tripsRes.data) ? tripsRes.data : []
      const destinations = Array.isArray(destinationsRes.data) ? destinationsRes.data : []
      const weathers = Array.isArray(weatherRes.data) ? weatherRes.data : []

      setStats({
        trips: trips.filter(t => t.userId === user._id).length,
        destinations: destinations.length,
        favorites: 0
      })

      // Combine all activities
      const activities = []

      // Add trips
      trips.slice(0, 5).forEach(trip => {
        activities.push({
          type: 'trip',
          icon: '✈️',
          title: 'Created trip',
          description: `${trip.title} to ${trip.destination}`,
          date: trip.createdAt || new Date(),
          color: '#47F59A'
        })
      })

      // Add destinations
      destinations.slice(0, 5).forEach(dest => {
        activities.push({
          type: 'destination',
          icon: '📍',
          title: 'Added destination',
          description: `${dest.name}, ${dest.country}`,
          date: dest.createdAt || new Date(),
          color: '#a77bf3'
        })
      })

      // Add weather searches
      weathers.slice(0, 3).forEach(weather => {
        activities.push({
          type: 'weather',
          icon: '☁️',
          title: 'Checked weather',
          description: `${weather.label || 'Location'} - ${weather.temp}°C`,
          date: weather.createdAt || new Date(),
          color: '#E54A7A'
        })
      })

      // Sort by date (most recent first) and take top 5
      activities.sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentActivities(activities.slice(0, 5))
      setLoadingActivities(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoadingActivities(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatActivityDate = (date) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffTime = Math.abs(now - activityDate)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return activityDate.toLocaleDateString()
  }

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
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
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
              >
                <div className="user-avatar">
                  {(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}
                </div>
                <span className="user-name">{user?.name || user?.username || 'User'}</span>
                <svg 
                  className={`dropdown-arrow ${showMenu ? 'rotated' : ''}`} 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="currentColor"
                >
                  <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"/>
                </svg>
              </button>

              {showMenu && (
                <div className="user-menu-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar">
                        {(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="dropdown-name">{user?.name || user?.username}</p>
                        <p className="dropdown-email">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2.5 1h-5A2.5 2.5 0 003 11.5V13a1 1 0 001 1h8a1 1 0 001-1v-1.5A2.5 2.5 0 0010.5 9z"/>
                    </svg>
                    My Profile
                  </Link>
                  
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1.5 1.5A.5.5 0 012 1h12a.5.5 0 01.5.5v2a.5.5 0 01-.128.334L10 8.692V13.5a.5.5 0 01-.342.474l-3 1A.5.5 0 016 14.5V8.692L1.628 3.834A.5.5 0 011.5 3.5v-2z"/>
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  
                  <button className="dropdown-item" onClick={() => setShowMenu(false)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z"/>
                      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 01-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 01-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 01.52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 011.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 011.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 01.52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 01-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 01-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 002.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 001.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 00-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 00-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 00-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 001.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 003.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 002.692-1.115l.094-.319z"/>
                    </svg>
                    Settings
                  </button>
                  
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
      <main className="dashboard-main container">
        {/* Welcome */}
        <section className="welcome-section">
          <div>
            <h1 className="welcome-title">
              Welcome back, {user?.name || user?.username || 'Traveler'}! 🌍
            </h1>
            <p className="welcome-subtitle">Ready to plan your next adventure?</p>
          </div>
          <Link to="/trips" className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
            </svg>
            Plan New Trip
          </Link>
        </section>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon stat-icon-trips">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V4zm2-1a1 1 0 00-1 1v.217l7 4.2 7-4.2V4a1 1 0 00-1-1H2zm13 2.383l-4.758 2.855L15 11.114v-5.73zm-.034 6.878L9.271 8.82 8 9.583 6.728 8.82l-5.694 3.44A1 1 0 002 13h12a1 1 0 00.966-.739zM1 11.114l4.758-2.876L1 5.383v5.73z"/>
                </svg>
              </div>
              <h3 className="stat-value">{stats.trips}</h3>
            </div>
            <p className="stat-label">Total Trips</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon stat-icon-destinations">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/>
                </svg>
              </div>
              <h3 className="stat-value">{stats.destinations}</h3>
            </div>
            <p className="stat-label">Destinations</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon stat-icon-favorites">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                </svg>
              </div>
              <h3 className="stat-value">{stats.favorites}</h3>
            </div>
            <p className="stat-label">Favorite Routes</p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/trips" className="action-card">
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a.5.5 0 01.5.5V6a.5.5 0 01-.5.5H6.5v1.5a.5.5 0 01-1 0V6.5H4a.5.5 0 010-1h1.5V4a.5.5 0 011 0v1.5H8a.5.5 0 01.5.5zM3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1z"/>
                </svg>
              </div>
              <h3 className="action-title">Plan Trip</h3>
              <p className="action-description">Create a new travel itinerary with destinations and dates</p>
            </Link>

            <Link to="/destinations" className="action-card">
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 005.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 01.64-1.539 6.7 6.7 0 01.597-.933A7.025 7.025 0 002.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 00-.656 2.5h2.49zM4.847 5a12.5 12.5 0 00-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 00-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 00.337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 01-.597-.933A9.268 9.268 0 014.09 12H2.255a7.024 7.024 0 003.072 2.472zM3.82 11a13.652 13.652 0 01-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0013.745 12H11.91a9.27 9.27 0 01-.64 1.539 6.688 6.688 0 01-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 01-.312 2.5zm2.802-3.5a6.959 6.959 0 00-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 00-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 00-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
                </svg>
              </div>
              <h3 className="action-title">Explore</h3>
              <p className="action-description">Discover new destinations around the world</p>
            </Link>

            <Link to="/trips" className="action-card">
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.5 1A1.5 1.5 0 001 2.5v11A1.5 1.5 0 002.5 15h11a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0013.5 1h-11zM2 2.5a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11zm2 2a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z"/>
                </svg>
              </div>
              <h3 className="action-title">My Trips</h3>
              <p className="action-description">View and manage your travel plans</p>
            </Link>

            <Link to="/destinations" className="action-card">
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/>
                </svg>
              </div>
              <h3 className="action-title">Destinations</h3>
              <p className="action-description">Browse and save your favorite places</p>
            </Link>

            <Link to="/weather" className="action-card">
              <div className="action-icon">
                <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.5 7.5A1.5 1.5 0 0012 6h-.5a.5.5 0 010-1h.5a2.5 2.5 0 012.486 2.167A3 3 0 0113.5 13H3a3 3 0 01-.405-5.973A3.5 3.5 0 0110 5.5a.5.5 0 01-1 0 2.5 2.5 0 00-5 0 .5.5 0 01-.5.5h-.5a2 2 0 000 4h10.5a2 2 0 000-4z"/>
                </svg>
              </div>
              <h3 className="action-title">Weather</h3>
              <p className="action-description">Check weather forecasts for your destinations</p>
            </Link>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="recent-activity">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-card">
            {loadingActivities ? (
              <div className="empty-state">
                <div className="spinner"></div>
                <p>Loading activities...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="activity-list">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon" style={{ background: `${activity.color}15`, color: activity.color }}>
                      <span>{activity.icon}</span>
                    </div>
                    <div className="activity-content">
                      <h4 className="activity-title">{activity.title}</h4>
                      <p className="activity-description">{activity.description}</p>
                      <span className="activity-time">{formatActivityDate(activity.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                  <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
                </svg>
                <p>No recent activity yet</p>
                <p className="empty-state-subtitle">Start planning your first trip!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

