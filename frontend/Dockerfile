FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose port 3000 for Next.js
EXPOSE 3000

# Start the Next.js development server
CMD ["npm", "run", "dev"]
