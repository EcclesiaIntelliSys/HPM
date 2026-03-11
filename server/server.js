const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const http = require("http");
const https = require("https");
const { Server } = require("socket.io");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const paymentRoutes = require("./routes/payments");
const vouchersRoutes = require("./routes/vouchers");
const projectsRoutes = require("./routes/projects");
const clockifyRoutes = require("./routes/clockify");
const opsconfigRoutes = require("./routes/opsconfig");
const { cleanupOrphan } = require("./utils/cleanupOrphan");
const auth = require("./middleware/auth");

const app = express();
app.use(express.json());
app.use(cookieParser());

/* -------------------- CORS -------------------- */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

/* -------------------- Database -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.error(err));

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api/vouchersmanage", auth, vouchersRoutes);
app.use("/api/projectsmanage", auth, projectsRoutes);
app.use("/api/clockify", auth, clockifyRoutes);

app.use("/api/vouchers", vouchersRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/opsconfig", opsconfigRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test cookie endpoint
app.get("/check-cookie", (req, res) => {
  console.log("Cookies received by backend:", req.cookies);
  res.json({ cookies: req.cookies });
});

/* -------------------- Production Build -------------------- */
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // REQUIRED for secure cookies behind SSL
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

/* -------------------- Server + Socket.IO -------------------- */
const PORT = process.env.PORT || 5000;

let server;
if (process.env.NODE_ENV === "production") {
  server = http.createServer(app);
} else {
  const key = fs.readFileSync("./certs/localhost-key.pem");
  const cert = fs.readFileSync("./certs/localhost.pem");
  server = https.createServer({ key, cert }, app);
}

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Attach io to app so routes can emit events
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(
    `${process.env.NODE_ENV === "production" ? "Production" : "Dev HTTPS"} server running on port ${PORT}`,
  );
});

/* -------------------- Cleanup Orphaned Locks -------------------- */
setInterval(() => {
  cleanupOrphan();
}, 60000); // every 1 minute
