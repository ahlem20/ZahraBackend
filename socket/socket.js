const { Server } = require("socket.io");
const couch = require("../config/connectToMongoDB");

const userSocketMap = {}; // Maps userId to socket.id

const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Adjust frontend origin if needed
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`🔌 User connected: ${userId} | Socket ID: ${socket.id}`);

    if (userId) {
      userSocketMap[userId] = socket.id;
      socket.join(userId);
    }

    // 👉 Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${userId}`);
      Object.keys(userSocketMap).forEach((key) => {
        if (userSocketMap[key] === socket.id) {
          delete userSocketMap[key];
        }
      });
    });

    // ✅ 1. Chat message
    socket.on("sendMessage", (data) => {
      const receiverSocket = getReceiverSocketId(data.receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("newMessage", data);
      }
    });

    // ✅ 2. WebRTC call signaling
    socket.on("call-user", ({ targetUserId, fromUserId, signal }) => {
      io.to(targetUserId).emit("incoming-call", { signal, from: fromUserId });
    });

    socket.on("answer-call", ({ to, signal }) => {
      io.to(to).emit("call-accepted", { signal });
    });

    socket.on("ice-candidate", ({ targetUserId, candidate, fromUserId }) => {
      io.to(targetUserId).emit("ice-candidate", {
        candidate,
        from: fromUserId,
      });
    });

    socket.on("end-call", ({ from, to, duration }) => {
      io.to(to).emit("call-ended");

      const callDoc = {
        _id: new Date().toISOString(),
        type: "call",
        from,
        to,
        duration,
        timestamp: new Date().toISOString(),
      };

      couch
        .post("morning_glory", callDoc)
        .then(() => console.log("📁 Call info saved"))
        .catch((err) => console.error("❌ Failed to save call log", err));
    });

    // ✅ 3. Real-time new session notification
    socket.on("new-session-created", ({ receiverId, session }) => {
      const receiverSocket = getReceiverSocketId(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("new-session", session);
        console.log(`📢 New session notification sent to ${receiverId}`);
      }
    });

    // ✅ 4. Optional: session reminder (if you want to trigger it from server)
    socket.on("session-reminder", ({ receiverId, message }) => {
      const receiverSocket = getReceiverSocketId(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("session-reminder", message);
      }
    });
  });
};

module.exports = { initializeSocket, getReceiverSocketId, io: () => io };
