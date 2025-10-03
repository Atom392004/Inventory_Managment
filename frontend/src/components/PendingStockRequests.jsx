
import React, { useEffect, useState } from "react";
import { stockMovements } from "../api/apiClient";
import { useAuth } from "../state/auth";

export default function PendingStockRequests() {
  const { token } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelingRequestId, setCancelingRequestId] = useState(null);

  useEffect(() => {
    async function fetchMyRequests() {
      setLoading(true);
      setError("");
      try {
        const requests = await stockMovements.listMyRequests(token);
        setPendingRequests(requests);
      } catch (e) {
        setError("Failed to load my requests: " + (e.message || e.toString()));
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      fetchMyRequests();
    }
  }, [token]);

  async function handleCancelRequest(requestId) {
    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return;
    }
    setCancelingRequestId(requestId);
    setError("");
    try {
      await stockMovements.cancelRequest(requestId, token);
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (e) {
      setError("Failed to cancel request: " + (e.message || e.toString()));
    } finally {
      setCancelingRequestId(null);
    }
  }

  if (loading) {
    return <div>Loading pending requests...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  const filteredRequests = pendingRequests.filter(req => req.status !== "approved");

  if (filteredRequests.length === 0) {
    return <div>No pending or rejected stock movement requests.</div>;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded mb-6">
      <h2 className="text-lg font-semibold mb-2">Pending Stock Movement Requests</h2>
      <ul className="space-y-3">
        {filteredRequests.map((req) => (
          <li key={req.id} className="p-3 border rounded bg-white">
            <div>
              <strong>Product:</strong> {req.product_name || `#${req.product_id}`}
            </div>
            <div>
              <strong>Quantity:</strong> {req.quantity}
            </div>
            <div>
              <strong>Type:</strong> {req.movement_type.charAt(0).toUpperCase() + req.movement_type.slice(1)}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {req.status === "pending" && (
                <span className="text-yellow-700">
                  Pending - please wait a while warehouse owner is accepting the request.
                </span>
              )}
              {req.status === "rejected" && (
                <span className="text-red-700">
                  Rejected - Reason: {req.rejection_reason || "No reason provided."}
                </span>
              )}
            </div>
            {req.notes && (
              <div>
                <strong>Notes:</strong> {req.notes}
              </div>
            )}
            {req.created_at && (
              <div>
                <strong>Requested At:</strong> {new Date(req.created_at).toLocaleString()}
              </div>
            )}
            {(req.warehouse_name || req.from_warehouse_name || req.to_warehouse_name) && (
              <div>
                <strong>Warehouse Info:</strong>{" "}
                {req.warehouse_name && <>Warehouse: {req.warehouse_name} </>}
                {req.from_warehouse_name && <>From: {req.from_warehouse_name} </>}
                {req.to_warehouse_name && <>To: {req.to_warehouse_name}</>}
              </div>
            )}
            {req.status === "pending" && (
              <button
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                onClick={() => handleCancelRequest(req.id)}
                disabled={cancelingRequestId === req.id}
              >
                {cancelingRequestId === req.id ? "Cancelling..." : "Cancel Request"}
              </button>
            )}
            {req.status === "rejected" && (
              <button
                className="mt-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={() => handleCancelRequest(req.id)}
                disabled={cancelingRequestId === req.id}
                title="Delete rejected request"
              >
                &times; Close
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
