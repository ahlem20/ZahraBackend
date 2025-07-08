const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = protect;
