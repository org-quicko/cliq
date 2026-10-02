# syntax=docker/dockerfile:1

# building the frontend
FROM node:22 AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY frontend .
RUN npm run build:org-quicko-cliq-ngx-core \
 && npm run build -- --project=promoter-portal \
 && npm run build -- --project=admin-portal

# building the backend
FROM node:22 AS backend-build

WORKDIR /app/backend

COPY api/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY api .
RUN npm run build \
 && npm prune --omit=dev

# Final image
FROM node:22-slim AS final

ENV NODE_ENV=production
WORKDIR /app

# Backend runtime: compiled output + production-only dependencies
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/scripts ./scripts

# Both frontend builds into separate directories
COPY --from=frontend-build /app/frontend/dist/promoter-portal/browser ./public/promoter
COPY --from=frontend-build /app/frontend/dist/admin-portal/browser ./public/admin

RUN chmod +x /app/scripts/db-migrate.sh
EXPOSE 3001

# Command to start the NestJS backend and serve Angular frontend
ENTRYPOINT [ "/app/scripts/db-migrate.sh" ]
CMD ["node", "dist/src/main.js"]