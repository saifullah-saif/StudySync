const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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
app.use("/api/library-rooms", libraryRoomsRouter);

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
