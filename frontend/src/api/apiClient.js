import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for error handling
api.interceptors.request.use(
  (config) => {
    // Log request (in development)
    if (import.meta.env.DEV) {
      console.log("API Request:", config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // TODO: Implement token refresh logic here if needed
      return Promise.reject(error);
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error("Server Error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

// Helper: convert object → form-urlencoded
function toFormData(obj) {
  const formData = new URLSearchParams();
  for (const key in obj) {
    formData.append(key, obj[key]);
  }
  return formData;
}

// Helper: auth headers
function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// --- Auth ---
export const auth = {
  login: async ({ username, password }) => {
    try {
      const response = await api.post(
        "/auth/login",
        toFormData({ username, password }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      throw error;
    }
  },

  register: async ({ username, email, password }) => {
    try {
      const response = await api.post(
        "/auth/register",
        { username, email, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Registration failed:", error.response?.data || error.message);
      throw error;
    }
  },

  me: async (token) => {
    try {
      const response = await api.get("/auth/me", {
        headers: authHeader(token),
      });
      return response.data;
    } catch (error) {
      console.error("Profile fetch failed:", error.response?.data || error.message);
      throw error;
    }
  },

  update: async (data, token) => {
    try {
      const response = await api.put("/auth/me", data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Profile update failed:", error.response?.data || error.message);
      throw error;
    }
  },

  changePassword: async (data, token) => {
    try {
      const response = await api.post("/auth/change-password", data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Password change failed:", error.response?.data || error.message);
      throw error;
    }
  },
};

// --- Stock Movements ---
export const stockMovements = {
  list: async (token) => {
    try {
      const response = await api.get("/stock-movements", {
        headers: authHeader(token),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch stock movements:", error.response?.data || error.message);
      throw error;
    }
  },

  create: async (data, token) => {
    try {
      const response = await api.post("/stock-movements", data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create stock movement:", error.response?.data || error.message);
      throw error;
    }
  },

  transfer: async (data, token) => {
    try {
      const response = await api.post("/stock-movements/transfers", data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to transfer stock:", error.response?.data || error.message);
      throw error;
    }
  },

  getStockDistribution: async (productId, token) => {
    try {
      const response = await api.get(`/stock-movements/stock/${productId}`, { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch stock distribution');
    }
  },
};

// --- Products ---
export const products = {
  list: async (params, token) => {
    try {
      const response = await api.get("/products", {
        headers: authHeader(token),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch products:", error.response?.data || error.message);
      throw error;
    }
  },

  create: async (data, token) => {
    try {
      const response = await api.post("/products", data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create product:", error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data, token) => {
    try {
      const response = await api.put(`/products/${id}`, data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to update product:", error.response?.data || error.message);
      throw error;
    }
  },

  remove: async (id, token) => {
    try {
      const response = await api.delete(`/products/${id}`, {
        headers: authHeader(token),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to delete product:", error.response?.data || error.message);
      throw error;
    }
  },
};

// --- Warehouses ---
export const warehouses = {
  list: async (token) => {
    try {
      const response = await api.get("/warehouses", {
        headers: authHeader(token),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch warehouses:", error.response?.data || error.message);
      throw error;
    }
  },

  create: async (data, token) => {
    try {
      const response = await api.post("/warehouses", data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create warehouse:", error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data, token) => {
    try {
      const response = await api.put(`/warehouses/${id}`, data, {
        headers: { ...authHeader(token), "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to update warehouse:", error.response?.data || error.message);
      throw error;
    }
  },

  remove: async (id, token) => {
    try {
      const response = await api.delete(`/warehouses/${id}`, {
        headers: authHeader(token),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to delete warehouse:", error.response?.data || error.message);
      throw error;
    }
  },
};

// --- Dashboard ---
export const dashboard = {
  stats: async (token) => {
    try {
      const response = await api.get("/dashboard/stats", {
        headers: authHeader(token),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error.response?.data || error.message);
      throw error;
    }
  },
};
