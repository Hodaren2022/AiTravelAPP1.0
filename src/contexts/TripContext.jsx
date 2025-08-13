import { createContext, useState, useEffect, useContext } from 'react';

const TripContext = createContext();

// 定義預設字體大小
const defaultFontSizes = {
  h2: 24,          // 主要標題 (例如 "我的行程")
  h4: 18,          // 卡片標題
  destination: 20, // 卡片中的目的地
  body: 14,        // 一般內文
  small: 12,       // 較小文字 (例如航班資訊)
  label: 14,       // 表單標籤
};

export const TripProvider = ({ children }) => {
  // --- 原有的行程狀態管理 ---
  const [trips, setTrips] = useState(() => {
    const savedTrips = localStorage.getItem('trips');
    return savedTrips ? JSON.parse(savedTrips) : [];
  });

  const [selectedTripId, setSelectedTripId] = useState(() => {
    const lastSelectedTrip = localStorage.getItem('lastSelectedTrip');
    return lastSelectedTrip || '';
  });

  useEffect(() => {
    localStorage.setItem('lastSelectedTrip', selectedTripId);
  }, [selectedTripId]);

  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  // --- 新增的字體大小狀態管理 ---
  const [fontSizes, setFontSizes] = useState(() => {
    try {
      const savedFontSizes = localStorage.getItem('fontSizes');
      // 合併儲存的設定與預設值，避免未來新增設定時出錯
      return savedFontSizes ? { ...defaultFontSizes, ...JSON.parse(savedFontSizes) } : defaultFontSizes;
    } catch (error) {
      console.error("Failed to parse font sizes from localStorage", error);
      return defaultFontSizes;
    }
  });

  useEffect(() => {
    localStorage.setItem('fontSizes', JSON.stringify(fontSizes));
  }, [fontSizes]);


  // --- 提供給所有子元件的值 ---
  const value = {
    trips,
    setTrips,
    selectedTripId,
    setSelectedTripId,
    fontSizes,      // 提供字體大小設定
    setFontSizes,   // 提供更新字體大小的函式
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

// 自定義鉤子，方便使用上下文
export const useTrip = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrip 必須在 TripProvider 內使用');
  }
  return context;
};

export default TripContext;
