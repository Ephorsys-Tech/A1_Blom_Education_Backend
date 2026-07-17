# ==========================================
# Stage 1: Dependency Builder (with build tools)
# ==========================================
FROM node:20-alpine AS builder

# Install build dependencies for compiling native node modules (like bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy packages and install all dependencies
COPY package*.json ./
RUN npm install

# ==========================================
# Stage 2: Final Light & Secure Runner
# ==========================================
FROM node:20-alpine AS runner

# Patch OS-level security vulnerabilities in the alpine base image
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy compiled node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy rest of the application files
COPY . .

# Expose port
EXPOSE 8080

# Start server
CMD ["npm", "start"]
