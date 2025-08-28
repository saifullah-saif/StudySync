const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const reservationsService = require("./services/reservationsService");

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: [process.env.CLIENT_URL, process.env.SERVER_URL, "http://localhost:3001", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    // exposedHeaders: ["Content-Length", "Content-Type"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const libraryRoomsRouter = require("./routes/libraryRoomsRoutes");
const seatsRouter = require("./routes/seatsRoutes");
const reservationsRouter = require("./routes/reservationsRoutes");
const authRouter = require("./routes/auth");

app.use("/api/auth", authRouter);
app.use("/api/library-rooms", libraryRoomsRouter);
app.use("/api/seats", seatsRouter);
app.use("/api/reservations", reservationsRouter);

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
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("Room availability auto-update is running every minute");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
