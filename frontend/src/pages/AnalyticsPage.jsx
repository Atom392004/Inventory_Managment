import React, { useState } from "react";
import { fetchRecommendations } from "../api/recommendations";

export default function AnalyticsPage() {
  const [productId, setProductId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetRecommendations = async () => {
    if (!productId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchRecommendations(productId);
      setRecommendations(data.recommendations);
    } catch (err) {
      setError("Failed to fetch recommendations. Ensure the product exists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📊 Recommendations</h1>

      {/* Product Recommendation Section */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">🛍️ Product Recommendations</h2>
        <p className="text-lg">
          Get similar product recommendations based on scraped products using ML (TF-IDF and cosine similarity).
        </p>
        <div className="mt-4">
          <input
            type="number"
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="border rounded px-3 py-2 mr-2"
          />
          <button
            onClick={handleGetRecommendations}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : "Get Recommendations"}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {recommendations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Recommended Products:</h3>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="border rounded p-4">
                  <strong>{rec.product.name}</strong> - Similarity: {rec.similarity_score.toFixed(2)}
                  <br />
                  Price: ${rec.product.price} | Rating: {rec.product.rating || "N/A"}
                  <br />
                  {rec.product.description && <span>Description: {rec.product.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
