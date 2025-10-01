FROM python:3.11-slim

WORKDIR /src

COPY app/requirements.txt /src/requirements.txt
RUN pip install --no-cache-dir -r /src/requirements.txt

COPY app /src/app

ENV PYTHONPATH=/src

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
