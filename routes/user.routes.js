// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, updateUser} = require("../controllers/user.controllers");

router.get("/", getAllUsers);
router.get("/:id", getUserById);

// PATCH /users/:id → set active to true
router.patch("/:id", updateUser);

module.exports = router;
