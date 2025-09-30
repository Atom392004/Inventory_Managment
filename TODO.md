# TODO: Fix Docker Import Issues for Backend

## Completed Tasks
- [x] Analyzed current directory structure and import paths
- [x] Identified that imports use "from app..." expecting app/ directory in PYTHONPATH
- [x] Updated backend/app/Dockerfile to copy code to /src/app instead of /src
- [x] Updated root Dockerfile to copy backend to /src/backend and set WORKDIR to /src/backend

## Pending Tasks
- [ ] Test the Docker build and run to ensure imports work correctly
- [ ] Verify that local development still works (run from backend/ directory)
- [ ] If issues persist, consider adjusting docker-compose.yml volumes or WORKDIR

## Notes
- The docker-compose.yml uses build context ./backend/app, so the updated backend/app/Dockerfile is the primary one used
- Volumes in docker-compose mount ./backend:/src, which provides the app/ directory at /src/app
- PYTHONPATH=/src allows "from app..." imports to resolve correctly
- For local development, ensure running from the backend/ directory: cd backend && uvicorn app.main:app
