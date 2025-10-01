import React from "react";
import { Package, Warehouse, AlertCircle } from "lucide-react";

export default function DashboardStats({ stats, loading }) {
  return (
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
  );
}

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
