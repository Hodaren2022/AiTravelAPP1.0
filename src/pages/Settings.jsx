import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTrip } from '../contexts/TripContext';

// --- Styled Components ---
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const PageName = styled.span`
  flex: 1;
`;

const ToggleButton = styled.button`
  background-color: ${props => props.$active ? '#1abc9c' : '#95a5a6'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.7 : 1};
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  margin-right: 0.5rem;
`;

const SliderContainer = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Slider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  background: #ddd;
  border-radius: 5px;
  outline: none;
  opacity: 0.7;
  transition: opacity .2s;

  &:hover {
    opacity: 1;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #3498db;
    cursor: pointer;
    border-radius: 50%;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #3498db;
    cursor: pointer;
    border-radius: 50%;
  }
`;

const FontSizeValue = styled.span`
  font-weight: bold;
  min-width: 40px;
  text-align: right;
`;

const StorageCard = styled(Card)``;
const StorageHeader = styled.div` display: flex; align-items: center; margin-bottom: 1rem; `;
const StorageIcon = styled.div`
  width: 24px; height: 24px; margin-right: 0.5rem; display: flex; align-items: center;
  justify-content: center; border-radius: 50%;
  background-color: ${props => {
    if (props.$usage < 50) return '#2ecc71';
    if (props.$usage < 80) return '#f39c12';
    return '#e74c3c';
  }};
  color: white; font-size: 12px; font-weight: bold;
`;
const ProgressBar = styled.div` width: 100%; height: 20px; background-color: #ecf0f1; border-radius: 10px; overflow: hidden; margin-bottom: 0.5rem; `;
const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, 
    ${props => {
      if (props.$usage < 50) return '#2ecc71, #27ae60';
      if (props.$usage < 80) return '#f39c12, #e67e22';
      return '#e74c3c, #c0392b';
    }}
  );
  width: ${props => props.$usage}%;
  transition: width 0.3s ease;
`;
const StorageDetails = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 1rem; font-size: 0.9rem; `;
const StorageItem = styled.div` display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #eee; &:last-child { border-bottom: none; } `;
const RefreshButton = styled.button` background-color: #95a5a6; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: auto; `;

// Color theme selection styled components
const PaletteGrid = styled.div`
  display: grid;
  /* single column on desktop to avoid side-by-side overlap */
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

const PaletteCard = styled.div`
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.6rem;
  display: grid;
  grid-template-columns: 1fr minmax(160px, 220px); /* content | actions */
  gap: 12px;
  align-items: center;
  cursor: pointer;
  min-height: 56px;
  transition: box-shadow 0.15s ease, transform 0.08s ease;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); transform: translateY(-2px); }
  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const SwatchRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
`;

const Swatch = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.08);
  flex-shrink: 0;
`;

const PaletteLabel = styled.div`
  font-size: 0.95rem;
  color: #333;
  margin-left: 0.75rem;
  white-space: nowrap; /* prevent vertical wrapping */
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SelectedMark = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #1abc9c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
`;

// Inline button for palette actions (no extra top margin)
const InlineButton = styled(Button)`
  margin-top: 0;
  padding: 0.35rem 0.6rem;
  min-width: 64px;
  font-size: 0.9rem;
`;

// Action group to align buttons in the same column
const ActionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
  min-width: 220px; /* fixed column width for alignment */
  flex-shrink: 0;
  @media (max-width: 600px) {
    /* on small screens, allow actions to flow and align right below content */
    min-width: auto;
    justify-content: flex-end;
    width: 100%;
    padding-left: 6px;
  }
`;

const availablePages = [
  { id: 'tripManagement', name: '行程管理', path: '/', default: true },
  { id: 'dailyItinerary', name: '每日行程', path: '/daily', default: true },
  { id: 'hotelInfo', name: '旅館資訊', path: '/hotel', default: true },
  { id: 'travelTips', name: '旅遊須知', path: '/tips', default: true },
  { id: 'packingList', name: '物品清單', path: '/packing', default: true },
  { id: 'travelNotes', name: '旅遊筆記', path: '/notes', default: true },
  { id: 'expenseTracker', name: '消費追蹤', path: '/expenses', default: true },
  { id: 'notes', name: '記事本', path: '/notebook', default: true },
  { id: 'dataManagement', name: '數據管理', path: '/data', default: true },
  { id: 'settings', name: '設定', path: '/settings', default: true }
];

const fontSettingConfig = {
  h2: { label: '主要標題', min: 20, max: 32 },
  h4: { label: '卡片標題', min: 16, max: 26 },
  destination: { label: '目的地文字', min: 16, max: 28 },
  body: { label: '一般內文', min: 12, max: 20 },
  small: { label: '小型文字', min: 10, max: 16 },
  label: { label: '表單標籤', min: 12, max: 18 },
};

const defaultFontSizes = {
  h2: 24, h4: 18, destination: 20, body: 14, small: 12, label: 14,
};

const Settings = () => {
  const { fontSizes, setFontSizes, previewThemeFn, applyThemeFn, clearThemeFn, appliedTheme } = useTrip();

  // color palettes
  const colorPalettes = [
    { id: 'pink', name: '粉紅色系', colors: ['#FCF9EA','#BADFDB','#FFA4A4','#FFBDBD'] },
    { id: 'violet', name: '紫羅蘭', colors: ['#4E56C0','#9B5DE0','#D78FEE','#FDCFFA'] },
    { id: 'lightPurple', name: '淺紫調', colors: ['#FFF2E0','#C0C9EE','#A2AADB','#898AC4'] },
    { id: 'sunset', name: '強烈晚霞', colors: ['#FFB200','#EB5B00','#D91656','#640D5F'] },
    { id: 'matureOrange', name: '成熟橘', colors: ['#32012F','#524C42','#E2DFD0','#F97300'] }
  ];

  const [colorTheme, setColorTheme] = useState(appliedTheme ? appliedTheme.id : null);

  useEffect(() => {
    setColorTheme(appliedTheme ? appliedTheme.id : null);
  }, [appliedTheme]);

  const handlePreview = (p) => {
    previewThemeFn(p);
  };

  const handleApply = (p) => {
    applyThemeFn(p);
    setColorTheme(p.id);
  };

  const handleClear = () => {
    clearThemeFn();
    setColorTheme(null);
  };

  const [pageSettings, setPageSettings] = useState(() => {
    const savedSettings = localStorage.getItem('pageSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    } else {
      const defaultSettings = {};
      availablePages.forEach(page => {
        defaultSettings[page.id] = page.default;
      });
      return defaultSettings;
    }
  });
  
  const [tempSettings, setTempSettings] = useState({...pageSettings});
  
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 5 * 1024 * 1024, // 5MB
    details: {}
  });

  useEffect(() => {
    setTempSettings({...pageSettings});
  }, [pageSettings]);
  
  const calculateStorageUsage = () => {
    const storageKeys = ['trips', 'hotels', 'itineraries', 'packingLists', 'travelNotes', 'travelTips', 'expenses', 'notes', 'pageSettings', 'fontSizes'];
    let totalUsed = 0;
    const details = {};
    storageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        const size = new Blob([data]).size;
        details[key] = size;
        totalUsed += size;
      }
    });
    setStorageInfo({ used: totalUsed, total: 5 * 1024 * 1024, details });
  };
  
  useEffect(() => {
    calculateStorageUsage();
  }, []);
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getUsagePercentage = () => {
    return Math.round((storageInfo.used / storageInfo.total) * 100);
  };
  
  const getChineseKeyName = (key) => {
    const keyMap = { 'trips': '行程資料', 'hotels': '旅館資訊', 'itineraries': '每日行程', 'packingLists': '物品清單', 'travelNotes': '旅遊筆記', 'travelTips': '旅遊須知', 'expenses': '消費追蹤', 'notes': '記事本', 'pageSettings': '頁面設定', 'fontSizes': '字體設定' };
    return keyMap[key] || key;
  };

  const handlePageToggle = (pageId) => {
    if (pageId === 'tripManagement' || pageId === 'settings') return;
    setTempSettings(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };
  
  const saveSettings = () => {
    localStorage.setItem('pageSettings', JSON.stringify(tempSettings));
    setPageSettings(tempSettings);
    window.dispatchEvent(new Event('storage'));
    calculateStorageUsage();
    alert('設定已保存！部分設定可能需要刷新頁面才能生效。');
  };

  const resetToDefaults = () => {
    const defaultSettings = {};
    availablePages.forEach(page => { defaultSettings[page.id] = page.default; });
    setTempSettings(defaultSettings);
  };

  const handleFontSizeChange = (e) => {
    const { name, value } = e.target;
    setFontSizes(prevSizes => ({ ...prevSizes, [name]: parseInt(value, 10) }));
  };

  const resetFontSizes = () => {
    setFontSizes(defaultFontSizes);
  };

  return (
    <Container>
      <h2>應用設定</h2>

      <Card>
        <h3>外觀設定</h3>
        {Object.entries(fontSettingConfig).map(([key, config]) => (
          <SettingItem key={key}>
            <PageName>{config.label}</PageName>
            <SliderContainer>
              <Slider 
                type="range" 
                min={config.min}
                max={config.max}
                name={key}
                value={fontSizes[key] || config.min}
                onChange={handleFontSizeChange}
              />
              <FontSizeValue>{fontSizes[key] || config.min}px</FontSizeValue>
            </SliderContainer>
          </SettingItem>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button onClick={resetFontSizes} style={{backgroundColor: '#95a5a6'}}>重置字體</Button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <h4>介面色調</h4>
          <p>選擇一組配色，系統會儲存你的選擇以供跨頁面使用：</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div />
            <div>
              <Button onClick={handleClear} style={{ backgroundColor: '#e74c3c' }}>清除色調</Button>
            </div>
          </div>
          <PaletteGrid>
            {colorPalettes.map(p => (
              <PaletteCard key={p.id} style={{ borderColor: colorTheme === p.id ? '#1abc9c' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <SwatchRow>
                    {p.colors.map((c, idx) => <Swatch key={idx} style={{ backgroundColor: c }} />)}
                  </SwatchRow>
                  <PaletteLabel>{p.name}</PaletteLabel>
                </div>
                <ActionGroup>
                  <InlineButton onClick={() => handlePreview(p)} style={{ backgroundColor: '#95a5a6' }}>預覽</InlineButton>
                  <InlineButton onClick={() => handleApply(p)}>套用</InlineButton>
                  {colorTheme === p.id ? <SelectedMark>✓</SelectedMark> : <div style={{ width:20 }} />}
                </ActionGroup>
              </PaletteCard>
            ))}
          </PaletteGrid>
        </div>
      </Card>

      <StorageCard>
        <StorageHeader>
          <StorageIcon $usage={getUsagePercentage()}>
            {getUsagePercentage() < 50 ? '✓' : getUsagePercentage() < 80 ? '!' : '⚠'}
          </StorageIcon>
          <h3 style={{ margin: 0, flex: 1 }}>儲存容量使用情況</h3>
          <RefreshButton onClick={calculateStorageUsage}>🔄 刷新</RefreshButton>
        </StorageHeader>
        <ProgressBar><ProgressFill $usage={getUsagePercentage()} /></ProgressBar>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>已使用: {formatFileSize(storageInfo.used)}</span>
          <span>總容量: {formatFileSize(storageInfo.total)} ({getUsagePercentage()}%)</span>
        </div>
        <StorageDetails>
          {Object.entries(storageInfo.details).filter(([, size]) => size > 0).sort(([,a], [,b]) => b - a).map(([key, size]) => (
              <StorageItem key={key}><span>{getChineseKeyName(key)}</span><span>{formatFileSize(size)}</span></StorageItem>
          ))}
        </StorageDetails>
      </StorageCard>
      
      <Card>
        <h3>頁面顯示設定</h3>
        <p>選擇要在導航欄中顯示的頁面：</p>
        {availablePages.map(page => (
          <SettingItem key={page.id}>
            <PageName>
              {page.name}
              {(page.id === 'tripManagement' || page.id === 'settings') && <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '0.5rem' }}>(必須顯示)</span>}
            </PageName>
            <ToggleButton $active={tempSettings[page.id]} $disabled={page.id === 'tripManagement' || page.id === 'settings'} onClick={() => handlePageToggle(page.id)}>
              {tempSettings[page.id] ? '顯示' : '隱藏'}
            </ToggleButton>
          </SettingItem>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button onClick={saveSettings}>保存頁面設定</Button>
          <Button onClick={resetToDefaults}>重置頁面</Button>
        </div>
      </Card>
    </Container>
  );
};

export default Settings;