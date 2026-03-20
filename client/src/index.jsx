import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketProvider";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <SocketProvider>
      <App />
    </SocketProvider>
  </AuthProvider>,
);
