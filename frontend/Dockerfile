# Step 1: Build Angular promoter-portal
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./
RUN npm run clean
RUN npm install --legacy-peer-deps

COPY . .

# Optional if you're using codegen or a library
RUN npm run generate

# Build only promoter-portal
RUN npm run build -- --project=promoter-portal

# Step 2: Serve using Nginx
FROM nginx:alpine

# Copy only the built promoter-portal to Nginx
COPY --from=build /app/dist/promoter-portal/browser /usr/share/nginx/html

# Replace default Nginx config with custom one
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
