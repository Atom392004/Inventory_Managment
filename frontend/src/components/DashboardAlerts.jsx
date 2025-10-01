import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/Card.tsx";
import { AlertCircle } from "lucide-react";

export default function DashboardAlerts({ lowStockProducts, recentMovements, loading }) {
  const navigate = useNavigate();

  function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alerts */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Low Stock Alert</h2>
              <p className="text-sm text-gray-600">Products that need restocking attention</p>
            </div>
            <button onClick={() => navigate('/products')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
        </Card.Header>
        <Card.Body>
          <ul className="space-y-4">
            {lowStockProducts.slice(0, 3).map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-800">{p.name}</div>
                  <div className="text-sm text-gray-500">Total stock: {p.current_stock}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-red-600 text-sm font-medium">{p.current_stock} left</span>
                  <button onClick={() => navigate('/stock-movements')} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                    Restock
                  </button>
                </div>
              </li>
            ))}
            {lowStockProducts.length === 0 && !loading && (
              <p className="text-gray-500 text-sm">No low stock items.</p>
            )}
          </ul>
        </Card.Body>
      </Card>

      {/* Recent Stock Movements */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recent Stock Movements</h2>
              <p className="text-sm text-gray-600">Latest inventory activities</p>
            </div>
            <button onClick={() => navigate('/stock-movements')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
        </Card.Header>
        <Card.Body>
          <ul className="space-y-4">
            {recentMovements.slice(0, 4).map((m, index) => {
              const isIn = m.movement_type === "in" || m.movement_type === "transfer_in";
              const isOut = m.movement_type === "out" || m.movement_type === "transfer_out";
              const isTransfer = m.movement_type.includes("transfer");
              const typeLabel = isTransfer ? "Transfer" : isIn ? "Stock In" : "Stock Out";
              const icon = isIn ? "+" : isOut ? "−" : "→";
              const colorClass = isIn ? "bg-green-50 text-green-600" : isOut ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600";
              const textColor = isIn ? "text-green-600" : isOut ? "text-red-600" : "text-blue-600";
              return (
                <li key={m.id || index} className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      {icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{typeLabel}</div>
                      <div className="text-sm text-gray-500">
                        Warehouse #{m.warehouse_id} • {timeAgo(m.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${textColor}`}>
                    {Math.abs(m.quantity)}
                  </div>
                </li>
              );
            })}
            {recentMovements.length === 0 && !loading && (
              <p className="text-gray-500 text-sm">No recent movements.</p>
            )}
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
}
