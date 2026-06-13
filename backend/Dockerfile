FROM node:18-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the typescript code
RUN npm run build

# Expose API port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
