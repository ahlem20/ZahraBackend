const Group = require("../models/Group");

// 📌 Create a new group
const createGroup = async (req, res) => {
  const { name, members } = req.body;

  if (!name) return res.status(400).json({ error: "Group name is required" });

  try {
    const newGroup = await Group.create({
      name,
      members: members || [],
    });

    res.status(201).json({ success: true, group: newGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Delete group by ID
const deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    const group = await Group.findByIdAndDelete(id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Update group (name or members)
const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name, members } = req.body;

  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    group.name = name || group.name;
    group.members = members || group.members;
    group.updatedAt = new Date();

    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Add user to existing group
const addUserToGroup = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      group.updatedAt = new Date();
      await group.save();
    }

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get all groups
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get groups by userId
// 📌 Get groups by userId
const getGroupsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const groups = await Group.find({ members: userId });
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createGroup,
  deleteGroup,
  updateGroup,
  addUserToGroup,
  getGroups,
  getGroupsByUserId,
};
