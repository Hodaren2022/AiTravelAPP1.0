# API Key 設置指南

## 生產環境（Netlify）

### 設置步驟
1. 登入 [Netlify Dashboard](https://app.netlify.com/)
2. 選擇你的網站項目
3. 進入 **Site settings** → **Environment variables**
4. 點擊 **Add a variable**
5. 設置環境變數：
   - **Key**: `GEMINI_API_KEY`
   - **Value**: 你的 Gemini API Key
   - **Scopes**: 選擇 `All scopes` 或至少包含 `Functions`

### 或使用 Netlify CLI
```bash
netlify env:set GEMINI_API_KEY your_actual_api_key_here
```

## 本地開發環境

### 設置步驟
1. 複製 `.env.example` 為 `.env.local`
2. 在 `.env.local` 中設置你的 API Key：
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   VITE_API_BASE_URL=http://localhost:8888
   NETLIFY_DEV=true
   ```

### 重要提醒
- **絕對不要**將真實的 API Key 提交到 Git 倉庫
- `.env` 和 `.env.local` 文件已經在 `.gitignore` 中被排除
- 生產環境的 API Key 應該只在 Netlify 控制台中設置

## 驗證設置

### 本地驗證
```bash
npm run dev
```
檢查 AI 功能是否正常工作

### 生產環境驗證
部署後測試 AI 聊天功能是否正常

## 安全最佳實踐

1. **定期輪換 API Key**
2. **監控 API 使用量**
3. **設置 API 配額限制**
4. **不要在客戶端代碼中暴露 API Key**
5. **使用環境變數管理敏感信息**

## 故障排除

### 常見問題
- **API Key 無效**: 檢查 Netlify 環境變數設置
- **本地開發無法連接**: 檢查 `.env.local` 文件
- **生產環境錯誤**: 檢查 Netlify Functions 日誌

### 檢查環境變數
```bash
# 本地檢查
echo $GEMINI_API_KEY

# Netlify CLI 檢查
netlify env:list
```