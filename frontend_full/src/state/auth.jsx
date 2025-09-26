
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../api/apiClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userData = await auth.me(token);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setError(error.message || 'Failed to fetch user data');
      setUser(null);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await auth.login(credentials);
      if (!data.access_token) {
        throw new Error('No access token received');
      }
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      await fetchUser(); // Fetch user data immediately after login
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      loading, 
      error,
      login, 
      logout,
      refreshUser: fetchUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = ()=> useContext(AuthContext);
