# Backend Dockerfile
FROM node:18-alpine

# Install dependencies needed for bcrypt compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3004

# Start the application
CMD ["npm", "start"]
