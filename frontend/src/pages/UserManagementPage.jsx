import React, { useEffect, useState } from "react";
import { admin } from "../api/apiClient";
import { useAuth } from "../state/auth";

export default function UserManagementPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const data = await admin.listUsers(token);
        setUsers(data);
      } catch (err) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [token]);

  const handleToggleRole = async (userId) => {
    setActionLoading(userId);
    setError(null);
    try {
      await admin.toggleRole(userId, token);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: u.role === "admin" ? "user" : u.role === "warehouse_owner" ? "user" : "warehouse_owner",
              }
            : u
        )
      );
    } catch (err) {
      setError(err.message || "Failed to toggle role");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || user.role !== "admin") {
    return <p>Access denied. Only admins can view this page.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Username</th>
            <th className="py-2 px-4 border">Email</th>
            <th className="py-2 px-4 border">Role</th>
            <th className="py-2 px-4 border">Location</th>
            <th className="py-2 px-4 border">Created At</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.filter((u) => u.role !== "admin").map((u) => (
            <tr key={u.id}>
              <td className="py-2 px-4 border">{u.username}</td>
              <td className="py-2 px-4 border">{u.email}</td>
              <td className="py-2 px-4 border">{u.role}</td>
              <td className="py-2 px-4 border">{u.location || "N/A"}</td>
              <td className="py-2 px-4 border">{u.created_at ? new Date(u.created_at).toLocaleString() : "N/A"}</td>
              <td className="py-2 px-4 border">
                <button
                  disabled={actionLoading === u.id}
                  onClick={() => handleToggleRole(u.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Toggle Role
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
