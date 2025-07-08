const express = require("express");
const router = express.Router();
const {
  getWallet,
  createOrUpdateWallet,
} = require("../controllers/wallet.controllers");

router.get("/:userId", getWallet); // GET wallet by userId
router.post("/", createOrUpdateWallet); // CREATE or UPDATE wallet

module.exports = router;
