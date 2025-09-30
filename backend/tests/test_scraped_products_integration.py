import pytest
from unittest.mock import patch

def test_scrape_books(auth_client, db):
    # Mock the scraping function to avoid real network calls
    with patch('app.api.endpoints.scraped_products.scrape_books_toscrape') as mock_scrape:
        mock_scrape.return_value = [
            {
                'name': 'Test Book',
                'description': '',
                'category': 'Books',
                'price': 10.0,
                'rating': 4,
                'image_url': 'http://example.com/image.jpg',
                'availability': 'In stock'
            }
        ]
        response = auth_client.post("/scraped-products/scrape-books")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "1 products" in data["message"]

def test_get_scraped_products(auth_client, db):
    # First, add a scraped product manually
    from app import models
    prod = models.ScrapedProduct(
        name='Test Product',
        description='',
        category='Books',
        price=10.0,
        rating=4,
        image_url='http://example.com/image.jpg',
        availability='In stock'
    )
    db.add(prod)
    db.commit()
    response = auth_client.get("/scraped-products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test Product"
