# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /build
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim AS runtime

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH=/home/appuser/.local/bin:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root system user and group
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

# Copy installed packages from builder stage
COPY --from=builder /root/.local /home/appuser/.local
RUN chown -R appuser:appgroup /home/appuser

# Copy application source code
COPY --chown=appuser:appgroup . .

USER appuser
EXPOSE 8000

# Healthcheck checking the live API probe endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

# Start FastAPI application in production mode
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
