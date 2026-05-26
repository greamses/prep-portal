const admin = require("firebase-admin");

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: "Admin access only." });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
