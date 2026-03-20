import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

const API_BASE = process.env.REACT_APP_API_URL;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!API_BASE) {
      console.error("Socket API_BASE missing");
      return;
    }

    const newSocket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket"],
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  if (!socket) return children;

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
