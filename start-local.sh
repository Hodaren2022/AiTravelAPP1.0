#!/bin/bash

echo "Starting AI Travel App with Netlify Functions..."

# 檢查是否安裝了 Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "Error: Netlify CLI is not installed."
    echo "Please install it with: npm install -g netlify-cli"
    exit 1
fi

# 檢查環境變量文件
if [ ! -f .env ]; then
    echo "Error: .env file not found."
    echo "Please create .env file with GEMINI_API_KEY"
    exit 1
fi

# 檢查 GEMINI_API_KEY
if ! grep -q "GEMINI_API_KEY" .env; then
    echo "Error: GEMINI_API_KEY not found in .env file"
    exit 1
fi

echo "Environment check passed."
echo "Starting Netlify Dev server..."

# 啟動 Netlify Dev 服務器
netlify dev --target-port 5175