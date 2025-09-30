import React, { useEffect, useState } from "react";
import { warehouses } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";
import WarehouseForm from "../components/WarehouseForm";
import { Card } from "../components/ui/Card.tsx";
import { ToggleSwitch } from "../components/ui/ToggleSwitch.tsx";

export default function WarehousesPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [nearMeFilter, setNearMeFilter] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  async function load() {
    try {
      const data = await warehouses.list(token, { page_size: 200 });
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Failed to load warehouses: " + (e?.body?.detail || e?.message || e));
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
      alert("Failed to create warehouse: " + (e?.body?.detail || e?.message || e));
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
      alert("Failed to update warehouse: " + (e?.body?.detail || e?.message || e));
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
      alert("Failed to delete warehouse: " + (e?.body?.detail || e?.message || e));
    }
  };

  const toggleAvailability = async (id) => {
    try {
      await warehouses.toggleAvailability(id, token);
      load();
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      alert("Failed to toggle availability: " + (e?.body?.detail || e?.message || e));
    }
  };

  const loadDetails = async (warehouse) => {
    if (details && details.id === warehouse.id) return; // Already loaded`
    setLoading(true);
    setError(null);
    try {
      const data = await warehouses.details(warehouse.id, token);
      setDetails(data);
      setSelectedWarehouseId(warehouse.id);
    } catch (e) {
      console.error(e);
      setError("Failed to load warehouse details: " + (e?.body?.detail || e?.message || e));
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
      totalValue: (warehouse.total_value || 0).toFixed ? (warehouse.total_value || 0).toFixed(2) : Number(warehouse.total_value || 0).toFixed(2)
    };
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error("Unable to retrieve your location."));
        }
      );
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const findNearMe = async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setNearMeFilter(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const filterWarehouses = (warehouses) => {
    let filtered = warehouses;
    if (locationSearch.trim()) {
      filtered = filtered.filter(warehouse =>
        warehouse.location && warehouse.location.toLowerCase().includes(locationSearch.toLowerCase())
      );
    }
    if (nearMeFilter && userLocation) {
      filtered = filtered.filter(warehouse => {
        if (!warehouse.latitude || !warehouse.longitude) return false;
        const distance = calculateDistance(
          userLocation.latitude, userLocation.longitude,
          warehouse.latitude, warehouse.longitude
        );
        return distance <= 50; // Within 50km
      }).sort((a, b) => {
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return distA - distB;
      });
    }
    return filtered;
  };

  const getMyWarehouses = () => {
    if (user?.role === 'warehouse_owner') {
      return filterWarehouses(items.filter(w => w.owner_id === user.id));
    } else if (user?.role === 'admin') {
      return filterWarehouses(items); // Admin sees all warehouses in "My Warehouses"
    }
    // For normal users, no "My Warehouses" section
    return [];
  };

  const getAllWarehouses = () => {
    return filterWarehouses(items);
  };

  const formatCurrency = (v) => {
    try {
      return `$${Number(v || 0).toFixed(2)}`;
    } catch {
      return `$0.00`;
    }
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  if (error) {
    return <div className="text-red-600 p-4 bg-red-50 rounded">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={findNearMe}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            title="Find warehouses near me"
          >
            Find Near Me
          </button>
          {nearMeFilter && (
            <button
              onClick={() => { setNearMeFilter(false); setUserLocation(null); }}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              title="Clear near me filter"
            >
              Clear Nearby Filter
            </button>
          )}
          {(user?.role === 'admin' || user?.role === 'warehouse_owner') && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditing(null);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              New Warehouse
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Warehouses by Location
        </label>
        <input
          id="location-search"
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="Enter location..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          {(user?.role === 'admin' || user?.role === 'warehouse_owner') && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Warehouse
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
      {/* My Warehouses Section */}
      {(user?.role === 'admin' || user?.role === 'warehouse_owner') && (
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">My Warehouses</h2>
          {getMyWarehouses().length === 0 ? (
            <p className="text-gray-500">No warehouses available for you.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getMyWarehouses().map((warehouse) => {
                const summary = getSummary(warehouse);
                const isExpanded = selectedWarehouseId === warehouse.id;
                const isLoading = loading && selectedWarehouseId === warehouse.id;

                return (
                  <Card key={warehouse.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-auto">
                    {/* Card Header */}
                    <Card.Header>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{warehouse.name}</h3>
                          {warehouse.location && (
                            <p className="text-gray-600 mt-1">{warehouse.location}</p>
                          )}
                        </div>
                        {(user?.role === 'admin' || (user?.role === 'warehouse_owner' && warehouse.owner_id === user.id)) && (
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
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Products in Stock:</span>
                          <span className="ml-1">{summary.productCount}</span>
                        </div>
                        <div>
                          <span className="font-medium">Total Value:</span>
                          <span className="ml-1">{summary.totalValue}</span>
                        </div>
                      </div>
                    </Card.Header>

                    {/* Expand Button - Hide for normal users */}
                    {user?.role !== "user" && (
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
                    )}

                    {/* Expanded Details */}
{isExpanded && (
  <Card.Body className="p-6 max-h-96 overflow-y-auto flex-1">
    {isLoading ? (
      <div className="text-center py-8 text-gray-500">Loading details...</div>
    ) : details && details.id === warehouse.id ? (
      <>
        {/* Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-gray-900">Warehouse Summary</h4>
          <p className="text-gray-600">Total Value: {formatCurrency(details.total_value || details.totalValue || 0)}</p>
          <p className="text-gray-600">Products in Stock: {details.product_count ?? details.products_in_stock?.length ?? 0}</p>
          <div className="mt-3">
            <ToggleSwitch
              checked={warehouse.is_available}
              onChange={() => toggleAvailability(warehouse.id)}
              label={warehouse.is_available ? "Available" : "Unavailable"}
            />
            <button
              onClick={() => loadDetails(warehouse)}
              className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 ml-2"
            >
              Refresh
            </button>
          </div>
        </div>
        {/* Products Table */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-900">Products in Stock</h4>
          {details.products_in_stock && details.products_in_stock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {details.products_in_stock.map((p) => {
                    const prod = p.product || p.product_detail || p;
                    const qty = p.quantity ?? p.qty ?? 0;
                    const unit = p.unit_price ?? prod.unit_price ?? p.price ?? 0;
                    const total = Number(qty) * Number(unit || 0);
                    return (
                      <tr key={p.product_id || prod.id || Math.random()}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{prod.name || prod.product_name || "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{prod.sku || prod.SKU || "—"}</td>
                        <td className="px-4 py-3 text-right">{qty}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(unit)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No products in stock for this warehouse.</p>
          )}
        </div>
        {/* Ledger / Recent Movements */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-900">Recent Movements</h4>
          {(
            details.stock_movements ||
            details.ledger ||
            details.recent_movements ||
            details.movements ||
            []
          ).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(details.stock_movements || details.ledger || details.recent_movements || details.movements || []).map((m) => {
                    const productName = (m.product && (m.product.name || m.product.product_name)) || m.product_name || m.product || "—";
                    const qty = m.quantity ?? m.qty ?? 0;
                    return (
                      <tr key={m.id || Math.random()}>
                        <td className="px-4 py-3">{formatDate(m.created_at || m.date || m.timestamp || "")}</td>
                        <td className="px-4 py-3">{m.movement_type || m.type || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{productName}</td>
                        <td className="px-4 py-3 text-right">{qty}</td>
                        <td className="px-4 py-3">{m.reference || m.note || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent movements for this warehouse.</p>
          )}
        </div>
      </>
    ) : (
      <div className="text-gray-500">No details available. Click "View Details" to load.</div>
    )}
  </Card.Body>
)}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
      )}

          {/* All Warehouses Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">All Warehouses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAllWarehouses().map((warehouse) => {
                const summary = getSummary(warehouse);
                const isExpanded = selectedWarehouseId === warehouse.id;
                const isLoading = loading && selectedWarehouseId === warehouse.id;

                return (
                  <Card key={warehouse.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-auto">
                    <Card.Header>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{warehouse.name}</h3>
                          {warehouse.location && (
                            <p className="text-gray-600 mt-1">{warehouse.location}</p>
                          )}
                        </div>
                        {(user?.role === 'admin' || (user?.role === 'warehouse_owner' && warehouse.owner_id === user.id)) && (
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
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Products in Stock:</span>
                          <span className="ml-1">{summary.productCount}</span>
                        </div>
                        <div>
                          <span className="font-medium">Total Value:</span>
                          <span className="ml-1">{summary.totalValue}</span>
                        </div>
                      </div>
                    </Card.Header>

                    {/* Expand Button - Hide for normal users */}
                    {user?.role !== "user" && (
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
                    )}

                    {isExpanded && (
                      <Card.Body className="p-6 max-h-96 overflow-y-auto flex-1">
                        {isLoading ? (
                          <div className="text-center py-8 text-gray-500">Loading details...</div>
                        ) : details && details.id === warehouse.id ? (
                          <>
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-lg font-semibold mb-2 text-gray-900">Warehouse Summary</h4>
                              <p className="text-gray-600">Total Value: {formatCurrency(details.total_value || details.totalValue || 0)}</p>
                              <p className="text-gray-600">Products in Stock: {details.product_count ?? details.products_in_stock?.length ?? 0}</p>
                              <div className="mt-3">
                                <ToggleSwitch
                                  checked={warehouse.is_available}
                                  onChange={() => toggleAvailability(warehouse.id)}
                                  disabled={warehouse.product_count > 0 && warehouse.is_available}
                                  label={warehouse.is_available ? "Available" : "Unavailable"}
                                />
                                <button
                                  onClick={() => loadDetails(warehouse)}
                                  className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 ml-2"
                                >
                                  Refresh
                                </button>
                              </div>
                            </div>

                            {/* Products table */}
                            <div className="mb-8">
                              <h4 className="text-lg font-semibold mb-4 text-gray-900">Products in Stock</h4>
                              {details.products_in_stock && details.products_in_stock.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm divide-y divide-gray-200">
                                    <thead>
                                      <tr className="bg-gray-50 text-left">
                                        <th className="px-4 py-2">Product</th>
                                        <th className="px-4 py-2">SKU</th>
                                        <th className="px-4 py-2 text-right">Quantity</th>
                                        <th className="px-4 py-2 text-right">Unit Price</th>
                                        <th className="px-4 py-2 text-right">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                      {details.products_in_stock.map((p) => {
                                        const prod = p.product || p.product_detail || p;
                                        const qty = p.quantity ?? p.qty ?? 0;
                                        const unit = p.unit_price ?? prod.unit_price ?? p.price ?? 0;
                                        const total = Number(qty) * Number(unit || 0);
                                        return (
                                          <tr key={p.product_id || prod.id || Math.random()}>
                                            <td className="px-4 py-3">
                                              <div className="font-medium text-gray-900">{prod.name || prod.product_name || "—"}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{prod.sku || prod.SKU || "—"}</td>
                                            <td className="px-4 py-3 text-right">{qty}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(unit)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(total)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500">No products in stock for this warehouse.</p>
                              )}
                            </div>

                            {/* Movements */}
                            <div>
                              <h4 className="text-lg font-semibold mb-4 text-gray-900">Recent Movements</h4>
                              {(
                                details.stock_movements ||
                                details.ledger ||
                                details.recent_movements ||
                                details.movements ||
                                []
                              ).length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm divide-y divide-gray-200">
                                    <thead>
                                      <tr className="bg-gray-50 text-left">
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Product</th>
                                        <th className="px-4 py-2 text-right">Quantity</th>
                                        <th className="px-4 py-2">Reference</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                      {(details.stock_movements || details.ledger || details.recent_movements || details.movements || []).map((m) => {
                                        const productName = (m.product && (m.product.name || m.product.product_name)) || m.product_name || m.product || "—";
                                        const qty = m.quantity ?? m.qty ?? 0;
                                        return (
                                          <tr key={m.id || Math.random()}>
                                            <td className="px-4 py-3">{formatDate(m.created_at || m.date || m.timestamp || "")}</td>
                                            <td className="px-4 py-3">{m.movement_type || m.type || "—"}</td>
                                            <td className="px-4 py-3 text-gray-700">{productName}</td>
                                            <td className="px-4 py-3 text-right">{qty}</td>
                                            <td className="px-4 py-3">{m.reference || m.note || "-"}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500">No recent movements for this warehouse.</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500">No details available. Click "View Details" to load.</div>
                        )}
                      </Card.Body>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
