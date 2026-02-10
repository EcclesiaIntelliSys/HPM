import React, { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

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
      } else {
        // Auto logout when token expires
        const timeout = expiryTime - now;
        const timer = setTimeout(() => logout(), timeout);
        return () => clearTimeout(timer);
      }
    } catch {
      logout();
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.href = "/creatives"; // redirect to login
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
