#!/bin/bash

# Quick setup script for podcast database
# Usage: ./setup-podcast-db.sh

echo "🎙️  StudySync Podcast Database Setup"
echo "====================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create server/.env with:"
    echo "  SUPABASE_URL=your_url"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_key"
    exit 1
fi

# Run test script
echo "Running database setup test..."
echo ""

node test-db-setup.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Setup complete! You're ready to generate podcasts."
    echo ""
    echo "Next steps:"
    echo "  1. Install Edge-TTS: ./setup-edge-tts.sh"
    echo "  2. Start server: npm run dev"
else
    echo ""
    echo "❌ Setup incomplete. Please follow the instructions above."
    echo ""
    echo "For detailed help, see: ../FIX_DATABASE_ERROR.md"
fi

exit $EXIT_CODE
