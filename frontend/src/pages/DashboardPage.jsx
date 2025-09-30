import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboard, stockMovements } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";
import { Package, Warehouse, ArrowLeftRight, AlertCircle, BarChart3, TrendingUp } from "lucide-react";
import { Card } from "../components/ui/Card.tsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, warehouses: 0, movements: 0, total_stock: 0, low_stock_items: 0 });
  const [recentMovements, setRecentMovements] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [stockMovementsTrend, setStockMovementsTrend] = useState([]);
  const [stockByWarehouse, setStockByWarehouse] = useState([]);
  const [topProductsByValue, setTopProductsByValue] = useState([]);
  const [stockValueTrend, setStockValueTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, movementsRes] = await Promise.allSettled([
        dashboard.stats(token),
        stockMovements.list(token),
      ]);

      if (statsRes.status === "rejected") {
        if (statsRes.reason?.status === 503) {
          setError("Database service is currently unavailable. Please check the backend connection.");
        } else {
          setError("Failed to load dashboard data.");
        }
        setStats({ products: 0, warehouses: 0, movements: 0, total_stock: 0, low_stock_items: 0 });
        setLowStockProducts([]);
        return;
      }

      const statsData = statsRes.value || { total_products: 0, total_warehouses: 0, total_stock: 0, low_stock_items: 0, low_stock_products: [] };
      const movementsData = movementsRes.status === "fulfilled" && Array.isArray(movementsRes.value) ? movementsRes.value : [];

      setStats({
        products: statsData.total_products || 0,
        warehouses: statsData.total_warehouses || 0,
        movements: movementsData.length,
        total_stock: statsData.total_stock || 0,
        low_stock_items: statsData.low_stock_items || 0,
      });

      setLowStockProducts(statsData.low_stock_products || []);
      setStockMovementsTrend(statsData.stock_movements_trend || []);
      setStockByWarehouse(statsData.stock_by_warehouse || []);
      setTopProductsByValue(statsData.top_products_by_value || []);
      setStockValueTrend(statsData.stock_value_trend || []);
      setRecentMovements(movementsData.slice(0, 5)); // latest 5 movements
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // Refresh every 10 seconds as backup
    const handleRefresh = () => load();
    window.addEventListener('dashboardRefresh', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('dashboardRefresh', handleRefresh);
    };
  }, [token]);

  if (error) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your inventory overview.</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={load}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with welcome message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your inventory overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.products}
          loading={loading}
          icon={<Package className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Total Stock Quantity"
          value={stats.total_stock.toLocaleString()}
          loading={loading}
          icon={<Package className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.low_stock_items}
          loading={loading}
          icon={<AlertCircle className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          title="Warehouses"
          value={stats.warehouses}
          loading={loading}
          icon={<Warehouse className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50"
        />
      </div>

      {/* Low Stock Alerts and Recent Movements */}
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

      {/* Analytics Section with Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movements Trend Line Chart */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Stock Movements Trend</h2>
            </div>
          </Card.Header>
          <Card.Body>
            {stockMovementsTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stockMovementsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_quantity" stroke="#3B82F6" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm">No trend data available.</p>
            )}
          </Card.Body>
        </Card>

        {/* Stock by Warehouse Bar Chart */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-800">Stock by Warehouse</h2>
            </div>
          </Card.Header>
          <Card.Body>
            {stockByWarehouse.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockByWarehouse}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="warehouse_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_stock" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm">No warehouse data available.</p>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

/* Reusable stat card */
function StatCard({ title, value, loading, icon, color }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-800">
            {loading ? "..." : value}
          </div>
        </div>
      </div>
    </div>
  );
}
