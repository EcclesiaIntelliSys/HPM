const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const User = require("../models/User"); // your user model
const Voucher = require("../models/Voucher");
const transporter = require("../utils/mailer");
const { cleanupOrphan } = require("../utils/cleanupOrphan");

const router = express.Router();

// Configure multer for profile picture uploads
const fs = require("fs");
const path = require("path");
const uploadDir = path.join(__dirname, "../uploads/profile_pics");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profile_pics"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });
const isProd = process.env.NODE_ENV === "production";

// Public login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    if (!user.verified) {
      return res
        .status(403)
        .json({ error: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // ✅ Issue short-lived access token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }, // short-lived
    );
    // ✅ Issue long-lived refresh token
    const refreshToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }, // long-lived
    );

    // HASH the refresh token
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    //store refreshToken in user record
    user.refreshTokens.push({
      token: hashedToken,
      createdAt: new Date(),
    });

    await user.save();
    // ✅ Store refresh token in HttpOnly cookie

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("Refresh cookie set:", refreshToken);
    // ✅ Send access token to frontend
    console.log(Date.now() + " I just issued token: " + token);
    console.log(Date.now() + " I just issued refreshtoken: " + refreshToken);

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Registration route
router.post("/register", upload.single("profilePicture"), async (req, res) => {
  try {
    const {
      voucherCode,
      firstname,
      middlename,
      lastname,
      username,
      email,
      password,
    } = req.body;

    // Check if user already exists

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    if (voucherCode) {
      const now = new Date();
      const voucher = await Voucher.findOne({
        vouchercode: voucherCode,
        valid: true,
        claimed: false,
        validstart: { $lte: now },
        validend: { $gte: now },
      });
      if (!voucher) {
        return res
          .status(400)
          .json({ error: "Invalid or expired voucher code" });
      }
      voucher.claimed = true;
      voucher.valid = false;
      voucher.claimedby = email;
      voucher.claimdate = now;
      await voucher.save();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = jwt.sign(
      { email, voucherCode },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // Create new user
    const newUser = new User({
      firstname,
      middlename,
      lastname,
      username,
      email,
      password: hashedPassword,
      profilePicture: req.file ? req.file.path : null,
      role: "000000",
      verified: false,
      verificationToken,
    });

    await newUser.save();

    // ✅ Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
    await transporter.sendMail({
      from: process.env.TITAN_USER,
      to: email,
      subject: "Verify Your HeartPrayerMusic Artist Account Registration",
      html: ` <h2>Welcome to <strong>HeartPrayerMusic</strong>, ${firstname}!</h2> <p>Please verify your email by clicking the link below:</p> <a href="${verifyUrl}">Verify Email</a> `,
    });

    res
      .status(201)
      .json({ message: "Profile created successfully", userId: newUser._id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server errorz" });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // console.log("decoded email:", decoded.email);
    // console.log("token:", token);

    // Find user by email + token
    const user = await User.findOne({
      email: decoded.email,
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Find voucher record for this email
    const voucher = await Voucher.findOne({ vouchercode: decoded.voucherCode });

    if (!voucher) {
      return res.status(400).json({ error: "No voucher found for this user" });
    }

    // Mark user verified and assign role from voucher
    user.verified = true;
    user.verificationToken = null;
    user.role = voucher.role;
    await user.save();

    res.json({
      message: "Email verified successfully. You may proceed to Signon.",
      role: user.role,
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/delete-unverified/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email, verified: false });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found or already verified" });
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: "Unverified user deleted successfully" });
  } catch (err) {
    console.error("Delete unverified error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/refresh", async (req, res) => {
  console.log("🔥 REFRESH ROUTE HIT");
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const payload = jwt.verify(oldRefreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    console.log("Existing tokens:" + user.refreshTokens);
    // Check token exists in DB
    let matchedToken = null;

    for (const t of user.refreshTokens) {
      const isMatch = await bcrypt.compare(oldRefreshToken, t.token);
      if (isMatch) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      // Reuse detected
      user.refreshTokens = [];
      await user.save();
      return res.status(403).json({
        error: "Refresh token reuse detected",
      });
    }

    // Remove old refresh token
    user.refreshTokens = [];
    console.log("Removed old tokens:" + user.refreshTokens);

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const newHashedToken = await bcrypt.hash(newRefreshToken, 10);

    user.refreshTokens.push({
      token: newHashedToken,
      createdAt: new Date(),
    });

    await user.save();

    const newAccessToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    console.log("New access token issued: " + newAccessToken);

    // Send rotated refresh token in cookie

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    cleanupOrphan().catch((err) => console.error("Cleanup error:", err));

    res.json({ token: newAccessToken });
    console.log("New refresh token issued: " + newRefreshToken);
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout route (clear cookie)
router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.sendStatus(204); // No content, nothing to clear
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const user = await User.findById(payload.id);

    if (user) {
      for (let i = 0; i < user.refreshTokens.length; i++) {
        const isMatch = await bcrypt.compare(
          refreshToken,
          user.refreshTokens[i].token,
        );

        if (isMatch) {
          user.refreshTokens.splice(i, 1);
          break;
        }
      }

      await user.save();
    }
  } catch (err) {
    console.log("Logout token verification failed:", err.message);
  }

  // Clear cookie (must match original cookie options!)
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  return res.json({ msg: "Logged out" });
});

module.exports = router;
