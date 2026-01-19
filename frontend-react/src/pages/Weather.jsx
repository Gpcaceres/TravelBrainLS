import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { weatherService } from '../services/weatherService'
import { API_KEYS, API_ENDPOINTS } from '../config/apiKeys'
import '../styles/Weather.css'

export default function Weather() {
  const { getUser, logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(getUser())
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedSearches, setSavedSearches] = useState([])
  const [loadingSearches, setLoadingSearches] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimeoutRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Update user state when auth changes
  useEffect(() => {
    const currentUser = getUser()
    if (currentUser && currentUser._id !== user?._id) {
      setUser(currentUser)
    }
  }, [])

  // Load saved searches when component mounts or user changes
  useEffect(() => {
    if (user && user._id) {
      loadSavedSearches()
    }
  }, [user?._id])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest('.user-menu')) {
        setShowMenu(false)
      }
      if (showSuggestions && suggestionsRef.current && !suggestionsRef.current.contains(e.target) && !e.target.closest('.weather-search-input')) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMenu, showSuggestions])

  const handleLogout = () => {
    setShowMenu(false)
    logout()
    navigate('/')
  }

  const loadSavedSearches = async () => {
    try {
      setLoadingSearches(true)
      console.log('Loading saved searches...')
      const searches = await weatherService.getAllWeatherSearches()
      console.log('Loaded searches:', searches)
      // Sort by most recent first
      const sortedSearches = (searches || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setSavedSearches(sortedSearches)
    } catch (error) {
      console.error('Error loading saved searches:', error)
      console.error('Error details:', error.response?.data || error.message)
      setSavedSearches([])
    } finally {
      setLoadingSearches(false)
    }
  }

  const searchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      )
      const data = await response.json()
      const formattedSuggestions = data.map(item => ({
        display_name: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        lat: item.lat,
        lon: item.lon
      }))
      setSuggestions(formattedSuggestions)
      setShowSuggestions(formattedSuggestions.length > 0)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    }
  }

  const handleSearchInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(() => {
      searchSuggestions(value)
    }, 500)
  }

  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.name)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const searchWeather = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setError('Please enter a city name')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if API key is configured
      if (!API_KEYS.WEATHER || API_KEYS.WEATHER === 'demo_key') {
        throw new Error('Weather API key not configured. Please contact administrator.')
      }

      // Use WeatherAPI.com (Free tier: 1M calls/month)
      const response = await fetch(
        `${API_ENDPOINTS.WEATHER}/current.json?key=${API_KEYS.WEATHER}&q=${encodeURIComponent(searchQuery)}&aqi=no`
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key. Please configure a valid WeatherAPI.com API key.')
        }
        throw new Error(errorData.error?.message || 'City not found')
      }

      const data = await response.json()
      
      const weatherInfo = {
        label: data.location.name,
        lat: data.location.lat,
        lon: data.location.lon,
        temp: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: Number((data.current.wind_kph / 3.6).toFixed(2)), // Convert kph to m/s and round to 2 decimals
        description: data.current.condition.text,
        icon: data.current.condition.icon
      }

      setWeatherData(weatherInfo)
      
      // Save to database
      console.log('Saving weather search...')
      const savedWeather = await weatherService.createWeatherSearch(weatherInfo)
      console.log('Weather search saved:', savedWeather)
      
      // Esperar un poco y recargar desde el backend para evitar duplicados
      setTimeout(() => {
        loadSavedSearches()
      }, 1000)
      
      // Clear the search query after successful search
      setSearchQuery('')
      setSuggestions([])
      setShowSuggestions(false)
      
    } catch (error) {
      setError(error.message || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const deleteSearch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this weather search?')) return
    
    try {
      console.log('Deleting weather search with ID:', id)
      const result = await weatherService.deleteWeather(id)
      console.log('Delete result:', result)
      
      // Reload from server to ensure sync
      await loadSavedSearches()
      
      setMessage({ type: 'success', text: 'Weather search deleted successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error deleting search:', error)
      console.error('Error details:', error.response?.data || error.message)
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete weather search' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const getWeatherIcon = (condition) => {
    const icons = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️',
      Haze: '🌫️'
    }
    return icons[condition] || '🌤️'
  }

  return (
    <div className="weather-page">
      {/* Navbar */}
      <nav className="weather-navbar">
        <div className="container navbar-content">
          <div className="navbar-left">
            <img src="/assets/images/logo.png" alt="Logo" className="navbar-logo" />
            <span className="navbar-brand">TravelBrain</span>
          </div>

          <div className="navbar-center">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/trips" className="nav-link">My Trips</Link>
            <Link to="/destinations" className="nav-link">Destinations</Link>
            <Link to="/weather" className="nav-link active">Weather</Link>
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
      <div className="container weather-container">
        {/* Header */}
        <div className="weather-header">
          <div>
            <h1 className="weather-title">Weather Forecast</h1>
            <p className="weather-subtitle">Check weather conditions for your destinations</p>
            <div className="weather-api-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Powered by WeatherAPI.com
            </div>
          </div>
        </div>

        {/* Search Form */}
        <section className="search-section">
          <form onSubmit={searchWeather} className="weather-search-form">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z"/>
              </svg>
              <input
                type="text"
                className="weather-search-input"
                placeholder="Enter city name (e.g., London, New York, Tokyo)"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? (
                  <div className="spinner-small"></div>
                ) : (
                  'Search'
                )}
              </button>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown" ref={suggestionsRef}>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/>
                      </svg>
                      <span className="suggestion-text">{suggestion.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                <path d="M7.002 11a1 1 0 112 0 1 1 0 01-2 0zM7.1 4.995a.905.905 0 111.8 0l-.35 3.507a.552.552 0 01-1.1 0L7.1 4.995z"/>
              </svg>
              {error}
            </div>
          )}
        </section>

        {/* Current Weather Display */}
        {weatherData && (
          <section className="current-weather">
            <div className="weather-card-main">
              <div className="weather-location">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/>
                </svg>
                <h2>{weatherData.label}</h2>
              </div>
              
              <div className="weather-main-info">
                <div className="weather-temp">
                  <span className="temp-icon">{getWeatherIcon(weatherData.condition)}</span>
                  <span className="temp-value">{weatherData.temp}°C</span>
                </div>
                
                <p className="weather-condition">{weatherData.description}</p>

                <div className="weather-details">
                  <div className="weather-detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.5 8.5a.5.5 0 00-1 0v5.793L6.354 13.146a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l2-2a.5.5 0 00-.708-.708L8.5 14.293V8.5z"/>
                      <path d="M6.646 3.646a.5.5 0 01.708 0L8.5 4.793l1.146-1.147a.5.5 0 01.708.708l-1.5 1.5a.5.5 0 01-.708 0l-1.5-1.5a.5.5 0 010-.708z"/>
                      <path d="M8 1a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 1zM3 7.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5z"/>
                    </svg>
                    <div>
                      <p className="detail-label">Humidity</p>
                      <p className="detail-value">{weatherData.humidity}%</p>
                    </div>
                  </div>

                  <div className="weather-detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M12.5 2A2.5 2.5 0 0010 4.5a.5.5 0 001 0 1.5 1.5 0 113 0c0 .474-.196.953-.667 1.424a4.488 4.488 0 01-.976.69 2.5 2.5 0 00-1.357 2.22V10.5a.5.5 0 001 0V9.165c.095-.04.19-.084.284-.132a5.5 5.5 0 001.216-.865c.653-.67 1-1.518 1-2.418A2.5 2.5 0 0012.5 2z"/>
                      <path d="M8 0a.5.5 0 01.5.5v7a.5.5 0 01-1 0v-7A.5.5 0 018 0zM5.5 7.5a.5.5 0 000 1h5a.5.5 0 000-1h-5zM8 12a4 4 0 110-8 4 4 0 010 8z"/>
                    </svg>
                    <div>
                      <p className="detail-label">Wind Speed</p>
                      <p className="detail-value">{Number(weatherData.windSpeed).toFixed(2)} m/s</p>
                    </div>
                  </div>

                  <div className="weather-detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 3a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 3zm8 8a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5zm-13 0a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5z"/>
                      <path d="M5.5 5.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5v-5z"/>
                    </svg>
                    <div>
                      <p className="detail-label">Condition</p>
                      <p className="detail-value">{weatherData.condition}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Saved Searches */}
        <section className="saved-searches">
          <h2 className="section-title">Recent Searches</h2>
          
          {loadingSearches ? (
            <div className="empty-state">
              <div className="spinner-large"></div>
              <p>Loading searches...</p>
            </div>
          ) : savedSearches.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
              </svg>
              <h3>No saved searches yet</h3>
              <p>Search for a city to see weather information</p>
            </div>
          ) : (
            <div className="searches-grid">
              {savedSearches.map((search) => (
                <div key={search._id} className="search-card">
                  <div className="search-card-content">
                    <div className="search-grid-item city">
                      <h3 className="search-city">{search.label}</h3>
                    </div>
                    
                    <div className="search-grid-item delete">
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSearch(search._id)
                        }}
                        title="Delete search"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="search-grid-item info-box">
                      <span className="info-icon">{getWeatherIcon(search.condition)}</span>
                      <div className="info-content">
                        <p className="info-label">Temperature</p>
                        <p className="info-value">{search.temp}°C</p>
                      </div>
                    </div>
                    
                    <div className="search-grid-item info-box">
                      <svg className="info-icon" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8.5 8.5a.5.5 0 00-1 0v5.793L6.354 13.146a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l2-2a.5.5 0 00-.708-.708L8.5 14.293V8.5z"/>
                        <path d="M6.646 3.646a.5.5 0 01.708 0L8.5 4.793l1.146-1.147a.5.5 0 01.708.708l-1.5 1.5a.5.5 0 01-.708 0l-1.5-1.5a.5.5 0 010-.708z"/>
                      </svg>
                      <div className="info-content">
                        <p className="info-label">Humidity</p>
                        <p className="info-value">{search.humidity}%</p>
                      </div>
                    </div>
                    
                    <div className="search-grid-item info-box">
                      <svg className="info-icon" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.5 2A2.5 2.5 0 0010 4.5a.5.5 0 001 0 1.5 1.5 0 113 0c0 .474-.196.953-.667 1.424a4.488 4.488 0 01-.976.69 2.5 2.5 0 00-1.357 2.22V10.5a.5.5 0 001 0V9.165c.095-.04.19-.084.284-.132a5.5 5.5 0 001.216-.865c.653-.67 1-1.518 1-2.418A2.5 2.5 0 0012.5 2z"/>
                      </svg>
                      <div className="info-content">
                        <p className="info-label">Wind Speed</p>
                        <p className="info-value">{Number(search.windSpeed).toFixed(2)} m/s</p>
                      </div>
                    </div>
                    
                    <div className="search-grid-item date">
                      <p className="search-date">
                        {new Date(search.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
