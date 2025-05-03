# Build stage for frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/restaurant/package*.json ./
RUN npm ci
COPY frontend/restaurant/ ./
RUN npm run build

# Build stage for backend
FROM python:3.10-slim as backend-builder
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./

# Final production image
FROM python:3.10-slim
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/next.config.js ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Copy backend
COPY --from=backend-builder /app/backend ./
COPY --from=backend-builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages

# Install production dependencies
RUN apt-get update && apt-get install -y \
    wait-for-it \
    && rm -rf /var/lib/apt/lists/*

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV NEXT_TELEMETRY_DISABLED=1

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Startup command
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]