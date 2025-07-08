const express = require("express");
const router = express.Router();
const {
  createSession,
  getAcceptedSessions,
  getPendingSessions,
  acceptSession,
  removeSession,
} = require("../controllers/session.controllers");

router.post("/", createSession);
router.get("/accepted/:id", getAcceptedSessions);
router.get("/pending/:id", getPendingSessions);
router.patch("/accept/:id", acceptSession);
router.delete("/:id", removeSession); // ✅ add delete route

module.exports = router;
