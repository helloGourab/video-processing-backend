FROM node:18-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /usr/src/app

# Install deps
COPY package*.json ./
RUN npm install --production

# Copy code
COPY . .

# Expose nothing (this is a worker, not a web server)
CMD ["node", "processor.js"]
