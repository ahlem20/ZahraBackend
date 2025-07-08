const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String, // ✅ Change this from ObjectId
    required: true,
  },
  receiverId: {
    type: String, // ✅ Change this from ObjectId
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ["text", "image", "audio", "message"],
    default: "text",
  },
  imageUrl: String,
  audioUrl: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);
