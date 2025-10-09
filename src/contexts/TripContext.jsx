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

  // --- Theme (color palettes) 管理 ---
  const [appliedTheme, setAppliedTheme] = useState(() => {
    try {
      const raw = localStorage.getItem('colorTheme');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const [previewTheme, setPreviewTheme] = useState(null);

  // helper: apply CSS variables to :root based on a palette object { id, name, colors: [] }
  const applyCssVars = (palette) => {
    try {
      const root = document && document.documentElement;
      if (!root) return;
      if (!palette || !palette.colors) {
        // clear theme vars
        root.style.removeProperty('--theme-1');
        root.style.removeProperty('--theme-2');
        root.style.removeProperty('--theme-3');
        root.style.removeProperty('--theme-4');
        root.style.removeProperty('--theme-accent');
        return;
      }
      const cols = palette.colors;
      root.style.setProperty('--theme-1', cols[0] || '');
      root.style.setProperty('--theme-2', cols[1] || '');
      root.style.setProperty('--theme-3', cols[2] || '');
      root.style.setProperty('--theme-4', cols[3] || '');
      // accent color for buttons / highlights
      root.style.setProperty('--theme-accent', cols[3] || cols[0] || '');
    } catch (e) {
      console.error('applyCssVars error', e);
    }
  };

  // apply persisted theme on mount
  useEffect(() => {
    if (appliedTheme) applyCssVars(appliedTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const previewThemeFn = (palette) => {
    setPreviewTheme(palette);
    applyCssVars(palette);
  };

  const applyThemeFn = (palette) => {
    try {
      localStorage.setItem('colorTheme', JSON.stringify(palette));
      setAppliedTheme(palette);
      setPreviewTheme(null);
      applyCssVars(palette);
      // notify other tabs
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('applyTheme failed', e);
    }
  };

  const clearThemeFn = () => {
    try {
      localStorage.removeItem('colorTheme');
      setAppliedTheme(null);
      setPreviewTheme(null);
      applyCssVars(null);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('clearTheme failed', e);
    }
  };


  // --- 提供給所有子元件的值 ---
  const value = {
    trips,
    setTrips,
    selectedTripId,
    setSelectedTripId,
    fontSizes,      // 提供字體大小設定
    setFontSizes,   // 提供更新字體大小的函式
    // theme helpers
    appliedTheme,
    previewTheme,
    previewThemeFn,
    applyThemeFn,
    clearThemeFn,
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
