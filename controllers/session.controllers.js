const Session = require("../models/Session");
const Wallet = require("../models/Wallet");

// Create Session
const createSession = async (req, res) => {
  const { requesterId, receiverId, date, time, note, price } = req.body;

  if (!requesterId || !receiverId || !date || !time || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const wallet = await Wallet.findOne({ userId: requesterId });

    if (!wallet || wallet.balance < price) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const newSession = new Session({
      requesterId,
      receiverId,
      date,
      time,
      note,
      price,
      isPaid: true,
    });

    await newSession.save();

    wallet.balance -= price;
    await wallet.save();

    res.status(201).json({
      success: true,
      message: "Session created and payment successful",
      session: newSession,
      wallet,
    });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get Accepted Sessions
const getAcceptedSessions = async (req, res) => {
  const { id } = req.params;

  try {
    const today = new Date().toISOString().split("T")[0];
    const sessions = await Session.find({
      isAccepted: true,
      $or: [{ requesterId: id }, { receiverId: id }],
      date: { $gte: today },
    });

    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch accepted sessions" });
  }
};

// Get Pending Sessions
const getPendingSessions = async (req, res) => {
  const { id } = req.params;

  try {
    const today = new Date().toISOString().split("T")[0];
    const sessions = await Session.find({
      isAccepted: false,
      $or: [{ requesterId: id }, { receiverId: id }],
      date: { $gte: today },
    });

    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending sessions" });
  }
};

// Accept Session
const acceptSession = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedSession = await Session.findByIdAndUpdate(
      id,
      { isAccepted: true },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ success: true, session: updatedSession });
  } catch (err) {
    res.status(500).json({ error: "Failed to update session" });
  }
};

// Remove Session
const removeSession = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Session.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ success: true, message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete session" });
  }
};

module.exports = {
  createSession,
  getAcceptedSessions,
  getPendingSessions,
  acceptSession,
  removeSession,
};
