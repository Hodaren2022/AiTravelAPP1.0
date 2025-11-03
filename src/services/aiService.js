// AI服務層 - 處理與Gemini API的通信

// 根據環境動態設置API基礎URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/.netlify/functions`
  : '/.netlify/functions';

// API調用錯誤類
class AIServiceError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'AIServiceError';
    this.status = status;
  }
}

// 創建AI聊天服務
class AIService {
  constructor() {
    this.abortController = null;
  }

  // 取消當前請求
  cancelRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // 發送消息到AI
  async sendMessage(message, context = {}) {
    // 取消之前的請求
    this.cancelRequest();
    
    // 創建新的AbortController
    this.abortController = new AbortController();
    
    try {
      const requestBody = {
        message,
        context: {
          currentPage: window.location.pathname,
          timestamp: new Date().toISOString(),
          ...context
        }
      };

      const response = await fetch(`${API_BASE_URL}/ai-chat-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIServiceError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      
      // 重置AbortController
      this.abortController = null;
      
      return {
        content: data.response || '抱歉，我無法處理您的請求。',
        suggestions: data.suggestions || [],
        groundingMetadata: data.groundingMetadata || null,
        metadata: data.metadata || {}
      };

    } catch (error) {
      // 重置AbortController
      this.abortController = null;
      
      if (error.name === 'AbortError') {
        throw new AIServiceError('請求已取消');
      }
      
      if (error instanceof AIServiceError) {
        // 改善錯誤消息的用戶友好性
        if (error.status === 404) {
          throw new AIServiceError('AI 服務暫時無法使用。請檢查：\n1. Netlify Functions 是否正確部署\n2. 環境變量 GEMINI_API_KEY 是否設置\n3. 網路連接是否正常');
        } else if (error.status === 403) {
          throw new AIServiceError('API 密鑰無效或權限不足。請檢查 GEMINI_API_KEY 環境變量設置');
        } else if (error.status === 429) {
          throw new AIServiceError('請求過於頻繁，請稍後再試。建議等待 1-2 分鐘後重新嘗試');
        } else if (error.status === 500) {
          throw new AIServiceError('AI 服務遇到內部錯誤，請稍後再試');
        } else if (error.status === 503) {
          throw new AIServiceError('AI 服務暫時不可用，請稍後再試');
        } else if (error.status >= 400 && error.status < 500) {
          throw new AIServiceError('請求格式錯誤，請重新嘗試');
        }
        throw error;
      }
      
      // 網路錯誤或其他未知錯誤
      if (error.code === 'ECONNREFUSED') {
        throw new AIServiceError('無法連接到 AI 服務。請檢查網路連接或稍後再試');
      } else if (error.code === 'ETIMEDOUT') {
        throw new AIServiceError('請求超時。請檢查網路連接或稍後再試');
      } else {
        throw new AIServiceError(
          error.message || '網路連接錯誤，請檢查您的網路連接'
        );
      }
    }
  }

  // 獲取當前應用數據上下文（帶智能壓縮）
  async getCurrentContext() {
    try {
      // 從localStorage獲取應用數據
      const trips = JSON.parse(localStorage.getItem('trips') || '[]');
      const selectedTripId = localStorage.getItem('lastSelectedTrip') || '';
      const expenses = JSON.parse(localStorage.getItem('expenses') || '{}');
      const notes = JSON.parse(localStorage.getItem('notes') || '[]');
      const travelNotes = JSON.parse(localStorage.getItem('travelNotes') || '{}');
      const packingLists = JSON.parse(localStorage.getItem('packingLists') || '{}');
      
      // 獲取當前選中的行程
      const currentTrip = trips.find(trip => trip.id === selectedTripId);
      
      // 構建基本上下文
      const context = {
        currentTrip: this.compressTrip(currentTrip),
        allTrips: this.compressTrips(trips),
        expenses: this.compressExpenses(selectedTripId ? expenses[selectedTripId] || [] : []),
        notes: this.compressNotes(notes),
        travelNotes: this.compressNotes(selectedTripId ? travelNotes[selectedTripId] || [] : []),
        packingList: this.compressPackingList(selectedTripId ? packingLists[selectedTripId] || [] : []),
        currentPage: window.location.pathname,
        timestamp: new Date().toISOString()
      };
      
      // 檢查上下文大小並進一步壓縮如果需要
      return this.optimizeContextSize(context);
      
    } catch (error) {
      console.error('Error getting current context:', error);
      return {
        error: 'Failed to load travel data',
        currentPage: window.location.pathname,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 壓縮行程數據
  compressTrip(trip) {
    if (!trip) return null;
    return {
      id: trip.id,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
      status: trip.status
    };
  }

  // 壓縮行程列表
  compressTrips(trips) {
    if (!trips || trips.length === 0) return [];
    // 只保留最近的5個行程
    return trips.slice(-5).map(trip => this.compressTrip(trip));
  }

  // 壓縮費用數據
  compressExpenses(expenses) {
    if (!expenses || expenses.length === 0) return [];
    // 只保留最近的10筆費用
    return expenses.slice(-10).map(expense => ({
      amount: expense.amount,
      category: expense.category,
      description: expense.description?.substring(0, 50) || '',
      date: expense.date
    }));
  }

  // 壓縮筆記數據
  compressNotes(notes) {
    if (!notes || notes.length === 0) return [];
    // 只保留最近的5條筆記
    return notes.slice(-5).map(note => ({
      title: note.title?.substring(0, 30) || '',
      content: note.content?.substring(0, 100) || '',
      category: note.category,
      date: note.date
    }));
  }

  // 壓縮打包清單
  compressPackingList(packingList) {
    if (!packingList || packingList.length === 0) return [];
    // 只保留前20項
    return packingList.slice(0, 20).map(item => ({
      item: item.item?.substring(0, 30) || '',
      packed: item.packed,
      category: item.category
    }));
  }

  // 優化上下文大小
  optimizeContextSize(context) {
    const contextString = JSON.stringify(context);
    const maxSize = 8000; // 大約8KB限制
    
    if (contextString.length <= maxSize) {
      return context;
    }
    
    // 如果超過限制，進一步壓縮
    console.log('Context too large, applying additional compression...');
    
    return {
      currentTrip: context.currentTrip,
      expenses: context.expenses.slice(-5), // 只保留最近5筆費用
      notes: context.notes.slice(-3), // 只保留最近3條筆記
      travelNotes: context.travelNotes.slice(-3),
      packingList: context.packingList.slice(0, 10), // 只保留前10項
      currentPage: context.currentPage,
      timestamp: context.timestamp,
      compressed: true
    };
  }

  // 發送帶上下文的消息（帶智能重試機制）
  async sendMessageWithContext(message, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      const context = await this.getCurrentContext();
      return await this.sendMessage(message, context);
    } catch (error) {
      // 智能重試邏輯
      const shouldRetry = this.shouldRetryError(error, retryCount, maxRetries);
      
      if (shouldRetry) {
        const delay = this.calculateRetryDelay(retryCount);
        console.log(`AI service error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendMessageWithContext(message, retryCount + 1);
      }
      
      throw error;
    }
  }

  // 判斷是否應該重試
  shouldRetryError(error, retryCount, maxRetries) {
    if (retryCount >= maxRetries) return false;
    
    // 可重試的錯誤狀態碼
    const retryableStatuses = [429, 500, 502, 503, 504];
    const retryableNetworkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
    
    return (
      retryableStatuses.includes(error.status) ||
      retryableNetworkErrors.includes(error.code) ||
      error.name === 'NetworkError'
    );
  }

  // 計算重試延遲（指數退避）
  calculateRetryDelay(retryCount) {
    const baseDelay = 1000; // 1秒
    const maxDelay = 10000; // 最大10秒
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    
    // 添加隨機抖動，避免雷群效應
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }
}

// 創建單例實例
const aiService = new AIService();

// 導出服務實例和錯誤類
export { aiService, AIServiceError };
export default aiService;