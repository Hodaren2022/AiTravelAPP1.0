# Requirements Document

## Introduction

本功能旨在修復 AI 助手對話視窗中出現的 React key 重複警告問題，以及每次點擊 AI 助手按鈕時意外創建新行程的問題。這些問題影響了用戶體驗和應用程序的穩定性。

## Requirements

### Requirement 1

**User Story:** 作為一個開發者，我希望消除 React 控制台中的 key 重複警告，以便確保組件在更新時保持正確的身份識別。

#### Acceptance Criteria

1. WHEN AI 助手對話視窗載入歷史消息時 THEN 系統 SHALL 確保每個消息元素都有唯一的 key 屬性
2. WHEN 用戶多次點擊 AI 助手按鈕時 THEN 系統 SHALL 不會產生重複的 key 值
3. WHEN 在 React StrictMode 下運行時 THEN 系統 SHALL 確保 ID 生成函數在雙重渲染情況下仍能產生唯一值
4. WHEN 消息列表渲染時 THEN 控制台 SHALL 不會顯示 "Encountered two children with the same key" 警告

### Requirement 2

**User Story:** 作為一個用戶，我希望點擊 AI 助手按鈕時不會意外創建新的行程，以便保持我的行程數據整潔。

#### Acceptance Criteria

1. WHEN 用戶點擊 AI 助手對話視窗按鈕時 THEN 系統 SHALL 只打開對話視窗而不創建新行程
2. WHEN AI 助手載入歷史消息時 THEN 系統 SHALL 不會觸發任何行程創建邏輯
3. WHEN 程序重新啟動後 THEN 系統 SHALL 不會因為 AI 助手的初始化而創建額外的行程
4. WHEN 用戶關閉並重新打開 AI 助手時 THEN 行程數量 SHALL 保持不變

### Requirement 3

**User Story:** 作為一個開發者，我希望改進 ID 生成機制，以便在高頻調用和並發情況下確保唯一性。

#### Acceptance Criteria

1. WHEN 系統需要生成唯一 ID 時 THEN 生成的 ID SHALL 包含足夠的熵來避免碰撞
2. WHEN 在短時間內多次調用 ID 生成函數時 THEN 每次調用 SHALL 返回不同的 ID
3. WHEN 在 React StrictMode 的雙重渲染環境下時 THEN ID 生成 SHALL 保持一致性
4. WHEN 系統重新載入時 THEN 新生成的 ID SHALL 不會與已存儲的 ID 衝突

### Requirement 4

**User Story:** 作為一個用戶，我希望 AI 助手的消息歷史能正確載入和顯示，以便查看之前的對話內容。

#### Acceptance Criteria

1. WHEN AI 助手對話視窗打開時 THEN 系統 SHALL 正確載入並顯示歷史消息
2. WHEN 歷史消息包含搜索元數據時 THEN 系統 SHALL 正確渲染參考來源
3. WHEN 消息列表更新時 THEN 系統 SHALL 保持滾動位置的正確性
4. WHEN 消息包含時間戳時 THEN 系統 SHALL 正確格式化和顯示時間