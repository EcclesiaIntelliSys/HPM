const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ msg: "No token provided" });
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded payload (e.g. id, email, role)
    // Role check here
    // if (req.user.role !== "admin") { return res.status(403).json({ msg: "Forbidden" }); }
    next();
  } catch (err) {
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};
