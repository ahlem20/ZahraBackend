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
      return res.status(201).json({ success: true, id: newGroupMsg._id });
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

    res.status(201).json({ success: true, id: newMsg._id });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Simplified (no session check)
const sendMessage1 = async (req, res) => {
  const { senderId, receiverId, message, timestamp, groupId } = req.body;

  try {
    const newMsg = await Message.create({
      senderId,
      receiverId,
      groupId: groupId || null,
      message,
      timestamp: timestamp || new Date(),
      type: "message",
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io().to(receiverSocketId).emit("newMessage", newMsg);
    }

    res.status(201).json({ success: true, id: newMsg._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get messages between two users
const getMessages = async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      type: "message",
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ timestamp: 1 }); // Optional: sort by time

    res.json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Delete message by ID
const deleteMessage = async (req, res) => {
  const { id } = req.params;

  try {
    await Message.findByIdAndDelete(id);
    io().emit("messageDeleted", { _id: id });

    res.json({ success: true, message: "Message deleted", id });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteAllMessage = async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const mangoQuery = {
      selector: {
        type: "message",
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      },
    };

    const { data } = await couch.mango(dbName, mangoQuery, {});

    if (!data.docs.length) {
      return res
        .status(404)
        .json({ success: false, message: "No messages found" });
    }

    const deletions = data.docs.map((doc) => ({
      _id: doc._id,
      _rev: doc._rev,
      _deleted: true,
    }));

    const result = await couch.bulk(dbName, { docs: deletions });

    // Notify sockets if needed
    io().emit("allMessagesDeleted", { user1, user2 });

    res.json({ success: true, deleted: result });
  } catch (err) {
    console.error("Delete all error:", err?.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Delete all messages regardless of user
const deleteAllMessages = async (req, res) => {
  try {
    const db = couch.use(dbName); // ✅ Get the database instance first

    const mangoQuery = {
      selector: {
        type: "message",
      },
    };

    const { docs } = await db.find(mangoQuery); // ✅ Use db.find, not couch.mango

    const messagesToDelete = docs.map((doc) => ({
      _id: doc._id,
      _rev: doc._rev,
      _deleted: true,
    }));

    if (messagesToDelete.length === 0) {
      return res.json({ success: true, message: "No messages to delete." });
    }

    const result = await db.bulk({ docs: messagesToDelete }); // ✅ bulk on db instance

    io().emit("allMessagesDeleted");

    res.json({ success: true, deletedCount: result.length });
  } catch (err) {
    console.error("Delete all error:", err?.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
const sendAudioMessage = async (req, res) => {
  const { senderId, receiverId, timestamp } = req.body;
  const audioFile = req.file;

  if (!audioFile) {
    return res.status(400).json({
      success: false,
      error: "Audio file is required",
    });
  }

  try {
    const newAudioMessage = new Message({
      senderId,
      receiverId,
      timestamp: timestamp || new Date(),
      type: "audio",
      audioUrl: `/uploads/${audioFile.filename}`,
    });

    await newAudioMessage.save();

    res.status(201).json({ success: true, message: newAudioMessage });
  } catch (err) {
    console.error("❌ Error sending audio message:", err.message || err);
    res.status(500).json({ error: "Failed to send audio message" });
  }
};

const getMessagesByConversation = async (req, res) => {
  const { userId, receiverId } = req.params;

  try {
    const result = await db.find({
      selector: {
        $or: [
          { senderId: userId, receiverId: receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      },
      sort: [{ timestamp: "asc" }],
    });

    res.status(200).json({ messages: result.docs });
  } catch (error) {
    console.error("❌ Error fetching messages:", error.message || error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

const getAudioMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const messages = await Message.find({
      type: "audio",
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ timestamp: 1 }); // الترتيب تصاعدي حسب الوقت

    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching audio messages:", err.message || err);
    res.status(500).json({ error: "Failed to fetch audio messages" });
  }
};

const sendImageMessage = async (req, res) => {
  const { senderId, receiverId, timestamp } = req.body;
  const imageFile = req.file;

  if (!imageFile) {
    return res
      .status(400)
      .json({ success: false, error: "Image file is required." });
  }

  try {
    const newMsg = await Message.create({
      senderId,
      receiverId,
      type: "image",
      imageUrl: `/uploads/${imageFile.filename}`,
      timestamp: timestamp || new Date(),
    });

    // Emit to receiver via socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io().to(receiverSocketId).emit("newImageMessage", newMsg);
    }

    res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    console.error("❌ Error sending image message:", error.message || error);
    res
      .status(500)
      .json({ success: false, error: "Failed to send image message." });
  }
};
const getImageMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const imageMessages = await Message.find({
      type: "image",
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ timestamp: 1 }); // optional: sort by time

    res.status(200).json({ success: true, messages: imageMessages });
  } catch (error) {
    console.error("❌ Error fetching image messages:", error.message || error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch image messages." });
  }
};

const getMessagesByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      type: { $in: ["message", "audio", "image"] },
    }).sort({ timestamp: 1 }); // optional: sort by time

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error(
      "❌ Error fetching messages by user:",
      error.message || error
    );
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch messages." });
  }
};
const getMessagesByGroupId = async (req, res) => {
  const { groupId } = req.params;

  if (!groupId) {
    return res
      .status(400)
      .json({ success: false, error: "Missing groupId parameter." });
  }

  try {
    const result = await db.list({ include_docs: true });

    const groupMessages = result.rows
      .map((row) => row.doc)
      .filter(
        (doc) =>
          doc?.type === "message" && doc?.groupId?.trim() === groupId.trim()
      );

    res.status(200).json({ success: true, messages: groupMessages });
  } catch (error) {
    console.error("❌ Error fetching group messages:", error.message || error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch group messages." });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  deleteMessage,
  deleteAllMessages,
  sendAudioMessage,
  getMessagesByConversation,
  getAudioMessages,
  sendImageMessage,
  getImageMessages,
  getMessagesByUser,
  getMessagesByGroupId,
};
