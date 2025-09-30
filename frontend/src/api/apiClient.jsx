import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Create axios instance with error handling
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  // Add retry logic
  retry: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // time interval between retries
  },
  // Handle slow connections
  timeoutErrorMessage: 'Request took too long to complete. Please check your connection.'
});

// Add request logging
api.interceptors.request.use(request => {
  console.log('Starting Request:', request.method, request.url, request.data);
  // Ensure proper content type for form data
  if (request.data instanceof URLSearchParams) {
    request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  return request;
});

// Add response logging
api.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

function toFormData(obj) {
  const formData = new URLSearchParams();
  for (const key in obj) {
    formData.append(key, obj[key]);
  }
  return formData;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export const auth = {
  login: async ({ username, password }) => {
    try {
      // First check if the server is available
      try {
        const healthCheck = await api.get('/', { timeout: 3000 });
        console.log('Server health check:', healthCheck.data);
      } catch (error) {
        console.error('Health check failed:', error);
        throw new Error('Server is not responding. Please make sure the backend is running.');
      }

      console.log('Attempting login for username:', username);
      const formData = toFormData({ username, password });

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        withCredentials: true,
        timeout: 5000
      });

      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid response from server');
      }

      console.log('Login successful');
      return response.data;
    } catch (error) {
      console.error('Login error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timed out. Please try again.');
      }

      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }

      if (error.response.status === 401) {
        throw new Error('Invalid username or password');
      }

      throw new Error(error.response?.data?.detail || 'Login failed. Please try again.');
    }
  },

  register: async ({ username, email, password, role }) => {
    try {
      // First check if the server is available
      try {
        await api.get('/', { timeout: 3000 });
      } catch (error) {
        throw new Error('Server is not responding. Please make sure the backend is running.');
      }

      console.log('Attempting registration for:', { username, email, role });
      const response = await api.post('/auth/register',
        JSON.stringify({ username, email, password, role }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timed out. Please try again.');
      }

      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }

      if (error.response.status === 400) {
        throw new Error(error.response.data.detail || 'Username or email already exists');
      }

      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  me: async (token) => {
    try {
      console.log('Fetching user profile');
      const response = await api.get('/auth/me', { headers: authHeader(token) });
      console.log('Profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Profile fetch error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to fetch profile');
    }
  }
};

export const stockMovements = {
  list: async (token) => {
    try {
      const response = await api.get('/stock-movements', { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch stock movements');
    }
  },

  create: async (data, token) => {
    try {
      const response = await api.post('/stock-movements', data, {
        headers: { ...authHeader(token), 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create stock movement');
    }
  },

  transfer: async (data, token) => {
    try {
      const response = await api.post('/stock-movements/transfers', data, {
        headers: { ...authHeader(token), 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create stock transfer');
    }
  },

  getStockDistribution: async (productId, token) => {
    try {
      const response = await api.get(`/stock-movements/stock/${productId}`, { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch stock distribution');
    }
  }
};

export const products = {
  list: async (params, token) => {
    try {
      const response = await api.get('/products', { headers: authHeader(token), params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch products');
    }
  },

  create: async (data, token) => {
    try {
      const response = await api.post('/products', data, {
        headers: { ...authHeader(token), 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create product');
    }
  },

  update: async (id, data, token) => {
    try {
      const response = await api.put(`/products/${id}`, data, {
        headers: { ...authHeader(token), 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update product');
    }
  },

  remove: async (id, token) => {
    try {
      const response = await api.delete(`/products/${id}`, { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete product');
    }
  }
};

export const warehouses = {
  list: async (token, params = {}) => {
    try {
      const response = await api.get('/warehouses', { headers: authHeader(token), params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch warehouses');
    }
  },

  create: async (data, token) => {
    try {
      const response = await api.post('/warehouses', data, {
        headers: { ...authHeader(token), 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create warehouse');
    }
  },

  update: async (id, data, token) => {
    try {
      const response = await api.put(`/warehouses/${id}`, data, {
        headers: { ...authHeader(token), 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update warehouse');
    }
  },

  remove: async (id, token) => {
    try {
      const response = await api.delete(`/warehouses/${id}`, { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete warehouse');
    }
  },

  details: async (id, token) => {
    try {
      const response = await api.get(`/warehouses/${id}/details`, { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch warehouse details');
    }
  },

  toggleAvailability: async (id, token) => {
    try {
      const response = await api.patch(`/warehouses/${id}/availability`, {}, { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to toggle warehouse availability');
    }
  }
};

export const dashboard = {
  stats: async (token) => {
    try {
      const response = await api.get('/dashboard/stats', { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard stats');
    }
  },

  userAnalytics: async (token) => {
    try {
      const response = await api.get('/dashboard/user-analytics', { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch user analytics');
    }
  }
};

export const scrapedProducts = {
  list: async (token) => {
    try {
      const response = await api.get('/scraped-products', { headers: authHeader(token) });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch scraped products');
    }
  }
};
