import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import api from "../api/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  // ✅ Interceptor for reactive refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url.includes("/api/auth/refresh")
      ) {
        originalRequest._retry = true;
        console.log(
          `[${new Date().toISOString()}] Access token expired. Attempting refresh...`,
        );

        try {
          const res = await api.get("/api/auth/refresh");
          const newToken = res.data.token;

          login(newToken);
          console.log(
            `[${new Date().toISOString()}] Refresh succeeded. New token issued.`,
          );

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          console.error(
            `[${new Date().toISOString()}] Silent refresh failed:`,
            refreshErr.message,
          );
          logout();
          return Promise.reject(refreshErr); // ⬅️ important
        }
      }

      return Promise.reject(error);
    },
  );

  // ✅ Decode user info + proactive refresh timer
  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      });
      const expiryTime = decoded.exp * 1000; // ms
      const now = Date.now();
      if (now >= expiryTime) {
        console.log(
          `[${new Date().toISOString()}] Token already expired. Logging out.`,
        );
        logout();
      } else {
        // Try to refresh 1 minute before expiry
        let refreshTime = expiryTime - now - 60 * 1000; // Fallback: if lifespan < 1m, refresh 5s before expiry
        if (refreshTime <= 0) {
          refreshTime = expiryTime - now - 5000;
        }
        console.log(
          `[${new Date().toISOString()}] Proactive refresh scheduled in ${Math.round(refreshTime / 1000)} seconds.`,
        );
        const timer = setTimeout(async () => {
          console.log(
            `[${new Date().toISOString()}] Proactive refresh triggered.`,
          );
          try {
            const res = await api.get("/api/auth/refresh");
            const newToken = res.data.token;
            login(newToken);
            console.log(
              `[${new Date().toISOString()}] Proactive refresh succeeded. New token issued.`,
            );
          } catch (err) {
            console.error(
              `[${new Date().toISOString()}] Proactive refresh failed:`,
              err.message,
            );
            logout();
          }
        }, refreshTime);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] Token decode failed:`,
        err.message,
      );
      logout();
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout"); // backend clears refreshToken cookie
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.href = "/creatives"; // redirect to login
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}
