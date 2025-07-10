const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { addUser, removeUser, getUserList } = require("./utlis");

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    "http://localhost:5173", // for local dev
    "https://your-vercel-app.vercel.app" // deployed frontend
  ],
  methods: ["GET", "POST"],
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ In-memory storage for whiteboard elements
const roomElements = {};

io.on("connection", (socket) => {
  console.log("🧩 Socket connected:", socket.id);

  // ✅ Handle user joining a room
  socket.on("userJoined", (data) => {
    const { name, roomid } = data;

    console.log("📩 userJoined event received:", data);
    console.log("🆔 Socket ID:", socket.id);

    socket.join(roomid);
    console.log("🏠 User joined room:", roomid);

    // ✅ Register the user first
    const user = addUser({ id: socket.id, name, roomid });
    console.log("📝 User registered:", user);

    // ✅ Confirm join to the user who just joined
    socket.emit("userIsJoined", { success: true, user: data });
    console.log("✅ Sent userIsJoined confirmation");

    // ✅ Send current canvas to the newly joined user
    const existingElements = roomElements[roomid] || [];
    socket.emit("initialElements", existingElements);
    console.log(`📤 Sent ${existingElements.length} existing elements to new user`);

    // ✅ Get updated user list
    const userList = getUserList(roomid);
    console.log(`📊 Room ${roomid} now has ${userList.length} users:`, userList.map(u => u.name));

    // ✅ Notify everyone in the room (including the new user)
    io.to(roomid).emit("userJoinedNotification", `${name} joined the room`);

    // ✅ Send updated user list to ALL users in the room
    io.to(roomid).emit("updateUserCount", userList.length);
    io.to(roomid).emit("updateUserList", userList);
    
    console.log("📤 Sent user list updates to room");
  });

  // ✅ Handle explicit room joining (for whiteboard sync)
  socket.on("joinRoom", ({ roomId }) => {
    console.log(`🚪 User ${socket.id} explicitly joining room: ${roomId}`);
    
    socket.join(roomId);
    
    // ✅ Send existing elements to the user
    const existingElements = roomElements[roomId] || [];
    socket.emit("initialElements", existingElements);
    
    // ✅ Also send roomJoined confirmation
    socket.emit("roomJoined", { 
      roomId, 
      elements: existingElements,
      message: `Joined room ${roomId} with ${existingElements.length} existing elements`
    });
    
    console.log(`✅ Sent ${existingElements.length} elements to user joining room ${roomId}`);
  });

  // ✅ Handle whiteboard drawing
  socket.on("draw", ({ roomid, element }) => {
    console.log(`🎨 Drawing received for room ${roomid}:`, element.type);
    
    // ✅ Initialize room if it doesn't exist
    if (!roomElements[roomid]) {
      roomElements[roomid] = [];
    }
    
    // ✅ Add element to room storage
    roomElements[roomid].push(element);
    
    console.log(`📊 Room ${roomid} now has ${roomElements[roomid].length} total elements`);

    // ✅ Broadcast to others in the room (not the sender)
    socket.to(roomid).emit("draw", element);
    
    console.log(`📤 Broadcasted drawing to other users in room ${roomid}`);
  });

  // ✅ Handle canvas sync (undo/redo/clear)
  socket.on("syncElements", ({ roomid, elements }) => {
    console.log(`🔄 Syncing ${elements.length} elements for room ${roomid}`);
    
    // ✅ Update room storage with new elements array
    roomElements[roomid] = elements;
    
    // ✅ Broadcast to all others in the room
    socket.to(roomid).emit("syncElements", elements);
    
    console.log(`📤 Synced canvas state to all users in room ${roomid}`);
  });

  // ✅ Handle clear canvas
  socket.on("clearCanvas", ({ roomid }) => {
    console.log(`🧹 Clearing canvas for room ${roomid}`);
    
    // ✅ Clear room storage
    roomElements[roomid] = [];
    
    // ✅ Broadcast clear to all users in the room
    io.to(roomid).emit("canvasCleared");
    
    console.log(`📤 Canvas cleared for all users in room ${roomid}`);
  });

  // ✅ Handle get current elements (backup method)
  socket.on("getCurrentElements", ({ roomid }) => {
    console.log(`📋 User ${socket.id} requested current elements for room ${roomid}`);
    
    const elements = roomElements[roomid] || [];
    socket.emit("currentElements", elements);
    
    console.log(`📤 Sent ${elements.length} current elements to user`);
  });

  // ✅ Handle chat messages
  socket.on("sendMessage", (messageData) => {
    console.log(`💬 Message received for room ${messageData.roomId}:`, messageData.message);
    
    // ✅ Broadcast message to all users in the room (including sender for confirmation)
    io.to(messageData.roomId).emit("newMessage", messageData);
    
    console.log(`📤 Broadcasted message to all users in room ${messageData.roomId}`);
  });

  // ✅ When client asks for current user list (manual fetch)
  socket.on("getUsers", (roomid) => {
    console.log(`🔍 Client ${socket.id} requested users for room ${roomid}`);
    const users = getUserList(roomid);
    console.log(`📤 Sending ${users.length} users to client:`, users.map(u => u.name));
    socket.emit("users", users);
  });

  // ✅ Handle disconnection
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);

    const user = removeUser(socket.id);
    if (user) {
      const { name, roomid } = user;
      console.log(`👋 User ${name} left room ${roomid}`);

      // ✅ Notify remaining users
      socket.to(roomid).emit("userLeftNotification", `${name} left the room`);

      // ✅ Send updated user list to remaining users
      const userList = getUserList(roomid);
      io.to(roomid).emit("updateUserCount", userList.length);
      io.to(roomid).emit("updateUserList", userList);
      
      console.log(`📊 Room ${roomid} now has ${userList.length} users:`, userList.map(u => u.name));
    }
  });

  // ✅ Handle errors
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

// ✅ Cleanup empty rooms periodically (optional)
setInterval(() => {
  Object.keys(roomElements).forEach(roomId => {
    const userList = getUserList(roomId);
    if (userList.length === 0) {
      console.log(`🧹 Cleaning up empty room: ${roomId}`);
      delete roomElements[roomId];
    }
  });
}, 60000); // Check every minute

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});