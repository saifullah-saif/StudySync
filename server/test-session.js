const axios = require("axios");

// Create axios instance similar to frontend
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Test authentication flow and session persistence
async function testAuthFlow() {
  try {
    console.log("1. Testing registration...");
    try {
      const registerResponse = await api.post("/auth/register", {
        name: "Test User 3",
        email: "testuser3@example.com",
        password: "password123",
        department: "CSE",
        semester: 9,
      });
      console.log("Register response:", registerResponse.data);
    } catch (error) {
      console.log(
        "Registration failed (user might exist):",
        error.response?.data || error.message
      );
    }

    console.log("\n2. Testing login...");
    const loginResponse = await api.post("/auth/login", {
      email: "testuser3@example.com",
      password: "password123",
    });

    console.log("Login response:", loginResponse.data);
    console.log("Login cookies:", loginResponse.headers["set-cookie"]);

    console.log("\n3. Testing session validation...");
    const sessionResponse = await api.get("/auth/validate-session");
    console.log("Session validation response:", sessionResponse.data);

    console.log("\n4. Testing current user endpoint...");
    const userResponse = await api.get("/auth/me");
    console.log("Current user response:", userResponse.data);
  } catch (error) {
    console.error("Test error:", error.response?.data || error.message);
    console.error(
      "Error details:",
      error.response?.status,
      error.response?.statusText
    );
    if (error.response?.data) {
      console.error(
        "Error response:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

testAuthFlow();
