import React, { useEffect, useState } from "react";
import { scrapedProducts } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";
import { Card } from "../components/ui/Card.tsx";
import { Button } from "../components/ui/Button.tsx";

export default function ScrapedProductsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    load();
  }, [token]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await scrapedProducts.list(token);
      setItems(Array.isArray(response) ? response : []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || "Failed to load scraped products");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function scrapeProducts() {
    setScraping(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/scraped-products/scrape-books', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to scrape products');
      }
      const result = await response.json();
      alert(`Scraped and stored ${result.message.match(/\d+/)[0]} products`);
      load(); // Reload the list
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to scrape products");
    } finally {
      setScraping(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Scraped Products</h1>
          <p className="text-gray-600 mt-2">View products scraped from external sources</p>
        </div>
        <Button
          onClick={scrapeProducts}
          variant="primary"
          isLoading={scraping}
        >
          {scraping ? 'Scraping...' : 'Scrape Products'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Loading scraped products...</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.length > 0 ? (
            items.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-48 w-full object-cover rounded-t-md"
                />
                <Card.Body className="flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
                  <p className="text-sm text-gray-600 flex-grow">{product.description || 'No description available'}</p>
                  <p className="text-sm text-gray-500 mt-2">Category: {product.category || '-'}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">${product.price?.toFixed(2)}</p>
                  <p className="text-sm text-yellow-500 mt-1">Rating: {product.rating || '-'}</p>
                  <p className="text-sm text-green-600 mt-1">{product.availability || '-'}</p>
                </Card.Body>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500">No scraped products available</p>
              <p className="text-sm text-gray-400 mt-2">Click the "Scrape Products" button to populate this list</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
