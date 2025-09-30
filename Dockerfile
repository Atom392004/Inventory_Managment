# Simple Dockerfile for FastAPI backend
FROM python:3.11-slim
WORKDIR /src
COPY backend/requirements.txt /src/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend /src/backend
ENV PYTHONPATH=/src
WORKDIR /src/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
