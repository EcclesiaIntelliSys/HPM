import React, { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // =========================
  // 1. RESTORE AUTH HEADER
  // =========================
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // =========================
  // 2. REQUEST INTERCEPTOR (SAFETY NET)
  // =========================
  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }

      return config;
    });

    return () => {
      api.interceptors.request.eject(reqInterceptor);
    };
  }, []);

  // =========================
  // 3. RESPONSE INTERCEPTOR (REFRESH LOGIC)
  // =========================
  useEffect(() => {
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes("/api/auth/refresh") &&
          !refreshing
        ) {
          originalRequest._retry = true;
          setRefreshing(true);

          try {
            const res = await api.get("/api/auth/refresh");
            const newToken = res.data.token;

            login(newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            setRefreshing(false);
            return api(originalRequest);
          } catch (refreshErr) {
            console.error("Refresh failed:", refreshErr.message);
            setRefreshing(false);
            logout();
            return Promise.reject(refreshErr);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(resInterceptor);
    };
  }, [refreshing]);

  // =========================
  // 4. TOKEN DECODE + AUTO REFRESH TIMER
  // =========================
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);

      setUser({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      });

      const expiryTime = decoded.exp * 1000;
      const now = Date.now();

      if (now >= expiryTime) {
        logout();
        return;
      }

      let refreshTime = expiryTime - now - 60 * 1000;
      if (refreshTime <= 0) refreshTime = expiryTime - now - 5000;

      const timer = setTimeout(async () => {
        try {
          const res = await api.get("/api/auth/refresh");
          const newToken = res.data.token;
          login(newToken);
        } catch (err) {
          logout();
        }
      }, refreshTime);

      return () => clearTimeout(timer);
    } catch (err) {
      logout();
    }
  }, [token]);

  // =========================
  // 5. LOGIN
  // =========================
  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  // =========================
  // 6. LOGOUT
  // =========================
  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }

    localStorage.removeItem("token");
    setToken(null);
    setUser(null);

    delete api.defaults.headers.common["Authorization"];

    window.location.href = "/creatives";
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}
