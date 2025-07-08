const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");

const signup = async (req, res) => {
  try {
    const { username, email, password, gender, roles, description } = req.body;

    if (!username || !email || !password || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user_${uuidv4()}`;

    const imageFields = [
      "avatar",
      "idCardFront",
      "idCardBack",
      "holdingIdCard",
      "diploma",
    ];

    const imagePaths = {};

    for (const field of imageFields) {
      const file = req.files?.[field]?.[0];
      if (!file) continue;

      const ext = path.extname(file.originalname);
      const newFileName = `${userId}_${field}${ext}`;
      const newPath = path.resolve("uploads", newFileName);

      try {
        await fs.rename(file.path, newPath);
        imagePaths[field] = `/uploads/${newFileName}`;
      } catch (err) {
        console.error(`Error saving file for ${field}:`, err);
      }
    }

    const newUser = new User({
      _id: userId,
      username,
      email,
      password: hashedPassword,
      gender,
      roles: roles || "sick",
      description: description || "",
      createdAt: new Date(),
      active: false,
      ...imagePaths,
    });

    await newUser.save();

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res
      .status(201)
      .json({ id: newUser._id, username, email, roles: newUser.roles });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Signup error", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.active) {
      return res.status(403).json({ message: "Account is not activated yet" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      id: user._id,
      username: user.username,
      gender: user.gender,
      email: user.email,
      roles: user.roles,
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

const logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { signup, login, logout };
