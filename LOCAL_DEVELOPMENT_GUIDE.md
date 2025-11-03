# AI Travel App 本地開發指南

## 問題解決：404錯誤修復

### 問題原因
當您在本地使用CMD執行時遇到404錯誤，主要原因是：

1. **端口不匹配**：前端應用運行在5175端口，但API調用指向錯誤的端口
2. **Netlify Functions未正確啟動**：需要使用`netlify dev`而不是`npm run dev`
3. **環境變量未正確加載**：Netlify Functions需要特定的環境變量加載方式

### 解決方案

#### 方法1：使用提供的啟動腳本（推薦）

**Windows用戶：**
```bash
# 雙擊運行或在CMD中執行
start-local.bat
```

**Mac/Linux用戶：**
```bash
# 給腳本執行權限
chmod +x start-local.sh

# 運行腳本
./start-local.sh
```

#### 方法2：手動啟動

1. **確保安裝Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **檢查.env文件**
確保項目根目錄有`.env`文件，內容如下：
```
GEMINI_API_KEY=AIzaSyDiRQoAKgS8sv48WppDMtKSlwWlLSNb69c
VITE_API_BASE_URL=http://localhost:8888
```

3. **啟動Netlify Dev服務器**
```bash
netlify dev --target-port 5175
```

4. **訪問應用**
打開瀏覽器訪問：`http://localhost:8888`

### 重要說明

- **不要使用** `npm run dev` 來啟動應用，這只會啟動前端，不會啟動Netlify Functions
- **必須使用** `netlify dev` 來同時啟動前端和Functions
- **端口配置**：
  - 前端：5175 (由Vite提供)
  - Netlify Dev代理：8888 (包含Functions)
  - 訪問地址：http://localhost:8888

### 驗證修復

啟動成功後，您應該看到：
1. Netlify Dev在8888端口運行
2. 前端應用在5175端口運行
3. Functions正確加載（在終端中會顯示可用的Functions列表）
4. AI聊天功能正常工作，無404錯誤

### 故障排除

如果仍然遇到問題：

1. **檢查端口占用**
```bash
# Windows
netstat -ano | findstr :8888
netstat -ano | findstr :5175

# Mac/Linux
lsof -i :8888
lsof -i :5175
```

2. **清理並重新安裝依賴**
```bash
rm -rf node_modules
npm install
```

3. **檢查Netlify CLI版本**
```bash
netlify --version
# 建議版本 >= 12.0.0
```

4. **查看詳細日誌**
```bash
netlify dev --target-port 5175 --debug
```