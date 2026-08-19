# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend and Static Asset Hosting
FROM python:3.10-slim

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy built frontend static files from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Render's default port
EXPOSE 10000

# Start FastAPI application using uvicorn on Render's default port
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "10000"]
