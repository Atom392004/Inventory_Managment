import React from "react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📊 Stock Movement Anomaly Detection</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-lg">
          Train a model to detect unusual stock movement patterns (e.g., sudden spikes in transfers or sales).
        </p>
        <p className="text-lg mt-4">
          Mark suspicious movements in the ledger.
        </p>
        {/* Placeholder for future implementation */}
        <div className="mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-medium">
            Train Model
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Feature under development.
          </p>
        </div>
      </div>
    </div>
  );
}
