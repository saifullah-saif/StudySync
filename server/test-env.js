require('dotenv').config();

console.log('🔍 Environment Variables Test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ROLE_KEY:', process.env.SUPABASE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

// Test OpenAI import
try {
  const OpenAI = require('openai');
  console.log('✅ OpenAI module imported successfully');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI client created successfully');
} catch (error) {
  console.error('❌ OpenAI import/creation failed:', error.message);
}
