import React, { useEffect, useState } from "react";
import { stockMovements } from "../api/apiClient";
import { useAuth } from "../state/auth";

function RejectionModal({ isOpen, onClose, onConfirm, requestId, actionLoading }) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Rejection Reason</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            className="w-full p-2 border border-gray-300 rounded mb-4"
            rows="4"
            required
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PendingApprovalsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionRequestId, setRejectionRequestId] = useState(null);

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError(null);
      try {
        const data = await stockMovements.listRequests(token);
        setRequests(data);
      } catch (err) {
        setError(err.message || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [token]);

  const handleAction = async (requestId, action, reason = null) => {
    setActionLoading(requestId);
    setError(null);
    try {
      await stockMovements.approveRequest(requestId, action, token, reason);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(err.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (requestId) => {
    setRejectionRequestId(requestId);
    setShowRejectionModal(true);
  };

  const handleRejectionConfirm = (reason) => {
    if (rejectionRequestId) {
      handleAction(rejectionRequestId, "reject", reason);
    }
  };

  const handleModalClose = () => {
    setShowRejectionModal(false);
    setRejectionRequestId(null);
  };

  if (!user || (user.role !== "admin" && user.role !== "warehouse_owner")) {
    return <p>Access denied. You do not have permission to view this page.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Approval Requests</h1>
      {loading && <p>Loading requests...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && requests.length === 0 && <p>No pending requests.</p>}
      <ul>
        {requests.map((req) => (
          <li key={req.id} className="border p-4 mb-2 rounded shadow-sm">
            <p><strong>Product:</strong> {req.product_name}</p>
            {req.warehouse_name && <p><strong>Warehouse:</strong> {req.warehouse_name}</p>}
            {req.from_warehouse_name && <p><strong>From Warehouse:</strong> {req.from_warehouse_name}</p>}
            {req.to_warehouse_name && <p><strong>To Warehouse:</strong> {req.to_warehouse_name}</p>}
            <p><strong>Quantity:</strong> {req.quantity}</p>
            <p><strong>Type:</strong> {req.movement_type}</p>
            <p><strong>Requested by:</strong> {req.requester_username}</p>
            <p><strong>Notes:</strong> {req.notes || "None"}</p>
            <div className="mt-2 flex gap-2">
              <button
                disabled={actionLoading === req.id}
                onClick={() => handleAction(req.id, "approve")}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={actionLoading === req.id}
                onClick={() => handleRejectClick(req.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={handleModalClose}
        onConfirm={handleRejectionConfirm}
        requestId={rejectionRequestId}
        actionLoading={actionLoading === rejectionRequestId}
      />
    </div>
  );
}
