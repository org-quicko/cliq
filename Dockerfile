# building the frontend
FROM node:22 AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend .
RUN npm run build:org-quicko-cliq-ngx-core
RUN npm run build -- --project=promoter-portal

# building the backend
FROM node:22 AS backend-build

WORKDIR /app/backend

COPY api/package*.json ./
RUN npm install

COPY api .
RUN npm run build

# Final image
FROM node:22-slim AS final

WORKDIR /app

# Copy backend code
COPY --from=backend-build /app/backend ./

# Copy frontend build into a public directory
COPY --from=frontend-build /app/frontend/dist/promoter-portal/browser ./public
RUN chmod +x /app/scripts/db-migrate.sh
EXPOSE 3001

# Command to start the NestJS backend and serve Angular frontend
ENTRYPOINT [ "/app/scripts/db-migrate.sh" ]
CMD ["node", "dist/src/main.js"]
