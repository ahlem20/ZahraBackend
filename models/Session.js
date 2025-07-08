const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  requesterId: { type: String, required: true },
  receiverId: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  note: { type: String },
  price: { type: Number, required: true },
  isAccepted: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);
