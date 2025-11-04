// 網路工具函數 - 用於檢測網路狀態和連接性

// 檢測網路連接狀態
export const checkNetworkStatus = () => {
  return {
    online: navigator.onLine,
    connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
    effectiveType: navigator.connection?.effectiveType || 'unknown'
  };
};

// 檢測是否為移動設備
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 檢測是否為iOS設備
export const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// 檢測是否為Android設備
export const isAndroidDevice = () => {
  return /Android/.test(navigator.userAgent);
};

// 網路狀態監聽器
export class NetworkMonitor {
  constructor() {
    this.listeners = [];
    this.isOnline = navigator.onLine;
    
    // 監聽網路狀態變化
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }
  
  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
    console.log('Network: 網路連接已恢復');
  }
  
  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
    console.log('Network: 網路連接已斷開');
  }
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline);
      } catch (error) {
        console.error('Network: 監聽器回調錯誤:', error);
      }
    });
  }
  
  getStatus() {
    return {
      online: this.isOnline,
      ...checkNetworkStatus()
    };
  }
  
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners = [];
  }
}

// 創建全局網路監聽器實例
export const networkMonitor = new NetworkMonitor();

// 測試API連接性
export const testAPIConnection = async (apiUrl = '/.netlify/functions/ai-chat-enhanced') => {
  try {
    console.log('Network: 測試API連接:', apiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時
    
    const response = await fetch(apiUrl, {
      method: 'OPTIONS',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString()
    };
    
    console.log('Network: API連接測試結果:', result);
    return result;
    
  } catch (error) {
    const result = {
      success: false,
      error: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    };
    
    console.error('Network: API連接測試失敗:', result);
    return result;
  }
};

// 獲取詳細的網路診斷信息
export const getNetworkDiagnostics = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    } : null,
    device: {
      isMobile: isMobileDevice(),
      isIOS: isIOSDevice(),
      isAndroid: isAndroidDevice()
    },
    location: {
      href: window.location.href,
      origin: window.location.origin,
      protocol: window.location.protocol,
      host: window.location.host
    }
  };
  
  // 測試API連接
  try {
    diagnostics.apiTest = await testAPIConnection();
  } catch (error) {
    diagnostics.apiTest = {
      success: false,
      error: error.message
    };
  }
  
  console.log('Network: 網路診斷信息:', diagnostics);
  return diagnostics;
};

// 格式化網路診斷信息為可讀文本
export const formatDiagnosticsForDisplay = (diagnostics) => {
  const lines = [
    `時間: ${diagnostics.timestamp}`,
    `網路狀態: ${diagnostics.onLine ? '在線' : '離線'}`,
    `設備類型: ${diagnostics.device.isMobile ? '移動設備' : '桌面設備'}`,
    `操作系統: ${diagnostics.device.isIOS ? 'iOS' : diagnostics.device.isAndroid ? 'Android' : '其他'}`,
    `瀏覽器: ${diagnostics.userAgent}`,
    `當前頁面: ${diagnostics.location.href}`,
    `協議: ${diagnostics.location.protocol}`,
    `主機: ${diagnostics.location.host}`
  ];
  
  if (diagnostics.connection) {
    lines.push(`連接類型: ${diagnostics.connection.effectiveType}`);
    lines.push(`下載速度: ${diagnostics.connection.downlink} Mbps`);
    lines.push(`延遲: ${diagnostics.connection.rtt} ms`);
  }
  
  if (diagnostics.apiTest) {
    lines.push(`API測試: ${diagnostics.apiTest.success ? '成功' : '失敗'}`);
    if (!diagnostics.apiTest.success) {
      lines.push(`API錯誤: ${diagnostics.apiTest.error || diagnostics.apiTest.statusText}`);
    }
  }
  
  return lines.join('\n');
};