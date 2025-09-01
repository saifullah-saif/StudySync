require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.CLIENT_URL,
      process.env.SERVER_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.CLIENT_URL,
      process.env.SERVER_URL,
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Type"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining their room
  socket.on("join_user_room", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  // Handle user leaving their room
  socket.on("leave_user_room", (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`User ${userId} left room user_${userId}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Import routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiles");
const buddyRoutes = require("./routes/buddies");
const chatRoutes = require("./routes/chats");
const notesRoutes = require("./routes/notes");
const documentRoutes = require("./routes/documents");
const fileRoutes = require("./routes/files");
const practiceRoutes = require("./routes/practice");
const generationRoutes = require("./routes/generation");
const langchainRoutes = require("./routes/langchain");
const flashcardRoutes = require("./routes/flashcards");
const statsRoutes = require("./routes/stats");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/buddies", buddyRoutes);
app.use("/api/chats", chatRoutes);

app.use("/api/documents", documentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/generation", generationRoutes);
app.use("/api/langchain", langchainRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/stats", statsRoutes);

// Health check endpoint (no auth required)
app.use("/api/notes", notesRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 5001;

async function startServer() {
  try {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${port}/api/health`);
      console.log(`Socket.IO server is ready`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
