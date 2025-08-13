const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class AuthService {
  static instance = null;

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Generate JWT tokens
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
      }
    );

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  verifyToken(token, isRefresh = false) {
    const secret = isRefresh
      ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Register new user - aligns with users table schema
  async registerUser(userData) {
    try {
      const { name, email, password, department, semester, bio } = userData;

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user in users table
      const user = await prisma.users.create({
        data: {
          name,
          email,
          password_hash: hashedPassword,
          department,
          semester: semester ? parseInt(semester) : null,
          bio: bio || null,
          created_at: new Date(),
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        semester: user.semester,
        bio: user.bio,
        created_at: user.created_at,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // Login with email/password - aligns with users table schema
  async loginUser(email, password) {
    try {
      // Find user by email
      const user = await prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Check password
      const isValidPassword = await this.comparePassword(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Generate tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      const tokens = this.generateTokens(tokenPayload);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          semester: user.semester,
          bio: user.bio,
          profile_picture_url: user.profile_picture_url,
          cgpa: user.cgpa,
        },
        ...tokens,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
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
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const { name, department, semester, bio, profile_picture_url, cgpa } =
        updateData;

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(department && { department }),
          ...(semester && { semester: parseInt(semester) }),
          ...(bio !== undefined && { bio }),
          ...(profile_picture_url && { profile_picture_url }),
          ...(cgpa !== undefined && { cgpa: parseFloat(cgpa) }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          semester: true,
          bio: true,
          profile_picture_url: true,
          cgpa: true,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }

  // Logout (placeholder for future token blacklisting)
  async logout(userId) {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    return { success: true };
  }
}

module.exports = AuthService;
