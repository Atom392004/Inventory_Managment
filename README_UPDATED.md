# Inventory Management - Complete Project (Updated)

This repository has been updated to include a full React frontend, admin functionality, docker support, and helpful repo files.
Paths of interest:
- Backend: `backend/app`
- React frontend: `frontend_full/react_app` (Vite)
- Existing static frontend (if any): `frontend_full/public`
- Docker compose: `docker-compose.yml`
- Environment example: `.env.example`

## Quickstart (Docker, recommended)
1. Copy `.env.example` to `.env` and adjust values if needed.
2. Build and run everything:
```bash
docker compose up --build
```
- Backend API will be available at `http://localhost:8000`
- React frontend (production) will be available at `http://localhost:5173` (served by nginx)

## Local development (backend)
```bash
# from repo root
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/im_db
export API_SECRET_KEY=dev-secret-key
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Local development (frontend)
```
cd frontend_full/react_app
npm install
npm run dev
```
- Dev server runs on port 5173 and proxies API requests to `http://localhost:8000`.

## Notes
- The admin role exists in the DB (`is_admin` on `User` model). The admin console is available at `/admin` in the React app.
- Alembic migrations are already present under `backend/alembic`. Docker entrypoint runs `alembic upgrade head` before starting the server.
- Update `API_SECRET_KEY` for production usage.