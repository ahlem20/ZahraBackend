// models/Note.js
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    userId: {
      type: String, // change from ObjectId to String
      required: true,
    },
    conversationId: {
      type: String, // same here
    },
    receiverId: {
      type: String,
    },
    toAdmin: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "note",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
