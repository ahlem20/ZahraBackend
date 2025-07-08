const User = require("../models/User");

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude password
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// GET user by ID
const getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// UPDATE user: set `active: true`
const updateUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        active: true,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-password"); // Exclude password

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user error:", err.message);
    res
      .status(500)
      .json({ message: "Failed to update user", error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
};
