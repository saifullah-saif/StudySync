const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token from cookies
const verifyTokenFromCookie = async (req, res, next) => {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Also check for 'auth-token' for backward compatibility
  if (!token && req.cookies && req.cookies["auth-token"]) {
    token = req.cookies["auth-token"];
  }

  if (!token) {
    console.warn("No token provided in request");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify the token
    const verified = jwt.verify(token, JWT_SECRET);

    if (verified.id && !verified.user_id) {
      verified.user_id = verified.id;
    } else if (verified.user_id && !verified.id) {
      verified.id = verified.user_id;
    }

    const user = await prisma.users.findUnique({
      where: { id: verified.id },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        semester: true,
        bio: true,
        profile_picture_url: true,
        cgpa: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token - user not found" });
    }

    req.user = {
      id: user.id,
      user_id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      semester: user.semester,
      bio: user.bio,
      profile_picture_url: user.profile_picture_url,
      cgpa: user.cgpa,

      iat: verified.iat,
      exp: verified.exp,
    };

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Optional JWT cookie middleware - doesn't fail if no token provided
const optionalVerifyTokenFromCookie = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Verify the token
    const verified = jwt.verify(token, JWT_SECRET);

    if (verified.id && !verified.user_id) {
      verified.user_id = verified.id;
    } else if (verified.user_id && !verified.id) {
      verified.id = verified.user_id;
    }

    const user = await prisma.users.findUnique({
      where: { id: verified.id },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        semester: true,
        bio: true,
        profile_picture_url: true,
        cgpa: true,
        created_at: true,
      },
    });

    if (!user) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      user_id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      semester: user.semester,
      bio: user.bio,
      profile_picture_url: user.profile_picture_url,
      cgpa: user.cgpa,

      iat: verified.iat,
      exp: verified.exp,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    req.user = null;
    next();
  }
};

const generateToken = (user) => {
  const userData = {
    id: user.user_id || user.id,
    email: user.email,
    name: user.name,
    role: "user",
  };

  console.log("Generating token with user data:", userData);

  return jwt.sign(userData, JWT_SECRET, { expiresIn: "7d" });
};

const JWT_SECRET_KEY = JWT_SECRET;

module.exports = {
  verifyTokenFromCookie,
  optionalVerifyTokenFromCookie,
  generateToken,
  JWT_SECRET_KEY,
};
