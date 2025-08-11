require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
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

// Import routes
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const fileRoutes = require("./routes/files");
const practiceRoutes = require("./routes/practice");
const generationRoutes = require("./routes/generation");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/generation", generationRoutes);

// Health check endpoint (no auth required)
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Public deck endpoint for testing (no auth required)
app.get("/api/public/decks/:id", async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const { id } = req.params;

    const deck = await prisma.flashcard_decks.findFirst({
      where: {
        id: parseInt(id),
        is_deleted: false,
      },
      include: {
        flashcards: {
          include: {
            flashcard_options: {
              orderBy: {
                option_order: "asc",
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Deck not found",
      });
    }

    res.json({
      success: true,
      deck,
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Public deck error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve deck",
    });
  }
});

const port = process.env.PORT || 5001;

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
