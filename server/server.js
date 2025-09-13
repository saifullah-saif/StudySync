const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // Load environment variables
const reservationsService = require("./services/reservationsService");
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
      "https://study-sync-client.vercel.app/",
      "https://study-sync-server-sigma.vercel.app/"
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cookieParser());

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      process.env.SERVER_URL,
      "http://localhost:3001",
      "http://localhost:3000",
      "https://study-sync-client.vercel.app/",
      "https://study-sync-server-sigma.vercel.app/"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    // exposedHeaders: ["Content-Length", "Content-Type"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

// Routes
const libraryRoomsRouter = require("./routes/libraryRoomsRoutes");
const seatsRouter = require("./routes/seatsRoutes");
const reservationsRouter = require("./routes/reservationsRoutes");
const authRouter = require("./routes/auth");

app.use("/api/auth", authRouter);
app.use("/api/library-rooms", libraryRoomsRouter);
app.use("/api/seats", seatsRouter);
app.use("/api/reservations", reservationsRouter);
// Import routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiles");
const buddyRoutes = require("./routes/buddies");
const chatRoutes = require("./routes/chats");
const courseRoutes = require("./routes/courses");
const reviewRoutes = require("./routes/revs");
const notesRoutes = require("./routes/notes");
const documentRoutes = require("./routes/documents");
const fileRoutes = require("./routes/files");
const practiceRoutes = require("./routes/practice");
const generationRoutes = require("./routes/generation");
const langchainRoutes = require("./routes/langchain");
const flashcardRoutes = require("./routes/flashcards");
const statsRoutes = require("./routes/stats");
const viewNotesRoutes = require("./routes/viewNotes");
const summaryRoutes = require("./routes/summary");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/buddies", buddyRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/reviews", reviewRoutes);

app.use("/api/documents", documentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/generation", generationRoutes);
app.use("/api/langchain", langchainRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/summary", summaryRoutes);

// Health check endpoint (no auth required)
app.use("/api/notes", notesRoutes);
app.use("/api/view-notes", viewNotesRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 5000;

// Auto-update room availability every minute
setInterval(async () => {
  try {
    await reservationsService.updateRoomAvailability();
  } catch (error) {
    console.error("Error in auto room availability update:", error);
  }
}, 60000); // Run every 60 seconds

async function startServer() {
  try {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("Room availability auto-update is running every minute");
      console.log(`Health check: http://localhost:${port}/api/health`);
      console.log(`Socket.IO server is ready`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
