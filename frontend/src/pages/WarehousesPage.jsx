
import React, { useEffect, useState } from "react";
import { warehouses } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";

function WarehouseForm({ onSubmit, initial, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [location, setLocation] = useState(initial?.location || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, location });
  };

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{initial ? "Edit Warehouse" : "Create Warehouse"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default function WarehousesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const data = await warehouses.list(token, { page_size: 200 });
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Failed to load warehouses: " + (e.body?.detail || e.message));
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const create = async (payload) => {
    try {
      await warehouses.create(payload, token);
      setShowForm(false);
      load();
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      alert("Failed to create warehouse: " + (e.body?.detail || e.message));
    }
  };

  const update = async (id, payload) => {
    try {
      await warehouses.update(id, payload, token);
      setEditing(null);
      load();
      if (selectedWarehouseId === id) {
        setDetails(null); // Reset details if editing the selected one
      }
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      alert("Failed to update warehouse: " + (e.body?.detail || e.message));
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete warehouse? This will also remove associated stock movements.")) return;
    try {
      await warehouses.remove(id, token);
      load();
      if (selectedWarehouseId === id) {
        setSelectedWarehouseId(null);
        setDetails(null);
      }
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      alert("Failed to delete warehouse: " + (e.body?.detail || e.message));
    }
  };

  const loadDetails = async (warehouse) => {
    if (details && details.id === warehouse.id) return; // Already loaded
    setLoading(true);
    setError(null);
    try {
      const data = await warehouses.details(warehouse.id, token);
      setDetails(data);
      setSelectedWarehouseId(warehouse.id);
    } catch (e) {
      console.error(e);
      setError("Failed to load warehouse details: " + (e.body?.detail || e.message));
      setSelectedWarehouseId(null);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (warehouse) => {
    if (selectedWarehouseId === warehouse.id) {
      setSelectedWarehouseId(null);
      setDetails(null);
    } else {
      loadDetails(warehouse);
    }
  };

  const getSummary = (warehouse) => {
    return {
      productCount: warehouse.product_count || 0,
      totalValue: (warehouse.total_value || 0).toFixed(2)
    };
  };

  if (error) {
    return <div className="text-red-600 p-4 bg-red-50 rounded">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          New Warehouse
        </button>
      </div>

      {showForm && (
        <WarehouseForm
          onSubmit={create}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editing && (
        <WarehouseForm
          initial={editing}
          onSubmit={(payload) => update(editing.id, payload)}
          onCancel={() => setEditing(null)}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No warehouses found.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Your First Warehouse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((warehouse) => {
            const summary = getSummary(warehouse);
            const isExpanded = selectedWarehouseId === warehouse.id;
            const isLoading = loading && selectedWarehouseId === warehouse.id;

            return (
              <div key={warehouse.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[600px]">
                {/* Card Header */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{warehouse.name}</h3>
                      {warehouse.location && (
                        <p className="text-gray-600 mt-1">{warehouse.location}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditing(warehouse)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(warehouse.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Products in Stock:</span>
                      <span className="ml-1">{summary.productCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Value:</span>
                      <span className="ml-1">${summary.totalValue}</span>
                    </div>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => toggleDetails(warehouse)}
                  className="w-full px-6 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {isExpanded ? "Hide Details" : "View Details"}
                  </span>
                  <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading details...</div>
                    ) : details ? (
                      <>
                        {/* Summary */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-lg font-semibold mb-2 text-gray-900">Warehouse Summary</h4>
                          <p className="text-gray-600">Total Value: ${details.total_value.toFixed(2)}</p>
                        </div>

                        {/* Products Table */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold mb-4 text-gray-900">Products in Stock</h4>
                          {details.products_in_stock && details.products_in_stock.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">SKU</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Price</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Stock</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {details.products_in_stock.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                                      <td className="px-4 py-3 text-sm text-gray-500">{product.sku}</td>
                                      <td className="px-4 py-3 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{product.stock}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No products in stock.</p>
                          )}
                        </div>

                        {/* Movements Table */}
                        <div>
                          <h4 className="text-lg font-semibold mb-4 text-gray-900">Recent Movements</h4>
                          {details.recent_movements && details.recent_movements.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Date</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Product</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Type</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Quantity</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">User</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {details.recent_movements.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {new Date(movement.created_at).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">{movement.product_name}</td>
                                      <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                          movement.movement_type.includes('out') || movement.movement_type.includes('transfer_out')
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {movement.movement_type}
                                        </span>
                                      </td>
                                      <td className={`px-4 py-3 text-sm font-medium ${
                                        movement.quantity < 0 ? 'text-red-600' : 'text-green-600'
                                      }`}>
                                        {movement.quantity}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">{movement.user_name}</td>
                                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                                        {movement.notes || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No recent movements.</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No details available.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
