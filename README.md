# 旅遊應用程序

這是一個用React開發的旅遊應用程序，提供行程管理、旅館資訊、旅遊須知等功能。

## 功能模塊

1. **行程管理** - 創建和管理旅遊行程
2. **每日行程** - 查看和編輯每日行程安排
3. **旅館資訊** - 保存和查看住宿相關信息
4. **旅遊須知** - 目的地相關的重要信息
5. **物品清單** - 旅行所需物品的檢查清單
6. **旅遊筆記** - 記錄旅行中的想法和經歷

## 安裝與運行

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build
```

## 項目結構

```
src/
├── assets/       # 靜態資源
├── components/   # 共用組件
├── contexts/     # React上下文
├── hooks/        # 自定義鉤子
├── pages/        # 頁面組件
├── services/     # 服務和API
├── styles/       # 全局樣式
├── utils/        # 工具函數
├── App.jsx       # 主應用組件
└── main.jsx      # 應用入口
```

## 技術棧

- React
- React Router
- Styled Components
- Vite (構建工具)