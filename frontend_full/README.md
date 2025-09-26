
# Inventory Frontend (Vite + React + Tailwind)

This is a ready-to-run frontend for the inventory backend.

Setup:
1. Unzip the folder.
2. Install dependencies: `npm install`
3. Configure API base (optional): create `.env` with `REACT_APP_API_BASE=http://localhost:8000`
4. Start: `npm run dev` (runs on port 5173)

Notes:
- The app expects backend endpoints:
  - POST /auth/login  (body: { username, password }) -> returns a token as `access_token` or `token`
  - GET /products, POST /products, GET/PUT/DELETE /products/:id
  - GET /warehouses, POST /warehouses, GET/PUT/DELETE /warehouses/:id
  - GET /stock_movements, POST /stock_movements
- If your API uses prefixes (e.g. /api/v1), set `REACT_APP_API_BASE` accordingly.

If anything fails, check browser devtools for network errors and adjust `REACT_APP_API_BASE`.
