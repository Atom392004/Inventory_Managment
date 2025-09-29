# Inventory Management System with Auth

## Run Locally
```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Run with Docker
```bash
docker-compose up --build
```

The system will be available at:
- API: http://localhost:8000
- Frontend: http://localhost:5173

## API Documentation
The API is automatically documented using FastAPI's OpenAPI/Swagger UI at: http://localhost:8000/docs

## Testing
Backend unit and integration tests are located in `backend/tests/`. To run them:

```bash
cd backend
pytest
```

This uses Pytest to test:
- Unit tests: Password validation logic.
- Integration tests: Auth endpoints (registration, login, uniqueness), products CRUD with pagination/filters, warehouses CRUD, stock movements recording, and dashboard metrics.

## Scalability
For strategies to scale the application for larger audiences (database optimization, caching, microservices, etc.), see `backend/scalability/scalability_discussion.md`.

