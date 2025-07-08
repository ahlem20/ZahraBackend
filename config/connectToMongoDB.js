const mongoose = require("mongoose");

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectToMongoDB;
