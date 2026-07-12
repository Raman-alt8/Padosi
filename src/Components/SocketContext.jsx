// SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);

const SocketContext = createContext(null);

// Wraps the tree (mounted in App.jsx, same pattern as WishlistProvider) so
// any component anywhere can call useSocket() and get the same live
// connection. Only connects once someone is actually logged in, and tears
// the connection down again on logout.
export function SocketProvider({ currentUser, children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    const s = io(SOCKET_URL, { withCredentials: true }); // sends the session cookie
    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}