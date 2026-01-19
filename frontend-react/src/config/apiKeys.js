// API Configuration
export const API_KEYS = {
  // WeatherAPI.com - Get your FREE key at: https://www.weatherapi.com/signup.aspx
  // Free plan: 1,000,000 calls/month
  WEATHER: import.meta.env.VITE_WEATHER_API_KEY || 'a0bddd68132a4227b3b10907261401',
  
  // Google Maps API - Get your key at: https://console.cloud.google.com/
  GOOGLE_MAPS: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'demo_key'
}

export const API_ENDPOINTS = {
  WEATHER: 'https://api.weatherapi.com/v1',
  GOOGLE_PLACES: 'https://maps.googleapis.com/maps/api/place',
  GOOGLE_GEOCODE: 'https://maps.googleapis.com/maps/api/geocode',
  GOOGLE_DISTANCE: 'https://maps.googleapis.com/maps/api/distancematrix'
}
