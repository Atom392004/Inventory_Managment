# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements.txt from the app directory
COPY app/requirements.txt ./ 
RUN pip install --no-cache-dir -r requirements.txt

# Copy all app code into the container
COPY app /app

ENV PYTHONPATH=/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]
