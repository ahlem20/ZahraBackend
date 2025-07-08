require("dotenv").config();
const mongoose = require("mongoose");

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Test connection successful");
  } catch (e) {
    console.error("❌ Test connection failed:", e.message);
  } finally {
    mongoose.connection.close();
  }
};

test();
