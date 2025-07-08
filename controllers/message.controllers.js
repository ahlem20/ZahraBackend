const Message = require("../models/Message");
const Session = require("../models/Session");
const { getReceiverSocketId, io } = require("../socket/socket");

const sendMessage = async (req, res) => {
  const { senderId, receiverId, message, timestamp, groupId, devMode } =
    req.body;

  if (!senderId || (!receiverId && !groupId) || !message) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  try {
    // ✅ Group message
    if (groupId) {
      const newGroupMsg = await Message.create({
        senderId,
        groupId,
        message,
        timestamp: timestamp || new Date(),
        type: "message",
      });

      io().emit("newMessage", newGroupMsg);
      return res.status(201).json({ success: true, message: newGroupMsg });
    }

    // ✅ Direct message (session required)
    const session = await Session.findOne({
      isAccepted: true,
      $or: [
        { requesterId: senderId, receiverId },
        { requesterId: receiverId, receiverId: senderId },
      ],
    });

    if (!session) {
      return res
        .status(403)
        .json({ success: false, error: "No accepted session exists." });
    }

    const sessionDateTime = new Date(
      `${session.date}T${session.time.trim()}:00Z`
    );
    const now = new Date();

    const openTime = new Date(sessionDateTime.getTime() - 60 * 60 * 1000);
    const closeTime = new Date(sessionDateTime.getTime() + 2 * 60 * 60 * 1000);

    if (!devMode && (now < openTime || now > closeTime)) {
      return res.status(403).json({
        success: false,
        error:
          "You can only send messages between 1 hour before and 2 hours after the session time.",
        sessionTime: sessionDateTime.toISOString(),
        open: openTime.toISOString(),
        close: closeTime.toISOString(),
        now: now.toISOString(),
      });
    }

    const newMsg = await Message.create({
      senderId,
      receiverId,
      message,
      timestamp: timestamp || new Date(),
      type: "message",
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io().to(receiverSocketId).emit("newMessage", newMsg);
    }

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
