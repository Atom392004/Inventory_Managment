import React, { useState } from "react";
import { geocodeLocation } from "../utils/geocoding";

function WarehouseForm({ onSubmit, initial, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [isAvailable, setIsAvailable] = useState(initial?.is_available !== undefined ? initial.is_available : true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGeocoding(true);
    setLocationError("");
    let latitude = null;
    let longitude = null;
    try {
      const coords = await geocodeLocation(location);
      latitude = coords.latitude;
      longitude = coords.longitude;
    } catch (error) {
      setLocationError("Failed to geocode location. Using existing coordinates or none.");
      if (initial) {
        latitude = initial.latitude;
        longitude = initial.longitude;
      }
    } finally {
      setIsGeocoding(false);
    }
    onSubmit({
      name,
      location,
      is_available: isAvailable,
      latitude,
      longitude
    });
  };

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{initial ? "Edit Warehouse" : "Create Warehouse"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter city, address, or location"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAvailable"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
            Available to users
          </label>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={isGeocoding}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isGeocoding}
          >
            {isGeocoding ? "Geocoding..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WarehouseForm;
