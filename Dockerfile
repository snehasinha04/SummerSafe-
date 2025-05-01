# Use Node.js 18 as base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy only package files (for better Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the project files
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start the app (which imports and connects to DB inside app.js)
CMD ["node", "src/app.js"]
