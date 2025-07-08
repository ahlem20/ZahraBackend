const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  sendAudioMessage,
  sendMessage,
  getMessages,
  deleteAllMessages,
  deleteMessage,
  getMessagesByConversation,
  getAudioMessages,
  sendImageMessage,
  getImageMessages,
  getMessagesByUser,
  getMessagesByGroupId,
} = require("../controllers/message.controllers");

// Audio storage config
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "audio-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Image storage config
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "image-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Separate upload instances
const uploadAudio = multer({ storage: audioStorage });
const uploadImage = multer({ storage: imageStorage });

router.post("/send", sendMessage);
router.get("/conversation/:user1/:user2", getMessages);
router.delete("/", deleteAllMessages);
router.delete("/message/:id", deleteMessage);

// Use correct upload for each type
router.post("/send-audio", uploadAudio.single("audio"), sendAudioMessage);
router.post("/send-image", uploadImage.single("image"), sendImageMessage);

router.get("/conversation/:userId/:receiverId", getMessagesByConversation);
router.get("/messages/audio/:senderId/:receiverId", getAudioMessages);
router.get("/messages/image/:senderId/:receiverId", getImageMessages);

// ✅ المسار الجديد
router.get("/messages/user/:userId", getMessagesByUser);

router.get("/messages/group/:groupId", getMessagesByGroupId);

module.exports = router;
