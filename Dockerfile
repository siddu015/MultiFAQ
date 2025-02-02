# Use a minimal Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application files
COPY . .

# Use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Set environment variables (can be overridden in docker-compose)
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://mongo:27017/multifaq
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "src/app.js"]
