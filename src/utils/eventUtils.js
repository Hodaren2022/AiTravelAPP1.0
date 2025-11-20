/**
 * 事件處理工具函數
 * 用於安全地處理觸摸事件和防止 passive event listener 錯誤
 */

/**
 * 安全地調用 preventDefault，避免 passive event listener 錯誤
 * @param {Event} event - 事件對象
 */
export const safePreventDefault = (event) => {
  if (event && event.cancelable) {
    event.preventDefault();
  }
};

/**
 * 安全地調用 stopPropagation
 * @param {Event} event - 事件對象
 */
export const safeStopPropagation = (event) => {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
};

/**
 * 添加觸摸事件監聽器，自動處理 passive 選項
 * @param {Element} element - 目標元素
 * @param {string} eventType - 事件類型 (如 'touchmove', 'touchstart')
 * @param {Function} handler - 事件處理函數
 * @param {boolean} needsPreventDefault - 是否需要調用 preventDefault
 * @returns {Function} 清理函數
 */
export const addTouchEventListener = (element, eventType, handler, needsPreventDefault = false) => {
  if (!element || !eventType || !handler) {
    console.warn('addTouchEventListener: 缺少必要參數');
    return () => {};
  }

  const options = needsPreventDefault ? { passive: false } : { passive: true };
  
  // 包裝處理函數，添加安全檢查
  const wrappedHandler = (event) => {
    try {
      handler(event);
    } catch (error) {
      console.error('事件處理函數執行錯誤:', error);
    }
  };

  element.addEventListener(eventType, wrappedHandler, options);

  // 返回清理函數
  return () => {
    element.removeEventListener(eventType, wrappedHandler, options);
  };
};

/**
 * 批量添加事件監聽器
 * @param {Element} element - 目標元素
 * @param {Array} eventConfigs - 事件配置數組
 * @returns {Function} 清理所有事件監聽器的函數
 */
export const addMultipleEventListeners = (element, eventConfigs) => {
  const cleanupFunctions = [];

  eventConfigs.forEach(({ eventType, handler, needsPreventDefault = false }) => {
    const cleanup = addTouchEventListener(element, eventType, handler, needsPreventDefault);
    cleanupFunctions.push(cleanup);
  });

  // 返回清理所有事件監聽器的函數
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};

/**
 * 檢測瀏覽器是否支持 touch-action CSS 屬性
 * @returns {boolean} 是否支持 touch-action
 */
export const supportsTouchAction = () => {
  if (typeof document === 'undefined') return false;
  return 'touchAction' in document.documentElement.style;
};

/**
 * 為元素設置 touch-action 屬性，提供降級支持
 * @param {Element} element - 目標元素
 * @param {string} touchAction - touch-action 值
 */
export const setTouchAction = (element, touchAction) => {
  if (!element) return;

  if (supportsTouchAction()) {
    element.style.touchAction = touchAction;
  } else {
    // 對於不支持 touch-action 的瀏覽器，添加數據屬性作為標記
    element.setAttribute('data-touch-action', touchAction);
  }
};

/**
 * 創建拖拽處理器，自動處理觸摸和鼠標事件
 * @param {Object} options - 配置選項
 * @returns {Object} 拖拽處理器對象
 */
export const createDragHandler = (options = {}) => {
  const {
    onDragStart = () => {},
    onDragMove = () => {},
    onDragEnd = () => {}
  } = options;

  let isDragging = false;
  let startPosition = { x: 0, y: 0 };

  const handleStart = (clientX, clientY, event) => {
    safePreventDefault(event);
    isDragging = true;
    startPosition = { x: clientX, y: clientY };
    onDragStart({ x: clientX, y: clientY, event });
  };

  const handleMove = (clientX, clientY, event) => {
    if (!isDragging) return;
    safePreventDefault(event);
    onDragMove({ 
      x: clientX, 
      y: clientY, 
      deltaX: clientX - startPosition.x,
      deltaY: clientY - startPosition.y,
      event 
    });
  };

  const handleEnd = (event) => {
    if (!isDragging) return;
    safePreventDefault(event);
    isDragging = false;
    onDragEnd({ event });
  };

  // 鼠標事件處理器
  const mouseHandlers = {
    mousedown: (e) => handleStart(e.clientX, e.clientY, e),
    mousemove: (e) => handleMove(e.clientX, e.clientY, e),
    mouseup: (e) => handleEnd(e)
  };

  // 觸摸事件處理器
  const touchHandlers = {
    touchstart: (e) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, e);
    },
    touchmove: (e) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, e);
    },
    touchend: (e) => handleEnd(e)
  };

  return {
    mouseHandlers,
    touchHandlers,
    isDragging: () => isDragging,
    reset: () => {
      isDragging = false;
      startPosition = { x: 0, y: 0 };
    }
  };
};

/**
 * 防抖函數，用於優化事件處理性能
 * @param {Function} func - 要防抖的函數
 * @param {number} wait - 等待時間（毫秒）
 * @returns {Function} 防抖後的函數
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 節流函數，用於限制事件處理頻率
 * @param {Function} func - 要節流的函數
 * @param {number} limit - 限制間隔（毫秒）
 * @returns {Function} 節流後的函數
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};