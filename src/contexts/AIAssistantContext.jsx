import { createContext, useState, useEffect, useContext } from 'react';

const AIAssistantContext = createContext();

// 消息類型定義
const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system'
};

// 計算預設位置（新增行程按鈕上方）
const getDefaultPosition = () => {
  // 新增行程按鈕位置：bottom: 30px, right: 30px, size: 60px
  // AI助手按鈕應該在它上方，留一些間距
  return {
    x: window.innerWidth - 90, // right: 30px + 60px button width = 90px from right
    y: window.innerHeight - 160 // bottom: 30px + 60px button height + 70px spacing = 160px from bottom
  };
};

export const AIAssistantProvider = ({ children }) => {
  // --- AI助手基本狀態 ---
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- AI模型溫度設定 ---
  const [temperature, setTemperature] = useState(() => {
    try {
      const savedTemperature = localStorage.getItem('aiAssistantTemperature');
      return savedTemperature ? parseFloat(savedTemperature) : 0.7; // 預設溫度為0.7
    } catch (error) {
      console.error("Failed to parse AI assistant temperature from localStorage", error);
      return 0.7;
    }
  });
  const [position, setPosition] = useState(() => {
    // 檢查是否為新的會話（沒有保存的位置或程式重新啟動）
    const savedPosition = localStorage.getItem('aiAssistantPosition');
    const sessionStartTime = sessionStorage.getItem('aiAssistantSessionStart');
    const currentTime = Date.now().toString();
    
    // 如果沒有會話開始時間，表示是新的會話
    if (!sessionStartTime) {
      sessionStorage.setItem('aiAssistantSessionStart', currentTime);
      return getDefaultPosition();
    }
    
    // 如果有保存的位置，使用保存的位置
    if (savedPosition) {
      try {
        return JSON.parse(savedPosition);
      } catch (error) {
        console.error("Failed to parse AI assistant position from localStorage", error);
        return getDefaultPosition();
      }
    }
    
    // 否則使用預設位置
    return getDefaultPosition();
  });

  // --- 消息歷史管理 ---
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem('aiAssistantMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // 清理歷史消息中的 suggestions，避免重新執行數據變更
        return parsedMessages.map(message => ({
          ...message,
          suggestions: null // 移除歷史消息中的建議，防止重複執行
        }));
      }
      return [];
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

  // --- 持久化溫度設定 ---
  useEffect(() => {
    localStorage.setItem('aiAssistantTemperature', temperature.toString());
  }, [temperature]);

  // --- 持久化消息歷史（限制最多100條） ---
  useEffect(() => {
    const limitedMessages = messages.slice(-100); // 只保留最新100條消息
    if (limitedMessages.length !== messages.length) {
      setMessages(limitedMessages);
    }
    
    // 保存時清理 suggestions 避免歷史消息重複執行
    const cleanedMessages = limitedMessages.map(message => ({
      ...message,
      suggestions: null // 清理建議數據
    }));
    
    localStorage.setItem('aiAssistantMessages', JSON.stringify(cleanedMessages));
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

  // 生成唯一ID的輔助函數
  const generateUniqueId = (type) => {
    const timestamp = Date.now();
    const performanceNow = performance.now().toString().replace('.', '');
    const random1 = Math.random().toString(36).substr(2, 9);
    const random2 = Math.random().toString(36).substr(2, 9);
    
    // 添加全局計數器確保唯一性
    if (!window._aiAssistantIdCounter) {
      window._aiAssistantIdCounter = 0;
    }
    window._aiAssistantIdCounter++;
    
    return `${type}_${timestamp}_${performanceNow}_${random1}_${random2}_${window._aiAssistantIdCounter}`;
  };

  // 添加消息
  const addMessage = (content, type = MESSAGE_TYPES.USER, suggestions = null, groundingMetadata = null) => {
    const newMessage = {
      id: generateUniqueId(type),
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
  const processAISuggestions = (suggestions, isFromHistory = false) => {
    // 如果是歷史消息，忽略建議避免重複執行
    if (isFromHistory) {
      return;
    }
    
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

  // 開始新對話
  const startNewConversation = () => {
    setMessages([]);
    localStorage.removeItem('aiAssistantMessages');
    // 添加歡迎消息
    const welcomeMessage = {
      id: generateUniqueId(`welcome_${MESSAGE_TYPES.AI}`),
      content: '您好！我是您的AI旅行助手。我可以幫助您管理行程、查詢旅遊資訊，以及協助編輯您的旅行數據。有什麼可以為您服務的嗎？',
      type: MESSAGE_TYPES.AI,
      timestamp: new Date(),
      suggestions: null,
      groundingMetadata: null
    };
    setMessages([welcomeMessage]);
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

  // 更新AI模型溫度
  const updateTemperature = (newTemperature) => {
    setTemperature(newTemperature);
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
    temperature,
    
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
    startNewConversation,
    setLoadingState,
    handleDataChanges,
    confirmChanges,
    rejectChanges,
    processAISuggestions,
    updateTemperature
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