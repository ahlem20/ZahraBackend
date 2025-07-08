const dotenv = require("dotenv");
dotenv.config();
const Message = require('./models/Message'); // عدل المسار حسب ملفك

const express = require("express");
const path = require("path");
const http = require("http");
const mongoose = require("mongoose");
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectToMongoDB = require("./config/connectToMongoDB");
const { initializeSocket } = require("./socket/socket");

const PORT = process.env.PORT || 3500;
const app = express();
const server = http.createServer(app);

// Log Mongo connection state
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// Middlewares
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", express.static(path.join(__dirname, "public")));

// Routes
app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/auth.routes"));
app.use("/users", require("./routes/user.routes"));
app.use("/session", require("./routes/session.routes"));
app.use("/message", require("./routes/message.routes"));
app.use("/note", require("./routes/note.routes"));
app.use("/wallet", require("./routes/wallet.routes"));
app.use("/groups", require("./routes/group.routes"));
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    console.error(error); // 👈 هذا مهم جدًا
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Test DB connection route
app.get("/test-db", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        status: "error",
        message: "MongoDB is not connected",
        error: "Connection not ready",
      });
    }

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    res.status(200).json({
      status: "success",
      message: "MongoDB is connected",
      collections: collections.map((c) => c.name),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "MongoDB connection test failed",
      error: error.message,
    });
  }
});

// 404 and error handlers
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

// 🟢 Connect to MongoDB, then start server
connectToMongoDB()
  .then(() => {
    initializeSocket(server);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server due to DB error:", err.message);
  });
  
  