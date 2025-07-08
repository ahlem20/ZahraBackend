const Wallet = require("../models/Wallet");

// GET wallet by userId
const getWallet = async (req, res) => {
  const { userId } = req.params;

  try {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });
    }

    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// CREATE or UPDATE wallet
const createOrUpdateWallet = async (req, res) => {
  const { userId, cardNumber, cardHolder, expiry, cvv, amount } = req.body;

  if (!userId || !cardNumber || !cardHolder || !expiry || !cvv || !amount) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    let wallet = await Wallet.findOne({ userId });

    if (wallet) {
      // Update existing wallet
      wallet.cardNumber = cardNumber;
      wallet.cardHolder = cardHolder;
      wallet.expiry = expiry;
      wallet.cvv = cvv;
      wallet.balance += Number(amount);
    } else {
      // Create new wallet
      wallet = new Wallet({
        userId,
        cardNumber,
        cardHolder,
        expiry,
        cvv,
        balance: Number(amount),
      });
    }

    await wallet.save();
    res.status(200).json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getWallet,
  createOrUpdateWallet,
};
