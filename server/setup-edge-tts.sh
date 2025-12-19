#!/bin/bash

# Setup script for edge-tts
# Ensures edge-tts Python package is installed

echo "🎙️  Setting up Edge-TTS..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found"

# Install edge-tts
echo "📦 Installing edge-tts..."
pip3 install edge-tts

# Verify installation
if edge-tts --version &> /dev/null; then
    echo "✅ edge-tts installed successfully!"
    echo "   Version: $(edge-tts --version)"
else
    echo "❌ edge-tts installation failed"
    exit 1
fi

echo "🎉 Edge-TTS setup complete!"
