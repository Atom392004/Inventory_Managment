import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { warehouses } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";
import { Card } from "../components/ui/Card.tsx";
import { ToggleSwitch } from "../components/ui/ToggleSwitch.tsx";

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [warehouse, setWarehouse] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWarehouse();
  }, [id, token]);

  const loadWarehouse = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await warehouses.details(id, token);
      setWarehouse(data.warehouse || data);
      setDetails(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load warehouse details: " + (e?.body?.detail || e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!warehouse) return;
    try {
      await warehouses.toggleAvailability(warehouse.id, token);
      // Refresh data
      loadWarehouse();
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      alert("Failed to toggle availability: " + (e?.response?.data?.detail || e?.message || "Unknown error"));
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading warehouse details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <Card.Header>
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={() => navigate('/warehouses')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Warehouses
            </button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <Card.Header>
            <h2 className="text-xl font-semibold">Warehouse Not Found</h2>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-700">The requested warehouse could not be found.</p>
            <button
              onClick={() => navigate('/warehouses')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Warehouses
            </button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/warehouses')}
            className="mb-4 px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Warehouses
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{warehouse.name}</h1>
              {warehouse.location && (
                <p className="text-lg text-gray-600 mt-1">{warehouse.location}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {warehouse.is_available ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Unavailable
                </span>
              )}
              {(user?.role === 'admin' || user?.role === 'warehouse_owner') && (
                <ToggleSwitch
                  checked={warehouse.is_available}
                  onChange={toggleAvailability}
                  label=""
                />
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            </Card.Header>
            <Card.Content>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(details?.total_value || details?.totalValue || 0)}
              </p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Products in Stock</h3>
            </Card.Header>
            <Card.Content>
              <p className="text-2xl font-bold text-indigo-600">
                {details?.product_count ?? details?.products_in_stock?.length ?? 0}
              </p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Recent Movements</h3>
            </Card.Header>
            <Card.Content>
              <p className="text-2xl font-bold text-indigo-600">
                {(details?.stock_movements || details?.ledger || details?.recent_movements || details?.movements || []).length}
              </p>
            </Card.Content>
          </Card>
        </div>

        {/* Products in Stock */}
        <Card className="mb-8">
          <Card.Header>
            <h3 className="text-xl font-semibold text-gray-900">Products in Stock</h3>
          </Card.Header>
          <Card.Content>
            {details?.products_in_stock && details.products_in_stock.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {details.products_in_stock.map((p) => {
                      const prod = p.product || p.product_detail || p;
                      const qty = p.stock ?? p.quantity ?? p.qty ?? 0;
                      const unit = p.unit_price ?? prod.unit_price ?? p.price ?? 0;
                      const total = Number(qty) * Number(unit || 0);
                      return (
                        <tr key={p.product_id || prod.id || Math.random()}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {prod.name || prod.product_name || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prod.sku || prod.SKU || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {formatCurrency(unit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No products in stock for this warehouse.</p>
            )}
          </Card.Content>
        </Card>

        {/* Recent Movements */}
        <Card>
          <Card.Header>
            <h3 className="text-xl font-semibold text-gray-900">Recent Movements</h3>
          </Card.Header>
          <Card.Content>
            {(details?.stock_movements || details?.ledger || details?.recent_movements || details?.movements || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(details.stock_movements || details.ledger || details.recent_movements || details.movements || []).map((m) => {
                      const productName = (m.product && (m.product.name || m.product.product_name)) || m.product_name || m.product || "—";
                      const qty = m.quantity ?? m.qty ?? 0;
                      return (
                        <tr key={m.id || Math.random()}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(m.created_at || m.date || m.timestamp || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {m.movement_type || m.type || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {m.reference_id || m.notes || m.reference || m.note || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent movements for this warehouse.</p>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
