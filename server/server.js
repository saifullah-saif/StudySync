const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Pusher = require("pusher");
const http = require("http");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const getAllowedOrigins = () => {
  const baseOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://study-sync-client.vercel.app",
    "https://studysync-server-ouba.onrender.com",
    "https://study-sync-client.vercel.app/",
    "https://studysync-server-ouba.onrender.com/",
    "https://studysync-server-ouba.onrender.com/api",
  ];

  // Add environment-specific origins if they exist and are different
  const envOrigins = [
    process.env.CLIENT_URL,
    process.env.SERVER_URL,
    process.env.PRODUCTION_CLIENT_URL,
    process.env.PRODUCTION_SERVER_URL,
  ].filter(Boolean);

  // Combine and deduplicate origins
  const allOrigins = [...baseOrigins, ...envOrigins];
  const uniqueOrigins = [...new Set(allOrigins)];

  return uniqueOrigins;
};

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = getAllowedOrigins();

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Content-Length", "Content-Type", "Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OPTIONS handling is done by CORS middleware

// Make pusher available to routes
app.set("pusher", pusher);

// Import all routes
const authRoutes = require("./routes/auth");
const libraryRoomsRouter = require("./routes/libraryRoomsRoutes");
const seatsRouter = require("./routes/seatsRoutes");
const reservationsRouter = require("./routes/reservationsRoutes");
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
const flashcardRoutes = require("./routes/flashcards");
const statsRoutes = require("./routes/stats");
const viewNotesRoutes = require("./routes/viewNotes");
const summaryRoutes = require("./routes/summary");
const podcastRoutes = require("./routes/podcastRoutes");

// Use all routes
app.use("/api/auth", authRoutes);
app.use("/api/library-rooms", libraryRoomsRouter);
app.use("/api/seats", seatsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/buddies", buddyRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/generation", generationRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/view-notes", viewNotesRoutes);
app.use("/api/server/podcasts", podcastRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 5000;

// Run every 60 seconds

async function startServer() {
  try {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("Room availability auto-update is running every minute");
      console.log(`Health check: http://localhost:${port}/api/health`);
      console.log(
        `Pusher initialized with cluster: ${process.env.PUSHER_CLUSTER}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
