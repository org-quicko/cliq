# building the frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
COPY frontend/.npmrc ./
RUN npm install --legacy-peer-deps

COPY frontend .
RUN npm run generate
RUN npm run build:core-lib
RUN npm run build -- --project=promoter-portal

# building the backend
FROM node:22-alpine AS backend-build

WORKDIR /app/backend

COPY api/package*.json ./
COPY api/.npmrc ./
RUN npm install

COPY api .
RUN npm run generate
RUN npm run build

# Final image
FROM node:22-slim AS final

WORKDIR /app

# Copy backend code
COPY --from=backend-build /app/backend ./

# Copy frontend build into a public directory
COPY --from=frontend-build /app/frontend/dist/promoter-portal/browser ./public

EXPOSE 3001

# Command to start the NestJS backend and serve Angular frontend
CMD ["node", "dist/src/main.js"]
