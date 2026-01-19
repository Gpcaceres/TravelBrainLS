# TravelBrain Backend API

Backend API for TravelBrain - A personalized travel itinerary generator with weather, budget, and distance integration.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Environment Variables](#environment-variables)

## ✨ Features

- **User Authentication**: Google OAuth integration
- **User Management**: CRUD operations for users
- **Destinations**: Manage travel destinations
- **Trips**: Plan and manage trips
- **Favorite Routes**: Save favorite travel routes
- **Weather**: Store and retrieve weather searches
- **Caching**: Built-in caching for improved performance
- **CORS**: Configured for frontend integration
- **Error Handling**: Centralized error handling
- **Request Logging**: Comprehensive request logging

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: Google OAuth 2.0
- **Caching**: node-cache
- **Others**: 
  - dotenv (environment variables)
  - jsonwebtoken (JWT)
  - cors (Cross-Origin Resource Sharing)

## 📁 Project Structure

```
backend-project/
├── src/
│   ├── config/
│   │   ├── database.js       # Database connection
│   │   └── env.js            # Environment configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── destinationController.js
│   │   ├── tripController.js
│   │   ├── favoriteRouteController.js
│   │   └── weatherController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Destination.js
│   │   ├── Trip.js
│   │   ├── FavoriteRoute.js
│   │   ├── Weather.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── destinationRoutes.js
│   │   ├── tripRoutes.js
│   │   ├── favoriteRouteRoutes.js
│   │   ├── weatherRoutes.js
│   │   └── index.js
│   ├── middlewares/
│   │   ├── cache.js
│   │   ├── cors.js
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── index.js
│   ├── utils/
│   │   ├── cache.js
│   │   ├── responseFormatter.js
│   │   ├── dateHelpers.js
│   │   ├── validators.js
│   │   └── index.js
│   ├── app.js                # Express app configuration
│   └── server.js             # Server entry point
├── .env.example              # Example environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Installation

1. **Clone the repository**
   ```bash
   cd 4. ProjectCode/backend-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   copy .env.example .env
   ```
   _Note: On Windows use `copy`, on Linux/Mac use `cp`_

4. **Configure environment variables** (see [Configuration](#configuration))

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3004
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB=travel_brain

# API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
MAPBOX_TOKEN=your_mapbox_token

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Timezone
APP_TIMEZONE=America/Guayaquil

# CORS
CORS_ORIGINS=http://localhost:8000,http://localhost:3004
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3004` (or the port specified in `.env`)

## 📡 API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Authentication
- **POST** `/api/auth/google-login` - Google OAuth login
- **GET** `/api/auth/verify` - Verify JWT token

### Users
- **GET** `/users` - Get all users (cached 5 min)
- **GET** `/users/:id` - Get user by ID (cached 5 min)
- **POST** `/users` - Create new user
- **PUT** `/users/:id` - Update user
- **DELETE** `/users/:id` - Delete user

### Destinations
- **GET** `/destinations` - Get all destinations
- **GET** `/destinations/:id` - Get destination by ID
- **POST** `/destinations` - Create new destination
- **PUT** `/destinations/:id` - Update destination
- **DELETE** `/destinations/:id` - Delete destination

### Trips
- **GET** `/trips` - Get all trips
- **GET** `/trips/:id` - Get trip by ID
- **POST** `/trips` - Create new trip
- **PUT** `/trips/:id` - Update trip
- **DELETE** `/trips/:id` - Delete trip

### Favorite Routes
- **GET** `/favorite-routes` - Get all favorite routes
- **GET** `/favorite-routes/:id` - Get favorite route by ID
- **POST** `/favorite-routes` - Create new favorite route
- **PUT** `/favorite-routes/:id` - Update favorite route
- **DELETE** `/favorite-routes/:id` - Delete favorite route

### Weather
- **GET** `/weathers` - Get all weather searches (cached 10 min)
- **GET** `/weathers/:id` - Get weather by ID (cached 10 min)
- **POST** `/weather` - Create new weather search
- **PUT** `/weathers/:id` - Update weather
- **DELETE** `/weathers/:id` - Delete weather

## 🗄️ Database Models

### User
```javascript
{
  username: String,
  email: String (required, unique),
  passwordHash: String,
  name: String,
  role: String (ADMIN|REGISTERED|USER),
  status: String (ACTIVE|INACTIVE),
  tz: String,
  googleId: String (unique),
  picture: String,
  createdAt: Date
}
```

### Destination
```javascript
{
  name: String (required),
  country: String (required),
  description: String,
  lat: Number (required),
  lng: Number (required),
  img: String,
  userId: String,
  createdAt: Date
}
```

### Trip
```javascript
{
  userId: Number (required),
  title: String (required),
  destination: String (required),
  startDate: Date (required),
  endDate: Date (required),
  budget: Number,
  description: String,
  createdAt: Date
}
```

### FavoriteRoute
```javascript
{
  userId: String (required),
  name: String (required),
  origin: {
    lat: Number,
    lon: Number,
    label: String
  },
  destination: {
    lat: Number,
    lon: Number,
    label: String
  },
  distanceKm: Number,
  durationSec: Number,
  mode: String (driving|walking|cycling|transit),
  createdAt: Date
}
```

### Weather
```javascript
{
  userId: ObjectId,
  label: String,
  lat: Number (required),
  lon: Number (required),
  temp: Number (required),
  condition: String,
  humidity: Number,
  windSpeed: Number,
  pressure: Number,
  precipitation: Number,
  createdAt: Date
}
```

## 🔑 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3004 |
| `NODE_ENV` | Environment | No | development |
| `MONGO_URI` | MongoDB connection URI | Yes | - |
| `MONGO_DB` | Database name | Yes | travel_brain |
| `OPENWEATHER_API_KEY` | OpenWeather API key | No | - |
| `MAPBOX_TOKEN` | Mapbox access token | No | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | - |
| `JWT_SECRET` | JWT secret key | No | development-secret |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 7d |
| `APP_TIMEZONE` | Application timezone | No | America/Guayaquil |
| `CORS_ORIGINS` | Allowed CORS origins | No | localhost |

## 📝 Notes

- Cache is implemented for GET requests on users and weather endpoints
- The same MongoDB database is used as Project_Functional_Prototype
- CORS is configured to allow requests from specified origins
- Graceful shutdown is implemented for SIGTERM and SIGINT signals
- Request logging includes method, URL, status, duration, and IP

## 🤝 Contributing

This is part of the ESPE-AWD27819-ODII project. For contributions, please follow the project guidelines.

## 📄 License

ISC License - See LICENSE file for details
