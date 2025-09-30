from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import requests
from bs4 import BeautifulSoup
import re
import time

from app import models, schemas
from app.database import get_db
from app.recommendation import get_recommendations

router = APIRouter()

def scrape_books_toscrape():
    base_url = "https://books.toscrape.com"
    products = []
    page = 1
    while True:
        url = f"{base_url}/catalogue/page-{page}.html" if page > 1 else f"{base_url}/index.html"
        response = requests.get(url)
        if response.status_code != 200:
            break
        soup = BeautifulSoup(response.content, 'html.parser')
        books = soup.find_all('article', class_='product_pod')
        if not books:
            break
        for book in books:
            title = book.h3.a['title']
            price_text = book.find('p', class_='price_color').text
            price = float(re.sub(r'[^\d.]', '', price_text))
            rating_class = book.p['class'][1]  # e.g., 'One', 'Two', etc.
            rating_map = {'One': 1, 'Two': 2, 'Three': 3, 'Four': 4, 'Five': 5}
            rating = rating_map.get(rating_class, 0)
            image_url = base_url + '/' + book.img['src'].lstrip('/')
            availability = book.find('p', class_='instock availability').text.strip()
            # Get category from parent page or assume, but for simplicity, scrape category if available
            category = "Books"  # Placeholder, as category is on index
            description = ""  # Not on list page, would need to scrape individual pages
            products.append({
                'name': title,
                'description': description,
                'category': category,
                'price': price,
                'rating': rating,
                'image_url': image_url,
                'availability': availability
            })
        page += 1
        time.sleep(1)  # Respectful scraping
    return products

@router.post("/scrape-books", status_code=200)
def scrape_and_store_books(db: Session = Depends(get_db)):
    try:
        products = scrape_books_toscrape()
        for prod in products:
            # Avoid duplicates by name
            existing = db.query(models.ScrapedProduct).filter(models.ScrapedProduct.name == prod['name']).first()
            if not existing:
                db_prod = models.ScrapedProduct(**prod)
                db.add(db_prod)
        db.commit()
        return {"message": f"Scraped and stored {len(products)} products"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[schemas.ScrapedProductInDB])
def get_scraped_products(db: Session = Depends(get_db)):
    products = db.query(models.ScrapedProduct).all()
    return products

@router.get("/recommendations/{product_id}", response_model=schemas.RecommendationResponse)
def recommend_products(product_id: int, db: Session = Depends(get_db)):
    recommendations = get_recommendations(product_id, db)
    if not recommendations:
        raise HTTPException(status_code=404, detail="Product not found or no recommendations available")
    return {"recommendations": recommendations}
