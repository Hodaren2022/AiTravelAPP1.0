# Gemini Google Search 工具整合需求文檔

## 介紹

本功能旨在將 Google Gemini API 的 Google Search 工具整合到現有的 AI 旅行助手中，以提供更準確的實時資訊和引文功能。此整合將取代現有的搜索服務，並實作完整的 groundingMetadata 處理系統，為用戶提供可驗證的資訊來源。

## 需求

### 需求 1：Gemini Google Search 工具配置

**用戶故事：** 作為系統管理員，我希望能夠正確配置 Gemini API 的 Google Search 工具，以便 AI 助手能夠獲取最新的網路資訊。

#### 接受標準

1. WHEN 系統啟動時 THEN 系統 SHALL 正確載入 Gemini API 金鑰並初始化 Google Search 工具
2. WHEN AI 助手需要最新資訊時 THEN 系統 SHALL 自動啟用 Google Search 工具進行搜索
3. WHEN API 調用失敗時 THEN 系統 SHALL 提供適當的錯誤處理和降級機制
4. WHEN 使用 Google Search 工具時 THEN 系統 SHALL 使用 gemini-2.0-flash 模型以獲得最佳效果

### 需求 2：groundingMetadata 處理系統

**用戶故事：** 作為開發者，我希望能夠正確處理 Gemini API 回應中的 groundingMetadata，以便提取搜索查詢、來源和引文資訊。

#### 接受標準

1. WHEN 收到 Gemini API 回應時 THEN 系統 SHALL 解析 groundingMetadata 中的 webSearchQueries 陣列
2. WHEN 處理 groundingMetadata 時 THEN 系統 SHALL 驗證並清理 groundingChunks 結構
3. WHEN 解析 groundingSupports 時 THEN 系統 SHALL 正確映射文字片段到對應的來源索引
4. IF groundingMetadata 缺失或無效 THEN 系統 SHALL 優雅地處理並返回 null
5. WHEN 處理過程中發生錯誤時 THEN 系統 SHALL 記錄錯誤並返回安全的預設值

### 需求 3：引文生成和內嵌系統

**用戶故事：** 作為用戶，我希望在 AI 回應中看到內嵌的引文連結，以便我能夠驗證資訊來源的可靠性。

#### 接受標準

1. WHEN AI 回應包含 groundingMetadata 時 THEN 系統 SHALL 在相應文字位置插入引文連結
2. WHEN 生成引文時 THEN 系統 SHALL 使用 Markdown 格式 `[編號](URL "標題")` 
3. WHEN 多個來源支持同一文字片段時 THEN 系統 SHALL 合併多個引文連結
4. WHEN 插入引文時 THEN 系統 SHALL 按 endIndex 降序處理以避免位置偏移
5. WHEN 引文索引超出範圍時 THEN 系統 SHALL 安全地跳過該引文

### 需求 4：前端引文顯示功能

**用戶故事：** 作為用戶，我希望在聊天介面中看到美觀的引文顯示，包括來源列表和可點擊的連結。

#### 接受標準

1. WHEN 顯示 AI 消息時 THEN ChatDialog 組件 SHALL 渲染內嵌的引文連結為可點擊元素
2. WHEN 消息包含 groundingMetadata 時 THEN 系統 SHALL 在消息下方顯示搜索查詢資訊
3. WHEN 顯示來源列表時 THEN 系統 SHALL 包含來源編號、標題、URL 和域名
4. WHEN 用戶點擊引文連結時 THEN 系統 SHALL 在新標籤頁中開啟對應的來源網頁
5. WHEN 引文樣式渲染時 THEN 系統 SHALL 與現有 UI 設計保持一致

### 需求 5：舊版搜索服務移除

**用戶故事：** 作為開發者，我希望移除舊版的搜索服務代碼，以簡化系統架構並避免衝突。

#### 接受標準

1. WHEN 整合完成時 THEN 系統 SHALL 移除 searchService.js 文件
2. WHEN 清理代碼時 THEN 系統 SHALL 移除 ai-chat-enhanced.js 中的舊版搜索相關函數
3. WHEN 更新導入語句時 THEN 系統 SHALL 移除對搜索服務的依賴
4. WHEN 清理完成時 THEN 系統 SHALL 確保沒有未使用的搜索相關代碼殘留
5. WHEN 移除舊代碼時 THEN 系統 SHALL 保持現有功能的完整性

### 需求 6：錯誤處理和測試驗證

**用戶故事：** 作為用戶，我希望系統能夠穩定運行，即使在網路問題或 API 錯誤的情況下也能提供適當的回饋。

#### 接受標準

1. WHEN API 調用超時時 THEN 系統 SHALL 顯示適當的錯誤消息並提供重試選項
2. WHEN groundingMetadata 解析失敗時 THEN 系統 SHALL 記錄錯誤但仍返回基本的 AI 回應
3. WHEN 引文生成過程中出現錯誤時 THEN 系統 SHALL 返回未處理的原始文字
4. WHEN 進行功能測試時 THEN 系統 SHALL 驗證各種搜索場景和邊緣情況
5. WHEN 測試引文功能時 THEN 系統 SHALL 確保引文連結的正確性和可訪問性

### 需求 7：性能優化和用戶體驗

**用戶故事：** 作為用戶，我希望新的搜索功能能夠快速回應，並提供比舊版本更好的用戶體驗。

#### 接受標準

1. WHEN 使用 Google Search 工具時 THEN 系統 SHALL 確保回應時間不超過舊版搜索服務
2. WHEN 處理 groundingMetadata 時 THEN 系統 SHALL 優化解析性能以減少延遲
3. WHEN 顯示引文時 THEN 系統 SHALL 確保 UI 渲染流暢無卡頓
4. WHEN 載入搜索結果時 THEN 系統 SHALL 提供適當的載入指示器
5. WHEN 完成整合時 THEN 系統 SHALL 提供比舊版本更準確和及時的資訊# Requirements Document

## Introduction

本功能旨在將現有的 AI 旅行助手搜索功能完全重構，使用 Gemini API 內建的 Google Search 工具來替代現有的 DuckDuckGo 搜索服務。這將提供更準確的搜索結果、即時資訊獲取能力，以及可驗證的資訊來源引文功能，從而提升用戶體驗和資訊可信度。

## Requirements

### Requirement 1

**User Story:** 作為一個旅行者，我希望 AI 助手能夠提供最新且準確的旅遊資訊，以便我能做出更好的旅行決策。

#### Acceptance Criteria

1. WHEN 用戶詢問需要最新資訊的問題（如天氣、景點營業時間、交通狀況等）THEN 系統 SHALL 使用 Gemini Google Search 工具自動獲取最新資訊
2. WHEN AI 判斷需要搜索時 THEN 系統 SHALL 自動執行搜索而無需用戶手動觸發
3. WHEN 搜索完成後 THEN 系統 SHALL 在回應中整合搜索結果並提供準確的資訊

### Requirement 2

**User Story:** 作為一個用戶，我希望能夠看到 AI 回應的資訊來源，以便我能驗證資訊的可信度。

#### Acceptance Criteria

1. WHEN AI 使用搜索結果回答問題時 THEN 系統 SHALL 顯示資訊來源的引文和連結
2. WHEN 顯示引文時 THEN 系統 SHALL 提供可點擊的來源連結讓用戶查看原始資料
3. WHEN 有多個來源時 THEN 系統 SHALL 清楚標示每個資訊片段對應的來源

### Requirement 3

**User Story:** 作為一個開發者，我希望移除對外部搜索服務的依賴，以便簡化系統架構和維護工作。

#### Acceptance Criteria

1. WHEN 重構完成後 THEN 系統 SHALL 不再依賴 DuckDuckGo 或其他外部搜索 API
2. WHEN 搜索功能運行時 THEN 系統 SHALL 僅使用 Gemini API 的 Google Search 工具
3. WHEN 移除舊代碼後 THEN 系統 SHALL 保持所有現有功能的正常運作

### Requirement 4

**User Story:** 作為一個用戶，我希望搜索功能的回應速度更快，以便獲得更好的使用體驗。

#### Acceptance Criteria

1. WHEN 用戶發送需要搜索的查詢時 THEN 系統 SHALL 在單次 API 調用中完成搜索和回應生成
2. WHEN 處理搜索請求時 THEN 系統 SHALL 減少網路請求次數以提升性能
3. WHEN 搜索失敗時 THEN 系統 SHALL 提供適當的錯誤處理和降級機制

### Requirement 5

**User Story:** 作為一個用戶，我希望能夠了解 AI 使用了哪些搜索查詢，以便理解回應的生成過程。

#### Acceptance Criteria

1. WHEN AI 執行搜索時 THEN 系統 SHALL 記錄並可選擇性顯示使用的搜索查詢
2. WHEN 顯示搜索元數據時 THEN 系統 SHALL 包含搜索查詢、來源數量等資訊
3. WHEN 用戶需要調試時 THEN 系統 SHALL 提供詳細的搜索過程資訊

### Requirement 6

**User Story:** 作為一個系統管理員，我希望能夠監控和控制搜索功能的使用成本，以便管理 API 費用。

#### Acceptance Criteria

1. WHEN 使用 Google Search 工具時 THEN 系統 SHALL 記錄每次搜索的使用情況
2. WHEN 搜索頻率過高時 THEN 系統 SHALL 提供適當的頻率限制機制
3. WHEN 需要成本控制時 THEN 系統 SHALL 支援配置搜索使用的限制條件

### Requirement 7

**User Story:** 作為一個用戶，我希望在搜索功能不可用時仍能獲得基本的 AI 回應，以便保持服務的可用性。

#### Acceptance Criteria

1. WHEN Google Search 工具不可用時 THEN 系統 SHALL 使用 AI 的內建知識提供回應
2. WHEN 搜索失敗時 THEN 系統 SHALL 明確告知用戶並提供替代建議
3. WHEN 降級運行時 THEN 系統 SHALL 保持基本的對話功能正常運作

### Requirement 8

**User Story:** 作為一個前端開發者，我希望新的搜索結果格式能夠與現有的 UI 組件兼容，以便最小化前端變更。

#### Acceptance Criteria

1. WHEN 接收新的搜索結果格式時 THEN 前端 SHALL 能夠正確解析和顯示 groundingMetadata
2. WHEN 顯示引文時 THEN 前端 SHALL 使用一致的 UI 設計語言
3. WHEN 處理搜索元數據時 THEN 前端 SHALL 保持與現有消息格式的兼容性