# Gemini 使用指南

本文件旨在幫助 Gemini 更好地理解此專案，並提供更精準的協助。

---

### **1. 專案概述 (Project Overview)**

*   **專案簡介**: 這是一個幫助使用者規劃旅行的 React 應用，包含行程管理、開銷記錄和打包清单等功能。
*   **技術棧**:
    *   **前端**: React (使用 Vite)
    *   **狀態管理**: React Context API
    *   **樣式**: 普通 CSS (`src/styles/index.css`)

---

### **2. 互動規則 (Interaction Rules)**

*   **語言**: 請使用繁體中文與我互動。

---

### **3. 程式碼規範 (Coding Conventions)**

*   **命名約定**:
    *   React 元件使用大駝峰命名法 (PascalCase)，例如 `DailyItinerary.jsx`。
    *   變數與函式使用小駝峰命名法 (camelCase)。
*   **程式碼風格**:
    *   遵循 Prettier 的預設規則。
    *   使用 2 個空格進行縮排。

---

### **4. 專案結構 (Project Structure)**

*   `src/pages`: 存放頁面級元件。
*   `src/components`: 存放可複用的 UI 元件 (目前尚未建立)。
*   `src/contexts`: 存放 React Context，用於全域狀態管理。
*   `src/assets`: 存放靜態資源，如圖片、SVG 等。
*   `src/styles`: 存放全域樣式。

---

### **5. 常用指令 (Common Commands)**

*   **啟動開發環境**: `npm run dev`
*   **執行測試**: `npm run test` (如果已設定)
*   **打包應用**: `npm run build`
