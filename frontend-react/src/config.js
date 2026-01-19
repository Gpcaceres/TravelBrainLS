export const API_CONFIG = {
  BASE_URL: 'http://35.239.79.6:3004',
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    
    // Users
    USERS: '/users',
    USER_BY_ID: (id) => `/users/${id}`,
    
    // Destinations
    DESTINATIONS: '/destinations',
    DESTINATION_BY_ID: (id) => `/destinations/${id}`,
    
    // Trips
    TRIPS: '/trips',
    TRIP_BY_ID: (id) => `/trips/${id}`,
    
    // Favorite Routes
    FAVORITE_ROUTES: '/favorite-routes',
    FAVORITE_ROUTE_BY_ID: (id) => `/favorite-routes/${id}`,
    
    // Weather
    WEATHERS: '/weathers',
    WEATHER_BY_ID: (id) => `/weathers/${id}`,
    WEATHER_SEARCH: '/weather'
  }
}

export const STORAGE_KEYS = {
  TOKEN: 'travelbrain_token',
  USER: 'travelbrain_user'
}

