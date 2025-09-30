# TODO: Web Scraping & Data Integration

## Backend
- [ ] Add ScrapedProduct model to backend/app/models.py
- [ ] Create backend/app/schemas/scraped_product_schemas.py
- [ ] Create backend/app/api/endpoints/scraped_products.py
- [ ] Update backend/app/main.py to include scraped_products router
- [ ] Create Alembic migration for scraped_products table
- [ ] Update backend/requirements.txt with requests and beautifulsoup4

## Frontend
- [ ] Create frontend/react_app/src/pages/ScrapedProducts.jsx
- [ ] Update frontend/react_app/src/App.jsx to add route
- [ ] Update frontend/react_app/src/components/Layout.jsx to add nav link

## Followup
- [ ] Run Alembic migration
- [ ] Test scraping endpoint (POST /scrape-books)
- [ ] Test GET /scraped-products
- [ ] Test frontend display
