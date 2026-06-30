# Stage 1: Build the React (Vite) application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application using a lightweight Node server
# This avoids Nginx port configuration complexities on Railway's free tier
FROM node:18-alpine

WORKDIR /app

# Install 'serve' to run the built static files
RUN npm install -g serve

# Copy the built output from the previous stage
COPY --from=build /app/dist ./dist

# Expose the port (Railway injects the PORT environment variable)
EXPOSE ${PORT:-5173}

# Run the server, binding to Railway's dynamic port and falling back to 5173
# The -s flag rewrites all not-found requests to index.html for React Router
CMD ["sh", "-c", "serve -s dist -l ${PORT:-5173}"]