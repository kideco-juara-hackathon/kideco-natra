FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Receive the API URL from docker-compose during build time
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Build the Next.js production bundle
RUN npm run build

# Expose port 3000 for Next.js
EXPOSE 3000

# Start the Next.js production server (super fast and low CPU)
CMD ["npm", "start"]
