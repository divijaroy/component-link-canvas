# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package and lock files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies with bun
RUN npm install -g bun
RUN bun install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN bun run build


# Stage 2: Create the production server
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the server file
COPY server.js .

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD [ "node", "server.js" ] 