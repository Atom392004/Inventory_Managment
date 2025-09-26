import React, { useEffect, useState, useCallback, useRef } from "react";
import { products } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";
import { Button } from "../components/ui/Button.tsx";
import { Card } from "../components/ui/Card.tsx";

function ProductForm({ onSubmit, initial, onCancel, isSubmitting }) {
  const [name, setName] = useState(initial?.name || "");
  const [sku, setSku] = useState(initial?.sku || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial?.price || 0);
  const [isActive, setIsActive] = useState(
    initial?.is_active !== undefined ? initial.is_active : true
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, sku, description, price, is_active: isActive });
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter product name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter product SKU"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          rows={4}
          placeholder="Enter product description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
          Save Product
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilter, setCurrentFilter] = useState("all"); // "all" | "low_stock"
  const [sortBy, setSortBy] = useState("name"); // "name" | "sku" | "price" | "created_at"
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"
  const [showInactive, setShowInactive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const debounceRef = useRef(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: searchTerm,
        filter: currentFilter === "low_stock" ? "low_stock" : undefined,
        sort_by: `${sortBy}_${sortOrder}`,
        include_inactive: showInactive
      };
      const data = await products.list(params, token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || "Failed to load products");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token, currentFilter, sortBy, sortOrder, showInactive]);

  const debouncedLoad = useCallback(
    debounce(() => {
      load();
    }, 500),
    [searchTerm, currentFilter, sortBy, sortOrder]
  );

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const create = async (payload) => {
    setIsCreating(true);
    try {
      await products.create(payload, token);
      setShowForm(false);
      load();
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || "Failed to create product");
    } finally {
      setIsCreating(false);
    }
  };
  const update = async (id, payload) => {
    setIsUpdating(true);
    try {
      await products.update(id, payload, token);
      setEditing(null);
      load();
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || "Failed to update product");
    } finally {
      setIsUpdating(false);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete product?")) return;
    setIsDeleting(true);
    try {
      await products.remove(id, token);
      load();
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-600 mt-2">Manage your product inventory and stock levels</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
          }}
          variant="primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              debouncedLoad();
            }}
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          onClick={() => {
            setCurrentFilter("all");
            load();
          }}
          className={`px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
            currentFilter === "all" 
              ? "text-blue-600 border-blue-300 bg-blue-50" 
              : "text-gray-700"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          All Products
        </button>
        <button
          onClick={() => {
            setCurrentFilter("low_stock");
            load();
          }}
          className={`px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
            currentFilter === "low_stock"
              ? "text-red-600 border-red-300 bg-red-50"
              : "text-red-600"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Low Stock
        </button>
        <label className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Inactive</span>
        </label>
      </div>

      {/* Sorting Bar */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="name">Name</option>
          <option value="sku">SKU</option>
          <option value="price">Price</option>
          <option value="created_at">Created At</option>
        </select>
        <Button
          variant="ghost"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v12m0 0l4-4m-4 4l-4-4m6 0V4m0 0l4 4m-4-4l-4 4" />
            </svg>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <Card.Header>
            <h3 className="text-xl font-semibold text-gray-800">Create Product</h3>
          </Card.Header>
          <Card.Body>
            <ProductForm onSubmit={create} onCancel={() => setShowForm(false)} isSubmitting={isCreating} />
          </Card.Body>
        </Card>
      )}

      {editing && (
        <Card>
          <Card.Header>
            <h3 className="text-xl font-semibold text-gray-800">Edit Product</h3>
          </Card.Header>
          <Card.Body>
            <ProductForm
              initial={editing}
              onSubmit={(payload) => update(editing.id, payload)}
              onCancel={() => setEditing(null)}
              isSubmitting={isUpdating}
            />
          </Card.Body>
        </Card>
      )}

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
            <span className="text-gray-600">Loading products...</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && items.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <Card.Body className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  product.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-lg font-bold text-gray-800">
                  ${product.price?.toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(product);
                      setShowForm(false);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => remove(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stock Distribution */}
              <div className="border-t pt-4 mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Stock by Warehouse</div>
                <div className="space-y-2">
                  {product.stock_levels ? (
                    Object.entries(product.stock_levels).map(([warehouse, quantity]) => (
                      <div key={warehouse} className="flex justify-between text-sm">
                        <span className="text-gray-600">{warehouse}</span>
                        <span className={`font-medium ${quantity < 10 ? 'text-red-600' : ''}`}>
                          {quantity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No stock data available</div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
        {items.length === 0 && (
          <Card className="col-span-full text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500">No products available</p>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditing(null);
              }}
              variant="ghost"
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first product
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
