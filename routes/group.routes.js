const express = require("express");
const router = express.Router();
const {
  createGroup,
  deleteGroup,
  updateGroup,
  addUserToGroup,
  getGroups,
  getGroupsByUserId,
} = require("../controllers/group.controllers");
// group.routes.js
router.post("/create", createGroup);

router.delete("/:id", deleteGroup);
router.put("/:id", updateGroup);
router.put("/add-user/:groupId", addUserToGroup);
router.get("/", getGroups);
router.get("/user/:userId", getGroupsByUserId);

module.exports = router;
