import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboard, stockMovements } from "../api/apiClient.jsx";
import { useAuth } from "../state/auth";
import { AlertCircle } from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import DashboardStats from "../components/DashboardStats";
import DashboardAlerts from "../components/DashboardAlerts";
import DashboardAnalytics from "../components/DashboardAnalytics";
import DashboardUsers from "../components/DashboardUsers";

export default function DashboardPage() {
  const { token, user } = useAuth();
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
      <DashboardHeader />
      <DashboardStats stats={stats} loading={loading} />
      <DashboardAlerts lowStockProducts={lowStockProducts} recentMovements={recentMovements} loading={loading} />
      <DashboardAnalytics stockMovementsTrend={stockMovementsTrend} stockByWarehouse={stockByWarehouse} user={user} />
      <DashboardUsers />
    </div>
  );
}


