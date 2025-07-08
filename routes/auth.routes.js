const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { signup, login, logout } = require("../controllers/auth.controllers");

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, `user_temp_${file.fieldname}_${unique}`);
  },
});
const upload = multer({ storage });

router.post(
  "/signup",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "idCardFront", maxCount: 1 },
    { name: "idCardBack", maxCount: 1 },
    { name: "holdingIdCard", maxCount: 1 },
    { name: "diploma", maxCount: 1 }, // ✅ Add this
  ]),
  signup
);

router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
