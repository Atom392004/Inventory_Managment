# Inventory Management Application

This project is a full-stack inventory management system with role-based authentication and authorization. It supports three user roles: Admin, Warehouse Owner, and Normal User. Each role has different access levels and permissions.

## Quick Start Guide

### Option 1: Running with Docker (Recommended)

1. Install Prerequisites:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows/Mac
   - [Docker Engine](https://docs.docker.com/engine/install/) for Linux

2. Clone the repository:
   ```bash
   git clone https://github.com/Atom392004/Inventory_Managment.git
   cd Inventory_Managment
   ```

3. Create `.env` file in the root directory:
   ```bash
   # Copy the example .env file
   cp .env.example .env
   # Edit the .env file with your preferred text editor
   # Make sure to change the passwords!
   ```

4. Start the application:
   ```bash
   docker-compose up --build
   ```

5. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3002
   - API Documentation: http://localhost:3002/docs

### Option 2: Running Locally (Development)

1. Install Prerequisites:
   - Python 3.11 or higher
   - Node.js 18 or higher
   - PostgreSQL 15

2. Set up the backend:
   ```bash
   # Navigate to backend directory
   cd backend

   # Create and activate virtual environment
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/Mac:
   source venv/bin/activate

   # Install dependencies
   pip install -r app/requirements.txt

   # Set up environment variables
   copy .env.example .env
   # Edit .env with your database credentials

   # Run migrations
   alembic upgrade head

   # Start the backend server
   cd app
   uvicorn main:app --reload --port 3002
   ```

3. Set up the frontend:
   ```bash
   # In a new terminal, navigate to frontend directory
   cd frontend

   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002

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

## Getting Started with Docker

### Prerequisites

- Docker Desktop installed on your machine (Windows/Mac) or Docker Engine (Linux)
- Docker Compose installed
- Git installed

### Docker Setup Instructions

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

2. Create a `.env` file in the root directory with the following content (modify the values as needed):

```env
POSTGRES_DB=inv_man
POSTGRES_USER=inv_user
POSTGRES_PASSWORD=your_strong_password_here
DATABASE_URL=postgresql://inv_user:your_strong_password_here@db:5432/inv_man
API_SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpass
ADMIN_EMAIL=admin@example.com
ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
```

3. Build and start the application using Docker Compose:

```bash
# First time build
docker-compose up --build

# Subsequent runs
docker-compose up
```

4. The services will be available at:
   - Frontend: `http://localhost:80`
   - Backend API: `http://localhost:3002`
   - PostgreSQL Database: `localhost:5432`

### Accessing PostgreSQL Database

To view and manage the database data, you can use tools like:

1. **pgAdmin 4**:
   - Install pgAdmin 4 from [https://www.pgadmin.org/](https://www.pgadmin.org/)
   - Connect using these details:
     - Host: localhost
     - Port: 5432
     - Database: inv_man
     - Username: inv_user
     - Password: (the one you set in .env file)

2. **DBeaver**:
   - Install DBeaver from [https://dbeaver.io/](https://dbeaver.io/)
   - Create a new PostgreSQL connection with the same details as above

3. **Using Docker CLI**:
   ```bash
   # Connect to PostgreSQL container
   docker-compose exec db psql -U inv_user -d inv_man
   ```

### Managing Docker Containers

```bash
# View running containers
docker-compose ps

# View container logs
docker-compose logs -f

# Stop containers
docker-compose down

# Stop containers and remove volumes (will delete database data)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend
```

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

```
inventory_management/
├── .env                     # Environment variables
├── docker-compose.yml       # Docker services configuration
├── backend/
│   ├── alembic/            # Database migrations
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── auth/           # Authentication logic
│   │   ├── crud/           # Database operations
│   │   ├── models.py       # Database models
│   │   ├── main.py        # Application entry point
│   │   └── requirements.txt
│   ├── Dockerfile          # Backend container configuration
│   └── alembic.ini         # Alembic configuration
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   └── main.jsx       # Frontend entry point
│   ├── Dockerfile         # Frontend container configuration
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation

## Database Management

### Viewing Database Data

1. Using pgAdmin 4:
   - Download and install [pgAdmin 4](https://www.pgadmin.org/download/)
   - Add New Server:
     - Host: localhost
     - Port: 5432
     - Database: inventory_db (or value from POSTGRES_DB)
     - Username: inventory_user (or value from POSTGRES_USER)
     - Password: (value from POSTGRES_PASSWORD)

2. Using DBeaver:
   - Download and install [DBeaver](https://dbeaver.io/download/)
   - Create new connection:
     - Choose PostgreSQL
     - Fill in the same details as above

### Database Migrations

```bash
# When running with Docker
docker-compose exec backend alembic upgrade head

# When running locally
cd backend
alembic upgrade head
```

## Troubleshooting

### Docker Issues

1. Port conflicts:
   ```bash
   # Error: port is already allocated
   # Solution: Stop the conflicting service or change ports in docker-compose.yml
   netstat -ano | findstr "3002"  # Windows
   lsof -i :3002                  # Linux/Mac
   ```

2. Database connection issues:
   - Check if the database container is running:
     ```bash
     docker-compose ps
     ```
   - Verify environment variables in .env file
   - Check database logs:
     ```bash
     docker-compose logs db
     ```

3. Container build fails:
   ```bash
   # Remove all containers and volumes
   docker-compose down -v
   # Rebuild from scratch
   docker-compose up --build
   ```

### Local Development Issues

1. Backend server won't start:
   - Check if PostgreSQL is running
   - Verify database credentials in .env
   - Ensure all dependencies are installed:
     ```bash
     pip install -r requirements.txt
     ```

2. Frontend development server issues:
   - Clear node_modules and reinstall:
     ```bash
     rm -rf node_modules
     npm install
     ```
   - Check for conflicting port usage

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





