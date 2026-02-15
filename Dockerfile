# Use Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Pass API URL at build time so all requests use HTTPS (avoids "Not secure" from mixed content)
ARG VITE_API_URL=https://kranthimahila.org/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
