import React, { useRef, useState, useEffect } from "react";
import { FaRegCircle, FaLinesLeaning } from "react-icons/fa6";
import { LuRectangleHorizontal, LuPencil } from "react-icons/lu";
import { IoIosUndo, IoIosRedo, IoIosColorPalette } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { FaUsers, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router";
import Whiteboard from "../../component/Canvas/index";
import ChatSidebar from "../../component/sidebar/index";

function Roompage({ user, socket }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const navigate = useNavigate();

  const [elements, setElements] = useState([]);
  const [tool, setTool] = React.useState("pencil");
  const [color, setColor] = React.useState("#000000");
  const [clear, setClear] = React.useState(false);
  const [history, setHistory] = useState([]);

  const [users, setUsers] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [canvasLoaded, setCanvasLoaded] = useState(false);

  // Chat sidebar state
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Users panel state
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  console.log(tool, color, clear);

  // ✅ Redirect to home if no user data (page refresh)
  useEffect(() => {
    if (!user) {
      console.log("🔄 No user data found, redirecting to home");
      navigate("/");
      return;
    }
  }, [user, navigate]);

  const handleClear = () => {
    setElements([]);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setClear(false);

    // ✅ Send clear event to other users
    if (socket && user?.roomid) {
      socket.emit("syncElements", { roomid: user.roomid, elements: [] });
    }
  };

  const handleUndo = () => {
    setHistory((prevHistory) => [
      ...prevHistory,
      elements[elements.length - 1],
    ]);
    const newElements = elements.slice(0, elements.length - 1);
    setElements(newElements);

    // ✅ Sync undo with other users
    if (socket && user?.roomid) {
      socket.emit("syncElements", { roomid: user.roomid, elements: newElements });
    }
  };

  const handleRedo = () => {
    if (history.length === 0) return;
    const newElements = [...elements, history[history.length - 1]];
    setElements(newElements);
    setHistory((prevHistory) => prevHistory.slice(0, prevHistory.length - 1));

    // ✅ Sync redo with other users
    if (socket && user?.roomid) {
      socket.emit("syncElements", { roomid: user.roomid, elements: newElements });
    }
  };

  // ✅ Fixed chat toggle handlers
  const handleChatToggle = () => {
    setIsChatOpen(prevState => !prevState);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  useEffect(() => {
    console.log("🔍 useEffect triggered - Socket:", !!socket, "User:", user);
    
    if (!socket || !user?.roomid) {
      console.log("❌ Missing socket or user data:", { socket: !!socket, user });
      return;
    }

    console.log("🚀 Setting up socket listeners for room:", user.roomid);

    // ✅ Initialize users list with current user
    setUsers([user]);
    setConnectedUsers(1);

    // ✅ Listen for initial canvas elements when joining
    const handleInitialElements = (initialElements) => {
      console.log("🎨 Received initial canvas elements:", initialElements);
      setElements(initialElements);
      setCanvasLoaded(true);
    };

    // ✅ Listen for real-time drawing from other users
    const handleDraw = (element) => {
      console.log("✏️ Received drawing from another user:", element);
      setElements(prevElements => [...prevElements, element]);
    };

    // ✅ Listen for canvas sync (undo/redo/clear from other users)
    const handleSyncElements = (syncedElements) => {
      console.log("🔄 Received synced elements:", syncedElements);
      setElements(syncedElements);
    };

    // ✅ Listen for initial user list when joining
    const handleUserIsJoined = (data) => {
      console.log("✅ Joined confirmed:", data);
      // Update users list if data contains user info
      if (data.users) {
        setUsers(data.users);
        setConnectedUsers(data.users.length);
      }
      // Set canvas as loaded when user joins successfully
      setCanvasLoaded(true);
    };

    // ✅ Listen for automatic user count updates
    const handleUserCountUpdate = (count) => {
      console.log("📊 User count auto-updated:", count);
      setConnectedUsers(count);
    };

    // ✅ Listen for automatic user list updates
    const handleUserListUpdate = (userList) => {
      console.log("📋 User list auto-updated:", userList);
      setUsers(userList);
      setConnectedUsers(userList.length);
    };

    // ✅ Listen for user join notifications
    const handleUserJoined = (data) => {
      console.log("🎉 User joined:", data);
      // Update user count and list if provided
      if (data.users) {
        setUsers(data.users);
        setConnectedUsers(data.users.length);
      } else if (data.userCount) {
        setConnectedUsers(data.userCount);
      } else {
        // Fallback - just increment count
        setConnectedUsers(prev => prev + 1);
      }
    };

    // ✅ Listen for user leave notifications
    const handleUserLeft = (data) => {
      console.log("👋 User left:", data);
      // Update user count and list if provided
      if (data.users) {
        setUsers(data.users);
        setConnectedUsers(data.users.length);
      } else if (data.userCount) {
        setConnectedUsers(data.userCount);
      } else {
        // Fallback - just decrement count
        setConnectedUsers(prev => Math.max(0, prev - 1));
      }
    };

    // ✅ Generic handler for any user list updates
    const handleAnyUserUpdate = (data) => {
      console.log("👥 Any user update:", data);
      if (data && typeof data === 'object') {
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          setConnectedUsers(data.users.length);
        } else if (data.userCount && typeof data.userCount === 'number') {
          setConnectedUsers(data.userCount);
        }
      }
    };

    // ✅ Attach event listeners
    socket.on("initialElements", handleInitialElements);
    socket.on("draw", handleDraw);
    socket.on("syncElements", handleSyncElements);
    socket.on("userIsJoined", handleUserIsJoined);
    socket.on("updateUserCount", handleUserCountUpdate);
    socket.on("updateUserList", handleUserListUpdate);
    socket.on("userJoinedNotification", handleUserJoined);
    socket.on("userLeftNotification", handleUserLeft);
    
    // ✅ Listen for any additional user-related events
    socket.on("userJoined", handleAnyUserUpdate);
    socket.on("userLeft", handleAnyUserUpdate);
    socket.on("roomUsers", handleAnyUserUpdate);
    socket.on("usersUpdate", handleAnyUserUpdate);

    // ✅ Initial connection check
    console.log("🔌 Socket connected:", socket.connected);
    console.log("🆔 Socket ID:", socket.id);

    // ✅ Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off("initialElements", handleInitialElements);
      socket.off("draw", handleDraw);
      socket.off("syncElements", handleSyncElements);
      socket.off("userIsJoined", handleUserIsJoined);
      socket.off("updateUserCount", handleUserCountUpdate);
      socket.off("updateUserList", handleUserListUpdate);
      socket.off("userJoinedNotification", handleUserJoined);
      socket.off("userLeftNotification", handleUserLeft);
      socket.off("userJoined", handleAnyUserUpdate);
      socket.off("userLeft", handleAnyUserUpdate);
      socket.off("roomUsers", handleAnyUserUpdate);
      socket.off("usersUpdate", handleAnyUserUpdate);
    };
  }, [socket, user]);

  // ✅ Debug logging
  console.log("🔍 Room ID:", user?.roomid);
  console.log("👤 Current user:", user);
  console.log("👥 Connected users:", connectedUsers);
  console.log("📝 Users list:", users);
  console.log("🎨 Canvas loaded:", canvasLoaded);
  console.log("🖼️ Elements count:", elements.length);

  // Don't render if no user data
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white min-w-screen to-purple-100 flex flex-col items-center py-8 px-4">
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={handleChatClose}
        socket={socket}
        user={user}
        users={users}
      />

      {/* Users Panel Overlay */}
      {isUsersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsUsersOpen(false)}
          />
          <div className="fixed top-4 right-4 bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 z-40 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Connected Users</h2>
              <button
                onClick={() => setIsUsersOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <p className="text-lg text-gray-700 font-semibold">
                {connectedUsers} {connectedUsers === 1 ? 'user' : 'users'} online
              </p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {users.length > 0 ? (
                users.map((u, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {u.name === user?.name ? `${u.name} (You)` : u.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {u.id === user?.id ? 'Room Host' : 'Participant'}
                      </p>
                    </div>
                    {u.name === user?.name && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        You
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <FaUsers className="mx-auto mb-2 text-2xl opacity-50" />
                  <p className="text-sm">
                    {socket?.connected ? "Loading users..." : "Connecting..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top Action Buttons */}
      <div className="fixed top-4 left-4 flex flex-col gap-2 z-20">
        {/* Chat Toggle Button */}
        <button
          onClick={handleChatToggle}
          className={`p-3 ${isChatOpen ? 'bg-blue-600' : 'bg-blue-500'} hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 transform ${isChatOpen ? 'scale-105' : 'scale-100'}`}
          title={isChatOpen ? "Close Chat" : "Open Chat"}
        >
          <FaComments size={20} />
          
        </button>

        {/* Users Toggle Button */}
        <button
          onClick={() => setIsUsersOpen(!isUsersOpen)}
          className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-colors relative"
          title="View Connected Users"
        >
          <FaUsers size={20} />
          {connectedUsers > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {connectedUsers}
            </span>
          )}
        </button>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-500 drop-shadow-lg">
          🎨 Welcome to the Drawing Room
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Room ID: <span className="font-mono font-semibold">{user?.roomid}</span>
        </p>
        {!canvasLoaded && (
          <p className="text-sm text-blue-500 mt-1">
            Loading existing drawings...
          </p>
        )}
      </div>

      {/* Canvas Status Indicator */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border z-10">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${canvasLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          <span className="text-sm font-medium">
            {canvasLoaded ? `Canvas Ready (${elements.length} elements)` : 'Loading canvas...'}
          </span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-2 flex flex-col md:flex-row md:justify-around items-center gap-6">
        {/* Tools */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          <ToolButton
            icon={<LuPencil />}
            selected={tool === "pencil"}
            onClick={() => setTool("pencil")}
          />
          <ToolButton
            icon={<LuRectangleHorizontal />}
            selected={tool === "rect"}
            onClick={() => setTool("rect")}
          />
          <ToolButton
            icon={<FaRegCircle />}
            selected={tool === "circle"}
            onClick={() => setTool("circle")}
          />
          <ToolButton
            icon={<FaLinesLeaning />}
            selected={tool === "line"}
            onClick={() => setTool("line")}
          />
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-3">
          <label htmlFor="color" className="text-3xl cursor-pointer">
            <IoIosColorPalette />
          </label>
          <input
            type="color"
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-full border shadow"
          />
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-4">
          <IconButton
            icon={<IoIosUndo />}
            disabled={elements.length === 0}
            onClick={handleUndo}
          />
          <IconButton
            icon={<IoIosRedo />}
            disabled={history.length < 1}
            onClick={handleRedo}
          />
        </div>

        {/* Clear Button */}
        <IconButton icon={<RxCross2 />} onClick={handleClear} />
      </div>

      {/* Whiteboard Canvas */}
      <div className="w-full max-w-7xl mt-10 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-black-200">
        <Whiteboard
          canvasRef={canvasRef}
          ctxRef={ctxRef}
          elements={elements}
          setElements={setElements}
          tool={tool}
          color={color}
          socket={socket}
          user={user}
        />
      </div>
    </div>
  );
}

const ToolButton = ({ icon, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl text-2xl transition-all ${
      selected ? "bg-gray-300 shadow-inner" : "bg-gray-100 hover:bg-gray-200"
    }`}
  >
    {icon}
  </button>
);

const IconButton = ({ icon, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-3 rounded-xl text-2xl transition-all ${
      disabled 
        ? "bg-gray-50 text-gray-300 cursor-not-allowed" 
        : "bg-gray-100 hover:bg-gray-200"
    }`}
  >
    {icon}
  </button>
);

export default Roompage;