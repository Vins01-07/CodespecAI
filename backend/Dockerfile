# CodeSpec AI — Backend Dockerfile
# Multi-stage: build (pip install) + runtime (slim)

FROM python:3.12-slim AS base

# System deps for tree-sitter compilation & git
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app/ ./app/

# Create the workspace directory for cloned repos
RUN mkdir -p ./workspace/repos

# Default: run the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
