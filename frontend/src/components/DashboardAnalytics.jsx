import React from "react";
import { Card } from "./ui/Card.tsx";
import { BarChart3, TrendingUp } from "lucide-react";
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

export default function DashboardAnalytics({ stockMovementsTrend, stockByWarehouse, user }) {
  // For warehouse owners, transform stockMovementsTrend to have user lines
  const processedTrend = user?.role === "warehouse_owner"
    ? processOwnerTrend(stockMovementsTrend)
    : stockMovementsTrend.map(item => ({ month: item.month, total_quantity: item.total_quantity }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stock Movements Trend Line Chart */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {user?.role === "warehouse_owner" ? "Stock Movements by User" : "Stock Movements Trend"}
            </h2>
          </div>
        </Card.Header>
        <Card.Body>
          {processedTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={processedTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {user?.role === "warehouse_owner" ? (
                  // For owners, render multiple lines for each user
                  getUniqueUsers(processedTrend).map((username, index) => (
                    <Line
                      key={username}
                      type="monotone"
                      dataKey={username}
                      stroke={getColor(index)}
                      name={username}
                    />
                  ))
                ) : (
                  <Line type="monotone" dataKey="total_quantity" stroke="#3B82F6" />
                )}
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
  );
}

function processOwnerTrend(trend) {
  // trend is array of {month, users: [{username, quantity}]}
  const monthMap = {};
  trend.forEach(item => {
    monthMap[item.month] = {};
    item.users.forEach(user => {
      monthMap[item.month][user.username] = user.quantity;
    });
  });

  // Convert to array with months and user quantities
  const result = [];
  Object.keys(monthMap).sort().forEach(month => {
    const data = { month };
    Object.assign(data, monthMap[month]);
    result.push(data);
  });

  return result;
}

function getUniqueUsers(data) {
  const users = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'month') users.add(key);
    });
  });
  return Array.from(users);
}

function getColor(index) {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  return colors[index % colors.length];
}
