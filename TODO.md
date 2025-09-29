# Enhance Profile Page TODO

## Backend Changes
- [x] Add UserUpdate and ChangePassword schemas in backend/app/schemas/auth_schemas.py
- [x] Add PUT /auth/me endpoint in backend/app/api/endpoints/auth.py for updating user profile
- [x] Add POST /auth/change-password endpoint in backend/app/api/endpoints/auth.py

## Frontend Changes
- [x] Add auth.update and auth.changePassword methods in frontend/src/api/apiClient.js
- [x] Add dashboard.stats method in frontend/src/api/apiClient.js
- [x] Enhance frontend/src/pages/ProfilePage.jsx:
  - [x] Add user statistics section (total products, warehouses, stock)
  - [x] Add edit profile form (username, email)
  - [x] Add change password form
  - [x] Add logout button

## Testing
- [ ] Test new backend endpoints
- [ ] Test frontend forms and functionality
