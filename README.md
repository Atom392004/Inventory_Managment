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

## Tech Stack

- **Backend**: FastAPI (Python web framework), SQLAlchemy (ORM), PostgreSQL (database), Pydantic (data validation)
- **Frontend**: React (JavaScript library), Vite (build tool), Tailwind CSS (styling), Axios (HTTP client)
- **Authentication**: JWT tokens, role-based access control
- **Deployment**: Docker, Docker Compose
- **Testing**: Pytest (backend unit tests)

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

4. The backend API will be available at `http://localhost:3002`.
5. The frontend UI will be available at `http://localhost:3001`.

## Running Tests

To run the backend test suite, execute the following command from the project root:

```bash
pytest backend/tests
```

## Design Choices

### Why FastAPI over Flask?

FastAPI was chosen over Flask for this project due to its modern, high-performance capabilities and built-in features that align well with building robust APIs:

- **Automatic API Documentation**: FastAPI generates interactive Swagger UI and ReDoc documentation automatically from the code, reducing manual documentation efforts.
- **Type Safety and Validation**: Leveraging Pydantic models for request/response validation ensures data integrity and provides clear error messages.
- **Asynchronous Support**: Native support for async/await allows for better handling of concurrent requests, improving scalability.
- **Performance**: Built on Starlette and Pydantic, FastAPI offers excellent performance comparable to Node.js and Go frameworks.
- **Dependency Injection**: Built-in dependency injection system simplifies code organization and testing.

### Architectural Patterns

- **RESTful API Design**: The backend follows REST principles with clear resource endpoints (e.g., `/products`, `/warehouses`) and standard HTTP methods.
- **Role-Based Access Control (RBAC)**: Implemented using JWT tokens and dependency injection to enforce permissions based on user roles (Admin, Warehouse Owner, Normal User).
- **Layered Architecture**: Separation of concerns with distinct layers for API endpoints, business logic (CRUD operations), data models, and schemas.
- **Dependency Injection**: Used throughout the FastAPI app for authentication, database sessions, and role checks to promote modularity and testability.
- **Database ORM**: SQLAlchemy provides an abstraction layer over PostgreSQL, enabling efficient querying and migrations.
- **Frontend State Management**: React with context API for authentication state, keeping the UI responsive and synchronized.

## API Documentation

The backend API is built with FastAPI and provides automatic interactive API documentation:

- **Swagger UI**: Visit `http://localhost:3002/docs` for the interactive API documentation.
- **ReDoc**: Visit `http://localhost:3002/redoc` for an alternative API documentation view.

The documentation includes all available endpoints, request/response schemas, and allows testing endpoints directly from the browser.

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

## Scalability Discussion

To scale this inventory management application for a larger audience, several strategies can be implemented:

### Database Optimization and Sharding
- Use database sharding to distribute data across multiple database instances based on user ID or product owner.
- Implement read replicas for read-heavy operations like product listings.
- Optimize queries with proper indexing on frequently queried fields (e.g., owner_id, created_at).

### Caching Layer
- Introduce Redis for caching frequently accessed data, such as product lists and user sessions.
- Cache API responses for pagination results to reduce database load.
- Cache scraped product data to reduce scraping frequency and improve response times.

### Microservices Architecture
- Break down the monolithic backend into microservices (e.g., auth service, product service, stock movement service).
- Use asynchronous communication with message queues like RabbitMQ for stock movements.
- Consider a separate microservice for scraped products to handle scraping and storage asynchronously.

### Load Balancing and Horizontal Scaling
- Deploy multiple instances of the application behind a load balancer (e.g., NGINX or AWS ALB).
- Use container orchestration with Kubernetes for auto-scaling based on CPU/memory usage.

### CDN for Static Assets
- Serve frontend assets via a CDN to reduce latency for global users.

### Additional Strategies
- Implement asynchronous scraping jobs to avoid blocking API requests.
- Use caching and rate limiting to manage scraping frequency.
- Store scraped data in a separate database or schema to isolate load.
- Paginate and index scraped product queries for efficient retrieval.
- Optimize queries for user-warehouse relationships with proper indexing.
- Use batch processing for bulk assignments or removals.
- Cache frequent assignment lookups to reduce database hits.
- Monitor and limit assignment operations to prevent abuse.

These strategies would help handle increased traffic, improve performance, and ensure high availability.

## Contributing

Feel free to open issues or submit pull requests for improvements.





