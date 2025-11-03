import { createContext, useState, useEffect, useContext } from 'react';

const AIAssistantContext = createContext();

// 消息類型定義
const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system'
};

// 預設位置（右下角）
const DEFAULT_POSITION = {
  x: window.innerWidth - 80,
  y: window.innerHeight - 80
};

export const AIAssistantProvider = ({ children }) => {
  // --- AI助手基本狀態 ---
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(() => {
    try {
      const savedPosition = localStorage.getItem('aiAssistantPosition');
      return savedPosition ? JSON.parse(savedPosition) : DEFAULT_POSITION;
    } catch (error) {
      console.error("Failed to parse AI assistant position from localStorage", error);
      return DEFAULT_POSITION;
    }
  });

  // --- 消息歷史管理 ---
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem('aiAssistantMessages');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error("Failed to parse AI assistant messages from localStorage", error);
      return [];
    }
  });

  // --- 數據變更建議狀態 ---
  const [pendingChanges, setPendingChanges] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // --- 持久化位置 ---
  useEffect(() => {
    localStorage.setItem('aiAssistantPosition', JSON.stringify(position));
  }, [position]);

  // --- 持久化消息歷史（限制最多100條） ---
  useEffect(() => {
    const limitedMessages = messages.slice(-100); // 只保留最新100條消息
    if (limitedMessages.length !== messages.length) {
      setMessages(limitedMessages);
    }
    localStorage.setItem('aiAssistantMessages', JSON.stringify(limitedMessages));
  }, [messages]);

  // --- 核心功能函數 ---
  
  // 切換對話框開關
  const toggleDialog = () => {
    setIsOpen(prev => !prev);
  };

  // 關閉對話框
  const closeDialog = () => {
    setIsOpen(false);
  };

  // 添加消息
  const addMessage = (content, type = MESSAGE_TYPES.USER, suggestions = null, groundingMetadata = null) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date(),
      suggestions,
      groundingMetadata
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  // 添加用戶消息
  const addUserMessage = (content) => {
    return addMessage(content, MESSAGE_TYPES.USER);
  };

  // 添加AI消息
  const addAIMessage = (content, suggestions = null, groundingMetadata = null) => {
    return addMessage(content, MESSAGE_TYPES.AI, suggestions, groundingMetadata);
  };

  // 添加系統消息
  const addSystemMessage = (content) => {
    return addMessage(content, MESSAGE_TYPES.SYSTEM);
  };

  // 處理AI建議的數據變更
  const processAISuggestions = (suggestions) => {
    if (suggestions && suggestions.length > 0) {
      handleDataChanges(suggestions);
      addSystemMessage(`AI建議了 ${suggestions.length} 項數據變更，請查看確認對話框進行確認。`);
    }
  };

  // 更新浮動按鈕位置
  const updatePosition = (newPosition) => {
    setPosition(newPosition);
  };

  // 清除對話歷史
  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('aiAssistantMessages');
  };

  // 設置載入狀態
  const setLoadingState = (loading) => {
    setIsLoading(loading);
  };

  // 處理數據變更建議
  const handleDataChanges = (changes) => {
    setPendingChanges(changes);
    setShowConfirmation(true);
  };

  // 確認數據變更
  const confirmChanges = async (approvedChanges) => {
    try {
      // 動態導入dataModifier以避免循環依賴
      const { dataModifier } = await import('../services/dataModifier');
      
      // 應用變更
      const result = await dataModifier.applyChanges(approvedChanges);
      
      if (result.errors.length > 0) {
        // 如果有錯誤，顯示錯誤消息
        const errorMessage = `部分變更失敗：${result.errors.map(e => e.error).join(', ')}`;
        addSystemMessage(errorMessage);
      } else {
        // 所有變更成功
        addSystemMessage(`成功應用 ${result.results.length} 項變更`);
      }
      
      // 移除已處理的變更
      const processedIds = new Set(approvedChanges.map(c => c.id));
      setPendingChanges(prev => prev.filter(c => !processedIds.has(c.id)));
      
      // 如果沒有剩餘變更，關閉確認對話框
      if (pendingChanges.length === approvedChanges.length) {
        setShowConfirmation(false);
      }
      
      return result;
    } catch (error) {
      console.error('Error confirming changes:', error);
      addSystemMessage(`應用變更時發生錯誤：${error.message}`);
      throw error;
    }
  };

  // 拒絕數據變更
  const rejectChanges = () => {
    setPendingChanges([]);
    setShowConfirmation(false);
  };

  // --- 提供給所有子元件的值 ---
  const value = {
    // 狀態
    isOpen,
    isLoading,
    position,
    messages,
    pendingChanges,
    showConfirmation,
    
    // 常量
    MESSAGE_TYPES,
    
    // 功能函數
    toggleDialog,
    closeDialog,
    addMessage,
    addUserMessage,
    addAIMessage,
    addSystemMessage,
    updatePosition,
    clearHistory,
    setLoadingState,
    handleDataChanges,
    confirmChanges,
    rejectChanges,
    processAISuggestions
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

// 自定義鉤子，方便使用上下文
export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant 必須在 AIAssistantProvider 內使用');
  }
  return context;
};

export default AIAssistantContext;