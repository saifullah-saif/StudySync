const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Test CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://study-sync-client.vercel.app",
      "https://study-sync-server-sigma.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);

app.use(express.json());

// Test route
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});
