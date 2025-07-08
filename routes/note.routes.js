const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controllers");

router.get("/", noteController.getAllNotes);
router.get(
  "/conversation/:conversationId",
  noteController.getNotesByConversationId
);
router.get("/group/:groupId", noteController.getNotesByGroupId);
router.get("/admin", noteController.getAdminNotes);

router.post("/", noteController.createNote);
router.post("/admin", noteController.createNoteForAdmin);

router.patch("/:id", noteController.updateNote);
router.delete("/:id", noteController.deleteNote);

module.exports = router;
