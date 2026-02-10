const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const projectRoutes = require("./routes/projects");
const paymentRoutes = require("./routes/payments");
const vouchersRouter = require("./routes/vouchers");
const projectsRouter = require("./routes/projects");

// 🔒 Import auth middleware
const auth = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.error(err));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/payments", paymentRoutes);

// Protected admin routes
app.use("/api/vouchermanage", auth, vouchersRouter);
app.use("/api/projectsmanage", auth, projectsRouter);

// Public customer routes
app.use("/api/vouchers", vouchersRouter); //GET vouchers without auth
app.use("/api/projects", projectsRouter); // POST survey projects without auth

// Serve React build in production
if (process.env.NODE_ENV === "production") {
  console.log("xxxxxxxxxxx...");
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Catch-all route for React Router
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
