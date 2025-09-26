# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /src

# Copy requirements.txt from the build context root
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all app code into the container
COPY . /src

ENV PYTHONPATH=/src

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
