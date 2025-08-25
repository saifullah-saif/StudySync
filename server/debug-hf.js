#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function testHuggingFaceAPI() {
  const API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  console.log("🔑 Testing Hugging Face API Key...");
  console.log(`API Key: ${API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET'}`);
  
  if (!API_KEY) {
    console.error("❌ No API key found");
    return;
  }

  try {
    // Test 1: Try to get user info (to verify API key is valid)
    console.log("\n📋 Testing API key validity...");
    const userResponse = await axios.get('https://huggingface.co/api/whoami-v2', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    console.log("✅ API key is valid");
    console.log("User info:", userResponse.data);

    // Test 2: Try a simple text generation model
    console.log("\n🤖 Testing text generation with gpt2...");
    const response = await axios.post('https://api-inference.huggingface.co/models/gpt2', {
      inputs: "What is the capital of France?",
      parameters: {
        max_new_tokens: 50,
        temperature: 0.5,
        return_full_text: false
      },
      options: {
        wait_for_model: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log("✅ API call successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    }
  }
}

testHuggingFaceAPI();
