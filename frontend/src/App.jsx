import React from "react";
import Forms from "./component/form/index.jsx";
import { Routes, Route, useNavigate } from "react-router";
import Roompage from "./pages/Room/index.jsx";
import io from "socket.io-client";
import { useEffect } from "react";

const server = "http://localhost:5000";
const connectionOption = {
  "force new connection": true,
  reconnectionAttempt: "infinite",
  timeout: 10000,
  transport: ["websocket"],
};

let socket;

const App = () => {
  const [user, setUser] = React.useState(null);
  const [socketConnected, setSocketConnected] = React.useState(false);
  const navigate = useNavigate();

  // ✅ Check for user data on refresh and redirect if not found
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // If user is on a room page (not home) but has no user data, redirect to home
    if (currentPath !== "/" && !user) {
      console.log("🔄 User data not found, redirecting to home page");
      navigate("/");
    }
  }, [user, navigate]);

  // Initialize socket connection
  useEffect(() => {
    console.log("🔌 Initializing socket connection...");
    
    socket = io.connect(server, connectionOption);

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setSocketConnected(false);
    });

    socket.on("userIsJoined", (data) => {
      console.log("🎉 User joined confirmation:", data);
      if (data.success) {
        console.log("✅ User joined successfully");
      } else {
        console.log("❌ User join failed:", data);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("🚨 Socket connection error:", error);
    });

    return () => {
      console.log("🧹 Cleaning up socket connection");
      socket.disconnect();
    };
  }, []);

  // Debug user state changes
  useEffect(() => {
    console.log("👤 User state changed:", user);
  }, [user]);

  const uuid = () => {
    var S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (
      S4() +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      S4() +
      S4()
    );
  };

  return (
    <div className="container">
      {/* Debug info */}
      <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs z-50">
        Socket: {socketConnected ? "✅ Connected" : "❌ Disconnected"} | 
        User: {user ? "✅ Set" : "❌ Not Set"}
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <Forms 
              uuid={uuid} 
              socket={socket} 
              setUser={setUser}
            />
          }
        />
        <Route 
          path="/:roomId" 
          element={
            <Roompage 
              user={user} 
              socket={socket} 
            />
          } 
        />
      </Routes>
    </div>
  );
};

export default App;