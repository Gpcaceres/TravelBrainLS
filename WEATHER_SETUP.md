# API Configuration - Weather & Google Maps

## Overview
TravelBrain uses two APIs to provide weather information and location search:
1. **OpenWeatherMap API** - Weather data (FREE)
2. **Google Maps API** or **OpenStreetMap Nominatim** - Place search & distance calculation (FREE fallback available)

## Option 1: Quick Setup (FREE - No API Keys Required)

The app will work immediately with **OpenStreetMap Nominatim** as a free fallback for:
- Place search in Destinations
- Distance calculation using Haversine formula

Simply deploy and it works! No configuration needed.

## Option 2: Full Features (Recommended - FREE API Keys)

### Step 1: Get OpenWeatherMap API Key (FREE)

1. Go to [https://openweathermap.org/](https://openweathermap.org/)
2. Click **"Sign Up"** or **"Sign In"**
3. Create a free account (no credit card required)
4. Go to **"API keys"** tab in your account
5. Copy your default API key

**Free Tier Limits:**
- ✅ 60 calls/minute
- ✅ 1,000,000 calls/month
- ✅ Current weather data

### Step 2: Get Google Maps API Key (OPTIONAL - Has FREE Tier)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Places API
   - Geocoding API
   - Distance Matrix API
4. Go to **"Credentials"** → **"Create Credentials"** → **"API Key"**
5. Copy your API key
6. **IMPORTANT:** Restrict your key:
   - Go to key settings
   - Add HTTP referrers: `http://35.239.79.6:5173/*`
   - Select APIs: Places API, Geocoding API, Distance Matrix API

**Free Tier Limits:**
- ✅ $200 free credit per month
- ✅ Covers ~28,000 place searches/month
- ✅ No credit card required for basic use

### Step 3: Configure API Keys

**Create `.env` file in `frontend-react` directory:**

```bash
cd ~/TravelBrain/frontend-react
cp .env.example .env
nano .env
```

**Add your keys:**
```env
# OpenWeatherMap API
VITE_WEATHER_API_KEY=your_openweathermap_key_here

# Google Maps API (optional - fallback to OpenStreetMap if not set)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### Step 4: Rebuild and Deploy

```bash
cd ~/TravelBrain
git pull
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

## Features by Configuration

| Feature | Without API Keys | With OpenWeather | With OpenWeather + Google Maps |
|---------|-----------------|------------------|-------------------------------|
| Weather Search | ❌ | ✅ | ✅ |
| Place Search | ✅ (OpenStreetMap) | ✅ (OpenStreetMap) | ✅ (Google Maps) |
| Distance Calculation | ✅ (Haversine) | ✅ (Haversine) | ✅ (Google Distance Matrix) |
| Autocomplete | ❌ | ❌ | ✅ |
| Travel Time | ✅ (estimated) | ✅ (estimated) | ✅ (real data) |

## Testing

### Weather Feature
1. Go to `/weather`
2. Search: "London", "Tokyo", "Paris"
3. View temperature, humidity, wind speed

### Destinations Feature
1. Go to `/destinations`
2. Click "Add Destination"
3. Search places: "Eiffel Tower", "Tokyo Tower"
4. Select from results - auto-fills coordinates
5. Save destination

### Distance Calculator
1. Add at least 2 destinations
2. Scroll to "Calculate Distance" section
3. Select Origin and Destination
4. Click "Calculate Distance"
5. View distance in km and travel time

## Troubleshooting

**Weather: "City not found"**
- Check city name spelling
- Try adding country: "London,UK"
- Wait 10-15 min if API key is new

**Places: Search doesn't work**
- App falls back to OpenStreetMap automatically
- Works without Google Maps API key
- Check console for errors

**Distance: Shows "estimated"**
- Normal without Google Maps API
- Uses Haversine formula (accurate for straight-line distance)
- Add Google Maps API for road distance

**API Key not working**
- Check `.env` file exists in `frontend-react/`
- Keys must start with `VITE_`
- Rebuild after adding keys
- Check browser console for errors

## Cost Estimates (if using paid tiers)

**OpenWeatherMap:**
- Free tier covers normal use
- $40/month for 100,000 calls (unlikely to need)

**Google Maps:**
- $200/month free credit
- Places API: $17 per 1,000 requests
- Distance Matrix: $5 per 1,000 elements
- Most apps stay within free tier

## Security Notes

- Never commit `.env` file to Git (already in `.gitignore`)
- Restrict Google API keys to your domain
- Monitor usage in respective dashboards
- Set up billing alerts in Google Cloud
