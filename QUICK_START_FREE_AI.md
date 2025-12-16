# 🚀 Quick Start: Free AI for Flashcard Generation

## ⚡ 2-Minute Setup

### Option 1: DeepSeek (Most Generous - 50M Free Tokens!)

1. **Get API Key:**
   - Visit: https://platform.deepseek.com
   - Sign up with email/GitHub
   - Go to "API Keys" → Create new key
   - Copy the key (starts with `sk-`)

2. **Add to `.env`:**
   ```bash
   DEEPSEEK_API_KEY=sk-your-key-here
   ```

3. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

4. **Done!** You'll see: `✅ DeepSeek AI configured (FREE tier)`

---

### Option 2: Groq (Fastest - 14,400 Requests/Day!)

1. **Get API Key:**
   - Visit: https://console.groq.com
   - Sign in with Google/GitHub
   - Go to "API Keys" → Create new key
   - Copy the key (starts with `gsk_`)

2. **Add to `.env`:**
   ```bash
   GROQ_API_KEY=gsk_your-key-here
   ```

3. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

4. **Done!** You'll see: `✅ Groq AI configured (FREE tier)`

---

## 🎯 Which One Should I Choose?

| Use Case | Best Choice | Why? |
|----------|-------------|------|
| **Student / Personal** | DeepSeek | 50M tokens = months of usage |
| **Heavy Daily Usage** | Groq | 14,400 requests/day = ~600/hour |
| **Need Speed** | Groq | 10x faster than others |
| **Maximum Free Usage** | Both! | Use both as backup |

---

## 💪 Pro Tip: Use Both!

Add both keys to your `.env`:

```bash
# DeepSeek will be used first (priority #1)
DEEPSEEK_API_KEY=sk-your-deepseek-key

# Groq as backup (priority #2)
GROQ_API_KEY=gsk_your-groq-key
```

If DeepSeek fails or runs out, Groq will automatically take over!

---

## ✅ Testing Your Setup

1. Start server: `cd server && npm run dev`
2. Check logs for:
   ```
   ✅ DeepSeek AI configured (FREE tier)
   🤖 Using AI provider: DEEPSEEK
   ```
3. Upload a PDF in your app
4. Click "Extract Text" → "Generate Flashcards"
5. Check server logs for:
   ```
   🧠 DeepSeek: Generating 10 medium flashcards...
   ✅ DeepSeek generated 10 flashcards
   ```

---

## 📊 Comparison Table

| Provider | Free Limit | Speed | Quality | Best For |
|----------|-----------|-------|---------|----------|
| **DeepSeek** | 50M tokens | Fast | Excellent | Most usage |
| **Groq** | 14.4k/day | Very Fast | Excellent | Speed |
| Claude | ❌ Paid | Fast | Excellent | Production |
| OpenAI | ❌ Paid | Medium | Good | Fallback |

---

## 🆘 Troubleshooting

**Problem:** "API key not configured"
- ✅ Make sure key is in `/server/.env` file
- ✅ Restart server after adding key
- ✅ Check for typos in key name

**Problem:** "Rate limit exceeded"
- ✅ For Groq: 14,400/day limit reached
- ✅ Add DeepSeek as backup
- ✅ Or wait 24 hours

**Problem:** No flashcards generated
- ✅ Check if you extracted text first
- ✅ Check server logs for errors
- ✅ Try smaller document

---

## 🎓 Additional Free Options

### Local AI (Unlimited & Free)

**Ollama** - Run models on your computer:
```bash
# Install Ollama
brew install ollama  # Mac
# or download from: https://ollama.com

# Pull a model
ollama pull llama3.1

# Run unlimited, free!
```

Requires: 8GB+ RAM, modern CPU/GPU

---

## 📚 More Help

- Full guide: See `FREE_AI_SETUP.md`
- DeepSeek Docs: https://platform.deepseek.com/docs
- Groq Docs: https://console.groq.com/docs

---

**Ready to generate flashcards? Get your free API key above and start studying! 🎉**
