import { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";
import { AuthContext } from "./AuthContext";

const API_BASE = process.env.REACT_APP_API_URL;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token } = useContext(AuthContext);

  // Decode username from token
  let username = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      username = payload.username;
    } catch {
      username = null;
    }
  }

  useEffect(() => {
    if (!API_BASE || !username) return;

    const newSocket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket"],
    });

    // Join per-user room once connected
    newSocket.on("connect", () => {
      newSocket.emit("joinUserRoom", username);
      // console.log("Socket connected and joined room:", username);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  if (!socket) return children;

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
