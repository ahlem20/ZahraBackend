const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // user_xxx
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  roles: { type: String, default: "sick" },
  description: { type: String, default: "" },
  avatar: { type: String },
  idCardFront: { type: String },
  idCardBack: { type: String },
  holdingIdCard: { type: String },
  diploma: { type: String },
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model("User", userSchema);
