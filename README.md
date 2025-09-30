# Inventory Management Application

This project is a full-stack inventory management system with role-based authentication and authorization. It supports three user roles: Admin, Warehouse Owner, and Normal User. Each role has different access levels and permissions.

## Features

- User authentication and role-based access control
- Manage products, warehouses, and stock movements
- Dashboard with inventory overview and analytics
- Stock transfer between warehouses
- User profile management with password change
- Responsive web UI built with React and Tailwind CSS
- REST API backend built with FastAPI and SQLAlchemy
- Dockerized for easy deployment

## User Roles

- **Admin**: Full access to all resources and management capabilities.
- **Warehouse Owner**: Manage products and stock movements for their owned warehouses.
- **Normal User**: View all warehouses and manage stock movements related to their assigned warehouses or location.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git installed

### Setup Instructions

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

2. Copy the example environment files and customize if needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Build and start the application using Docker Compose:

```bash
docker-compose up --build
```

4. The backend API will be available at `http://localhost:8000`.
5. The frontend UI will be available at `http://localhost:3000`.

### Running Locally without Docker

1. Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

- `backend/`: FastAPI backend source code and database migrations
- `frontend/`: React frontend source code
- `docker-compose.yml`: Docker Compose configuration for backend and frontend
- `README.md`: Project documentation

## Important Scripts

- `start.sh`: Script to start the application (Linux/macOS)
- `Dockerfile`: Dockerfile for backend and frontend services

## Contributing

Feel free to open issues or submit pull requests for improvements.

## License

This project is licensed under the MIT License.
