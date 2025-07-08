const Note = require("../models/Note");
const mongoose = require("mongoose");

// @desc Get all notes
// @route GET /note
const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({ type: "note" });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error });
  }
};

// @desc Get notes by conversation ID
// @route GET /note/conversation/:conversationId
const getNotesByConversationId = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const notes = await Note.find({ type: "note", conversationId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error });
  }
};

// @desc Create a new note
// @route POST /note
const createNote = async (req, res) => {
  const { text, userId, conversationId, receiverId } = req.body;

  if (!text || !userId || (!conversationId && !receiverId)) {
    return res.status(400).json({
      message:
        "text, userId, and either conversationId or receiverId are required",
    });
  }

  try {
    const note = await Note.create({
      text,
      userId,
      conversationId,
      receiverId,
    });

    res.status(201).json({ message: "Note created", note });
  } catch (error) {
    res.status(500).json({ message: "Error creating note", error });
  }
};

// @desc Update a note
// @route PATCH /note/:id
const updateNote = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.text = text || note.text;
    note.updatedAt = new Date();
    await note.save();

    res.json({ message: "Note updated", note });
  } catch (error) {
    res.status(500).json({ message: "Error updating note", error });
  }
};

// @desc Delete a note
// @route DELETE /note/:id
const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Note.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: "Note not found" });

    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting note", error });
  }
};

// @desc Get notes by group ID
// @route GET /note/group/:groupId
const getNotesByGroupId = async (req, res) => {
  const { groupId } = req.params;

  if (!groupId) {
    return res.status(400).json({ message: "Group ID is required" });
  }

  try {
    const notes = await Note.find({ type: "note", groupId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching group notes", error });
  }
};

// @desc Create a note to admin
// @route POST /note/admin
const createNoteForAdmin = async (req, res) => {
  const { text, userId } = req.body;

  if (!text || !userId) {
    return res.status(400).json({ message: "Text and userId are required" });
  }

  try {
    const note = await Note.create({
      text,
      userId,
      toAdmin: true,
    });

    res.status(201).json({ message: "Admin note created", note });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin note", error });
  }
};

// @desc Get notes to admin
// @route GET /note/admin
const getAdminNotes = async (req, res) => {
  try {
    const notes = await Note.find({ type: "note", toAdmin: true });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin notes", error });
  }
};

module.exports = {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  getNotesByConversationId,
  getNotesByGroupId,
  createNoteForAdmin,
  getAdminNotes,
};
