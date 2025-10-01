import React, { useState, useEffect } from "react";
import { useAuth } from "../state/auth";
import { auth, dashboard } from "../api/apiClient";
import { Button } from "../components/ui/Button.tsx";
import { Card } from "../components/ui/Card.tsx";

export default function ProfilePage() {
  const { token, user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", location: "" });
  const [passwordData, setPasswordData] = useState({ old_password: "", new_password: "" });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, statsData] = await Promise.all([
          auth.me(token),
          dashboard.stats(token)
        ]);
        setProfile(profileData);
        setStats(statsData);
        setFormData({ username: profileData.username, email: profileData.email, location: profileData.location || "" });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError("");
    try {
      const updatedProfile = await auth.update(formData, token);
      setProfile(updatedProfile);
      setEditMode(false);
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = "Failed to update profile";

      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          // Handle Pydantic validation errors
          const validationErrors = errorData.detail.map(error => error.msg || error.message).join(", ");
          errorMessage = validationErrors;
        } else if (typeof errorData.detail === 'string') {
          try {
            const parsedDetail = JSON.parse(errorData.detail);
            if (Array.isArray(parsedDetail)) {
              const validationErrors = parsedDetail.map(error => error.msg || error.message).join(", ");
              errorMessage = validationErrors;
            } else {
              errorMessage = parsedDetail.msg || parsedDetail.message || errorData.detail;
            }
          } catch {
            errorMessage = errorData.detail;
          }
        } else {
          errorMessage = errorData.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setUpdateError(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError("");
    try {
      await auth.changePassword(passwordData, token);
      setChangePasswordMode(false);
      setPasswordData({ old_password: "", new_password: "" });
      alert("Password changed successfully!");
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = "Failed to change password";

      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          // Handle Pydantic validation errors
          const validationErrors = errorData.detail.map(error => error.msg || error.message).join(", ");
          errorMessage = validationErrors;
        } else if (typeof errorData.detail === 'string') {
          try {
            const parsedDetail = JSON.parse(errorData.detail);
            if (Array.isArray(parsedDetail)) {
              const validationErrors = parsedDetail.map(error => error.msg || error.message).join(", ");
              errorMessage = validationErrors;
            } else {
              errorMessage = parsedDetail.msg || parsedDetail.message || errorData.detail;
            }
          } catch {
            errorMessage = errorData.detail;
          }
        } else {
          errorMessage = errorData.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setUpdateError(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
            <div className="space-x-2">
              <Button onClick={() => setEditMode(!editMode)} variant="outline">
                {editMode ? "Cancel Edit" : "Edit Profile"}
              </Button>
              <Button onClick={handleLogout} variant="outline" className="text-red-600">
                Logout
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {profile ? (
            <div className="space-y-4">
              {editMode ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {updateError && <p className="text-red-600 text-sm">{updateError}</p>}
                  <Button type="submit" disabled={updateLoading}>
                    {updateLoading ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <p className="text-lg text-gray-900">{profile.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-lg text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <p className="text-lg text-gray-900">
                      {profile.role === 'admin' ? 'Admin' : profile.role === 'warehouse_owner' ? 'Warehouse Owner' : 'User'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-lg text-gray-900">{profile.location || "Not set"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
                    <p className="text-lg text-gray-900">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No profile data available.</p>
          )}
        </Card.Body>
      </Card>

      {/* Change Password Card */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
            <Button onClick={() => setChangePasswordMode(!changePasswordMode)} variant="outline">
              {changePasswordMode ? "Cancel" : "Change Password"}
            </Button>
          </div>
        </Card.Header>

        {changePasswordMode && (
          <Card.Body>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {updateError && <p className="text-red-600 text-sm">{updateError}</p>}
              <Button type="submit" disabled={updateLoading}>
                {updateLoading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </Card.Body>
        )}
      </Card>

      {/* Statistics Card */}
      {stats && (
        <Card>
          <Card.Header>
            <h2 className="text-xl font-bold text-gray-800">Your Statistics</h2>
          </Card.Header>
          <Card.Body>
            <div className={`grid grid-cols-1 ${user?.role !== 'user' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total_products}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              {user?.role !== 'user' && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.total_warehouses}</div>
                  <div className="text-sm text-gray-600">Total Warehouses</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.total_stock}</div>
                <div className="text-sm text-gray-600">Total Stock</div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
