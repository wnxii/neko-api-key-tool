# Stage 1: Build the React application
FROM node:16 as builder

WORKDIR /app

# Copy package files and install dependencies
# This leverages Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Define build-time arguments
ARG REACT_APP_API_URL

# Assign production env so it can load from host
ENV NODE_ENV=production

# Build the application
RUN npm run build


# Stage 2: Serve the application from a lean image
FROM node:16-alpine

# Install `serve` to serve static files
RUN npm install -g serve

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/build .

# Expose port 3000
EXPOSE 3000

# Command to run the server
# -s flag is important for single-page apps
CMD ["serve", "-s", ".", "-l", "3000"]