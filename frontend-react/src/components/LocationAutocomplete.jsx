import { useState, useEffect, useRef } from 'react'
import '../styles/LocationAutocomplete.css'

/**
 * LocationAutocomplete Component
 * Provides autocomplete functionality for location/destination inputs
 * Uses Nominatim (OpenStreetMap) API for suggestions
 */
export default function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = 'e.g., Paris, France',
  name = 'location',
  id,
  required = false,
  className = ''
}) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setLoading(true)
      
      // Using Nominatim API with proper headers
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelBrainApp/1.0'
          }
        }
      )
      
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      
      const data = await response.json()
      
      const formattedSuggestions = data.map(item => ({
        display_name: item.display_name,
        name: item.name || item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
        lat: item.lat,
        lon: item.lon,
        type: item.type,
        address: item.address
      }))
      
      setSuggestions(formattedSuggestions)
      setShowSuggestions(formattedSuggestions.length > 0)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    onChange(e)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300) // 300ms debounce
  }

  const handleSuggestionClick = (suggestion) => {
    // Create synthetic event to match the onChange signature
    const syntheticEvent = {
      target: {
        name: name,
        value: suggestion.display_name
      }
    }
    onChange(syntheticEvent)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className={`location-autocomplete-wrapper ${className}`} ref={wrapperRef}>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        className="location-autocomplete-input"
        autoComplete="off"
      />
      
      {loading && (
        <div className="location-autocomplete-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="location-autocomplete-suggestions">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.lat}-${suggestion.lon}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="location-autocomplete-suggestion-item"
            >
              <svg 
                className="location-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="currentColor"
              >
                <path d="M8 0C5.2 0 3 2.2 3 5c0 3.5 5 11 5 11s5-7.5 5-11c0-2.8-2.2-5-5-5zm0 7.5c-1.4 0-2.5-1.1-2.5-2.5S6.6 2.5 8 2.5s2.5 1.1 2.5 2.5S9.4 7.5 8 7.5z"/>
              </svg>
              <div className="suggestion-content">
                <div className="suggestion-name">{suggestion.name}</div>
                <div className="suggestion-address">{suggestion.display_name}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
