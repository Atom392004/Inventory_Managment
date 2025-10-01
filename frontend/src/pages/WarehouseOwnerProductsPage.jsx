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

export default function WarehouseOwnerProductsPage() {
  const { token, user } = useAuth();
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productsInWarehouses, setProductsInWarehouses] = useState([]);
  const [loadingInWarehouses, setLoadingInWarehouses] = useState(false);
  const [errorInWarehouses, setErrorInWarehouses] = useState(null);
  const [paginationInWarehouses, setPaginationInWarehouses] = useState(null);
  const [viewMode, setViewMode] = useState("warehouse");
  const debounceRef = useRef(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: searchTerm,
        filter: currentFilter === "low_stock" ? "low_stock" : undefined,
        sort_by: `${sortBy}_${sortOrder}`,
        include_inactive: showInactive,
        page: page,
        page_size: pageSize
      };
      const response = await products.list(params, token);
      setItems(Array.isArray(response.data) ? response.data : []);
      setPagination(response.pagination || null);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || "Failed to load products");
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductsInWarehouses() {
    setLoadingInWarehouses(true);
    setErrorInWarehouses(null);
    try {
      const params = {
        search: searchTerm,
        sort_by: `${sortBy}_${sortOrder}`,
        include_inactive: showInactive,
        page: page,
        page_size: pageSize,
        ownership_filter: "all"
      };
      const response = await products.listInMyWarehouses(params, token);
      setProductsInWarehouses(Array.isArray(response.data) ? response.data : []);
      setPaginationInWarehouses(response.pagination || null);
    } catch (e) {
      console.error(e);
      setErrorInWarehouses(e.response?.data?.detail || e.message || "Failed to load products in warehouses");
      setProductsInWarehouses([]);
      setPaginationInWarehouses(null);
    } finally {
      setLoadingInWarehouses(false);
    }
  }

  useEffect(() => {
    load();
  }, [token, currentFilter, sortBy, sortOrder, showInactive, page, pageSize]);

  useEffect(() => {
    if (user?.role === 'warehouse_owner') {
      loadProductsInWarehouses();
    }
  }, [token, sortBy, sortOrder, showInactive, page, pageSize, user]);

  const debouncedLoad = useCallback(
    debounce(() => {
      setPage(1); // Reset to first page on search/filter change
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

  const getMyProducts = () => {
    if (user?.role === 'admin') {
      return items; // Admin sees all as "My Products" in this context, but we have separate section
    }
    return items.filter(p => p.owner_id === user.id);
  };

  const getProductsInMyWarehouses = () => {
    return productsInWarehouses;
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
        <Button
          onClick={() => {
            setCurrentFilter("all");
            setPage(1);
            load();
          }}
          variant={currentFilter === "all" ? "primary" : "ghost"}
          className="flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          All Products
        </Button>
        <Button
          onClick={() => {
            setCurrentFilter("low_stock");
            setPage(1);
            load();
          }}
          variant={currentFilter === "low_stock" ? "primary" : "ghost"}
          className="flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Low Stock
        </Button>
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

      {/* Sorting and Pagination Bar */}
      <div className="flex items-center justify-between">
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
            <option value="stock">Stock</option>
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
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Items per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setPage(1); // Reset to first page
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
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

      {!loading && (
        <div className="space-y-8">
          {/* My Products Section */}
          {(user?.role === 'admin') && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">My Products</h2>
              {getMyProducts().length === 0 ? (
                <p className="text-gray-500">No products available for you.</p>
              ) : (
                <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getMyProducts().map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={product.description}>{product.description || "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.total_stock || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditing(product);
                                  setShowForm(false);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => remove(product.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Products in My Warehouses Section */}
          {user?.role === 'warehouse_owner' && (
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {viewMode === "warehouse" ? "Products in My Warehouses" : "My Products"}
                </h2>
                <Button
                  onClick={() => setViewMode(viewMode === "warehouse" ? "manage_my" : "warehouse")}
                  variant="secondary"
                >
                  {viewMode === "warehouse" ? "Manage My Products" : "View Warehouse Products"}
                </Button>
              </div>
              {viewMode === "warehouse" && (
                <>
                  {/* Error Display */}
                  {errorInWarehouses && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                      {errorInWarehouses}
                    </div>
                  )}
                  {/* Loading State */}
                  {loadingInWarehouses && (
                    <div className="flex justify-center items-center py-12">
                      <div className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-gray-600">Loading products in warehouses...</span>
                      </div>
                    </div>
                  )}
                  {!loadingInWarehouses && getProductsInMyWarehouses().length === 0 ? (
                    <p className="text-gray-500">No products in your warehouses.</p>
                  ) : !loadingInWarehouses && (
                    <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getProductsInMyWarehouses().map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={product.description}>{product.description || "—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price?.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  product.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.owner_name || "—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.total_stock || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
              {viewMode === "manage_my" && (
                <>
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
                  {!loading && getMyProducts().length === 0 ? (
                    <p className="text-gray-500">No products available for you.</p>
                  ) : !loading && (
                    <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getMyProducts().map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={product.description}>{product.description || "—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price?.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  product.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.total_stock || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditing(product);
                                      setShowForm(false);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => remove(product.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* All Products Section */}
          {user?.role === 'admin' && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">All Products</h2>
              {items.length === 0 ? (
                <p className="text-gray-500">No products available.</p>
              ) : (
                <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={product.description}>{product.description || "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.total_stock || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.owner_name || "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditing(product);
                                  setShowForm(false);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => remove(product.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
      {!loading && items.length === 0 && user?.role !== 'warehouse_owner' && (
        <div className="text-center py-12 bg-white shadow-sm rounded-lg border border-gray-200">
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
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} products
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.total_pages - 4, page - 2)) + i;
                if (pageNum > pagination.total_pages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "primary" : "ghost"}
                    onClick={() => setPage(pageNum)}
                    className="px-3 py-2 min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.total_pages}
              className="px-3 py-2"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
