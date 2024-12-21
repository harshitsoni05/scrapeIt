# Use a Node.js base image for building
FROM node:20 as build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy app source code and build
COPY . .
RUN npm run build

# Expose the default Nginx port
EXPOSE 3000

# Command to start Nginx
CMD ["npm", "start"]
