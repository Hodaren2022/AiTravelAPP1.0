@echo off
echo Starting AI Travel App with Netlify Functions...

REM 檢查是否安裝了 Netlify CLI
netlify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Netlify CLI is not installed.
    echo Please install it with: npm install -g netlify-cli
    pause
    exit /b 1
)

REM 檢查環境變量文件
if not exist .env (
    echo Error: .env file not found.
    echo Please create .env file with GEMINI_API_KEY
    pause
    exit /b 1
)

REM 檢查 GEMINI_API_KEY
findstr "GEMINI_API_KEY" .env >nul
if %errorlevel% neq 0 (
    echo Error: GEMINI_API_KEY not found in .env file
    pause
    exit /b 1
)

echo Environment check passed.
echo Starting Netlify Dev server...

REM 啟動 Netlify Dev 服務器
netlify dev --target-port 5175

pause