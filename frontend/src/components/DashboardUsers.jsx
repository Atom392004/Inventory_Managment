import React, { useEffect, useState } from "react";
import { Card } from "./ui/Card.tsx";
import { Users, User } from "lucide-react";
import { dashboard } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";

export default function DashboardUsers() {
  const { token, user } = useAuth();
  const [userAnalytics, setUserAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "warehouse_owner") {
      loadUserAnalytics();
    }
  }, [user, token]);

  async function loadUserAnalytics() {
    setLoading(true);
    try {
      const data = await dashboard.userAnalytics(token);
      setUserAnalytics(data.user_activity || []);
    } catch (error) {
      console.error("Failed to load user analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (user?.role !== "warehouse_owner") return null;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Warehouse Users</h2>
        </div>
        <p className="text-sm text-gray-600">Users associated with your warehouses and their activity</p>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading user data...</p>
        ) : userAnalytics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAnalytics.map((u) => (
              <div key={u.user_id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-800">{u.username}</div>
                    <div className="text-sm text-gray-500">ID: {u.user_id}</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Movements:</span>
                    <span className="font-medium">{u.movement_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="font-medium">{u.total_quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="font-medium text-xs">
                      {u.last_activity ? new Date(u.last_activity).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No users found for your warehouses.</p>
        )}
      </Card.Body>
    </Card>
  );
}
