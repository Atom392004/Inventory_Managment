import React, { useEffect, useState } from "react";
import { stockMovements, products, warehouses } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";
import PendingStockRequests from "../components/PendingStockRequests";

export default function StockMovementsPage() {
  const { token, user } = useAuth();
  const [movements, setMovements] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [actionType, setActionType] = useState("in"); // "in" | "out" | "transfer"

  const [form, setForm] = useState({
    product_id: "",
    warehouse_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    quantity: 1,
    notes: "",
  });

  const [error, setError] = useState("");
  const [stockDistribution, setStockDistribution] = useState({});
  const [validating, setValidating] = useState(false);

  async function load() {
    try {
      const [m, p, w] = await Promise.all([
        stockMovements.list(token),
        products.list({ include_inactive: false }, token),
        warehouses.list(token),
      ]);
      setMovements(Array.isArray(m) ? m : []);
      setProductsList(Array.isArray(p.data) ? p.data : []);
      setWarehousesList(Array.isArray(w) ? w : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load data: " + (e.response?.data?.detail || e.message));
    }
  }

  async function checkStockDistribution(productId) {
    if (!productId || actionType === "transfer") {
      setStockDistribution({});
      setError("");
      return;
    }
    setValidating(true);
    try {
      const data = await stockMovements.getStockDistribution(productId, token);
      setStockDistribution(data.stock_distribution || {});
      // Allow adding to any warehouse, even if product exists in others
      setError("");
    } catch (e) {
      console.error(e);
      setError("Failed to check stock distribution: " + (e.response?.data?.detail || e.message));
    } finally {
      setValidating(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    if (form.product_id) {
      checkStockDistribution(form.product_id);
    }
  }, [form.product_id, form.warehouse_id, actionType]);

  const submit = async (e) => {
    e.preventDefault();
    if (error) {
      setError("Please resolve the validation error before submitting.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (actionType === "transfer") {
        await stockMovements.transfer(
          {
            product_id: parseInt(form.product_id),
            from_warehouse_id: parseInt(form.from_warehouse_id),
            to_warehouse_id: parseInt(form.to_warehouse_id),
            quantity: form.quantity,
            notes: form.notes,
          },
          token
        );
      } else {
        await stockMovements.create(
          {
            product_id: parseInt(form.product_id),
            warehouse_id: parseInt(form.warehouse_id),
            quantity: form.quantity,
            movement_type: actionType,
            notes: form.notes,
          },
          token
        );
      }

      setForm({
        product_id: "",
        warehouse_id: "",
        from_warehouse_id: "",
        to_warehouse_id: "",
        quantity: 1,
        notes: "",
      });
      setStockDistribution({});
      load();
      window.dispatchEvent(new Event('dashboardRefresh'));
    } catch (e) {
      console.error(e);
      setError("Failed to save: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const getWarehouseName = (id) =>
    warehousesList.find((w) => w.id === id)?.name || (id ? `#${id}` : "-");

  const getMovementTypeDisplay = (type) => {
    switch (type) {
      case "transfer_out":
        return "Transfer Out";
      case "transfer_in":
        return "Transfer In";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📦 Stock Movements</h1>

      {/* Pending Requests Section */}
      <PendingStockRequests />

      {/* Form */}
      {user && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Record Movement</h2>
          <form onSubmit={submit} className="grid md:grid-cols-6 gap-3">
            {/* Product */}
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="border p-2 rounded col-span-2"
              required
              disabled={validating}
            >
              <option value="">Select product</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Action Type */}
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="in">Add Stock (In)</option>
              <option value="out">Remove Stock (Out)</option>
              <option value="transfer">Transfer</option>
            </select>

            {/* Warehouse / Transfer Fields */}
            {actionType === "transfer" ? (
              <>
                <select
                  value={form.from_warehouse_id}
                  onChange={(e) =>
                    setForm({ ...form, from_warehouse_id: e.target.value })
                  }
                  className="border p-2 rounded"
                  required
                >
                  <option value="">From warehouse</option>
                  {warehousesList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.to_warehouse_id}
                  onChange={(e) =>
                    setForm({ ...form, to_warehouse_id: e.target.value })
                  }
                  className="border p-2 rounded"
                  required
                >
                  <option value="">To warehouse</option>
                  {warehousesList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <select
                value={form.warehouse_id}
                onChange={(e) =>
                  setForm({ ...form, warehouse_id: e.target.value })
                }
                className="border p-2 rounded"
                required
                disabled={validating}
              >
                <option value="">Select warehouse</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}

            {/* Qty */}
            <input
              type="number"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
              className="border p-2 rounded"
              min="1"
              required
            />

            {/* Notes */}
            <input
              type="text"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="border p-2 rounded col-span-2"
            />

            <button
              className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-medium disabled:opacity-50"
              disabled={loading || validating || !!error}
            >
              {loading ? "Saving..." : validating ? "Validating..." : "Save"}
            </button>
          </form>

          {error && (
            <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Product</th>
              <th className="p-2">Warehouse</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Type</th>
              <th className="p-2">User</th>
              <th className="p-2">Date</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{m.product_name || `#${m.product_id}`}</td>
                <td className="p-2">{getWarehouseName(m.warehouse_id)}</td>
                <td className="p-2">{m.quantity}</td>
                <td className="p-2">{getMovementTypeDisplay(m.movement_type)}</td>
                <td className="p-2">{m.username || `User ${m.user_id}`}</td>
                <td className="p-2">
                  {m.created_at
                    ? new Date(m.created_at).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2">{m.notes || "-"}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No movements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
