import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const stockMovements = {
  listMyRequests: async (token) => {
    const response = await apiClient.get("/stock-movements/my-requests", {
      headers: { Authorization: "Bearer " + token },
    });
    return response.data;
  },

  cancelRequest: async (requestId, token) => {
    const response = await apiClient.delete("/stock-movements/my-requests/" + requestId, {
      headers: { Authorization: "Bearer " + token },
    });
    return response.data;
  },

  clearAllPendingRequests: async (token) => {
    const response = await apiClient.delete("/stock-movements/requests/clear-all", {
      headers: { Authorization: "Bearer " + token },
    });
    return response.data;
  },

  listRequests: async (token) => {
    const response = await apiClient.get("/stock-movements/requests", {
      headers: { Authorization: "Bearer " + token },
    });
    return response.data;
  },

  approveRequest: async (requestId, action, token, reason = null) => {
    const response = await apiClient.post(
      "/stock-movements/requests/" + requestId + "/approve",
      { action, reason },
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    return response.data;
  },
};

export const auth = {
  login: async (credentials) => {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    const response = await apiClient.post("/auth/login", params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  me: async (token) => {
    const response = await apiClient.get("/auth/me", {
      headers: { Authorization: "Bearer " + token },
    });
    return response.data;
  },
};

export const admin = {
  listUsers: async (token) => {
    const response = await apiClient.get("/admin/users", {
      headers: { Authorization: "Bearer " + token },
    });
    return response.data;
  },

  toggleRole: async (userId, token) => {
    const response = await apiClient.post(`/admin/users/${userId}/toggle_role`, {}, {
      headers: { Authorization: "Bearer " + token },
    });
    return response.data;
  },
};

export default apiClient;
