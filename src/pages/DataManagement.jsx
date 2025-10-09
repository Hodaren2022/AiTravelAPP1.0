import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTrip } from '../contexts/TripContext';

// 將 pdfMake 變數移到 Promise 外部，並初始化為 null
let pdfMakeInstance = null;

// 單獨處理PDF相關的導入，使用Promise確保順序正確
const pdfMakeReady = new Promise((resolve, reject) => {
  try {
    // 1. 載入 pdfmake 主模組
    import('pdfmake/build/pdfmake').then(module => {
      // 嘗試多種可能的方式獲取pdfMake實例
      if (module.default) {
        pdfMakeInstance = module.default;
        console.log('pdfmake 從 module.default 載入完成');
      } else if (module.pdfMake) {
        pdfMakeInstance = module.pdfMake;
        console.log('pdfmake 從 module.pdfMake 載入完成');
      } else if (window && window.pdfMake) {
        pdfMakeInstance = window.pdfMake;
        console.log('pdfmake 從 window.pdfMake 載入完成');
      } else {
        // 遍歷模組尋找可能的pdfMake對象
        for (const key in module) {
          if (module[key] && typeof module[key] === 'object' && module[key].createPdf) {
            pdfMakeInstance = module[key];
            console.log(`pdfmake 從 module[${key}] 載入完成`);
            break;
          }
        }
      }

      if (!pdfMakeInstance) {
        throw new Error("pdfmake主模組載入失敗，無法找到有效的pdfMake對象");
      }

      // 2. 主模組載入成功後，載入字體模組
      return import('pdfmake/build/vfs_fonts');
    }).then(module => {
      // 確保 pdfMakeInstance 已載入
      if (!pdfMakeInstance) {
        console.error('pdfMakeInstance 在字體載入後為空');
        throw new Error('pdfMake物件初始化失敗');
      }

      // 嘗試從 vfs_fonts 模組中直接獲取 vfs
      // 根據 pdfmake 的打包方式，vfs 可能在 module.pdfMake.vfs 或 module.default.pdfMake.vfs
      if (module && module.pdfMake && module.pdfMake.vfs) {
        pdfMakeInstance.vfs = module.pdfMake.vfs;
        console.log('pdfMake vfs 從 module.pdfMake.vfs 載入並註冊完成');
      } else if (module && module.default && module.default.pdfMake && module.default.pdfMake.vfs) {
        pdfMakeInstance.vfs = module.default.pdfMake.vfs;
        console.log('pdfMake vfs 從 module.default.pdfMake.vfs 載入並註冊完成');
      } else {
        console.warn('無法找到有效的vfs字體路徑，將使用默認字體。');
        // 設置一個空的vfs對象，讓pdfMake使用默認字體
        pdfMakeInstance.vfs = pdfMakeInstance.vfs || {};
      }

      // 定義字體
      // 注意：如果需要顯示中文字符，您需要在此處添加中文字體配置
      pdfMakeInstance.fonts = {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italics.ttf',
          bolditalics: 'Roboto-MediumItalics.ttf'
        }
      };
      resolve(pdfMakeInstance);
    }).catch(err => {
      console.error('pdfMake或字體載入過程中出錯 (來自 Promise 鏈):', err);
      reject(err);
    });
  } catch (error) {
    console.error('動態導入pdfMake流程啟動失敗 (來自 Try/Catch):', error);
    reject(error);
  }
});


const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem; /* 增加按鈕間距以獲得更好的視覺效果 */
  margin-top: 1rem;
  align-items: center; /* 垂直居中對齊 */
  flex-wrap: wrap; /* 當空間不足時允許按鈕換行 */
`;

const Button = styled.button`
  background-color: #3498db; /* 主色調 */
  color: white;
  border: none;
  padding: 0.75rem 1.5rem; /* 調整 padding 使按鈕大小更合適 */
  border-radius: 4px;
  cursor: pointer;
  min-width: 180px; /* 設置統一的最小寬度，確保大小一致 */
  text-align: center;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }
`;

// 新增警告文字的 styled-component
const WarningText = styled.p`
  color: red;
  font-weight: bold;
  margin-bottom: 1rem; /* 與按鈕組的間距 */
  text-align: center; /* 文字居中 */
`;


const DataManagement = () => {
  const { trips } = useTrip();

  // 從localStorage獲取所有數據
  const getAllData = () => {
    const data = {
      trips: trips, // trips 從 context 獲取，可能不是最新的，如果其他地方也修改localStorage中的trips
      hotels: JSON.parse(localStorage.getItem('hotels') || '{}'),
      itineraries: JSON.parse(localStorage.getItem('itineraries') || '{}'),
      packingLists: JSON.parse(localStorage.getItem('packingLists') || '{}'),
      travelNotes: JSON.parse(localStorage.getItem('travelNotes') || '{}'),
      travelTips: JSON.parse(localStorage.getItem('travelTips') || '{}'),
    };
     // 如果 trips 也主要通過 localStorage 管理，可以考慮也從 localStorage 讀取以確保一致性
     const storedTrips = localStorage.getItem('trips');
     if (storedTrips) {
         data.trips = JSON.parse(storedTrips);
     }
    return data;
  };

  // 匯出所有數據
  const exportAllData = () => {
    const allData = getAllData();
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `travel_app_data_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Helper: unique array by id (keep existing first)
  const uniqueById = (existing = [], incoming = []) => {
    const map = new Map();
    existing.forEach(item => { if (item && item.id) map.set(item.id, item); else if (item) map.set(JSON.stringify(item), item); });
    incoming.forEach(item => { if (item && item.id) { if (!map.has(item.id)) map.set(item.id, item); } else if (item) { const k = JSON.stringify(item); if (!map.has(k)) map.set(k, item); } });
    return Array.from(map.values());
  };

  // 匯出分組（按 trip 分類）- 會把所有 page 的資料按照 tripId 分組，並將全域資料放入 unassigned
  const exportAllDataGrouped = () => {
    const meta = { version: 1, exportedAt: new Date().toISOString(), appVersion: 'v1.1' };

    const storedTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const expenses = JSON.parse(localStorage.getItem('expenses') || '{}');
    const packingLists = JSON.parse(localStorage.getItem('packingLists') || '{}');
    const travelNotes = JSON.parse(localStorage.getItem('travelNotes') || '{}');
    const travelTips = JSON.parse(localStorage.getItem('travelTips') || '{}');
    const hotels = JSON.parse(localStorage.getItem('hotels') || '{}');
    const itineraries = JSON.parse(localStorage.getItem('itineraries') || '{}');
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const savedCustomCurrencyPairs = JSON.parse(localStorage.getItem('savedCustomCurrencyPairs') || '[]');
    const lastExchangeRates = JSON.parse(localStorage.getItem('lastExchangeRates') || 'null');
    const pageSettings = JSON.parse(localStorage.getItem('pageSettings') || '{}');
    const fontSizes = JSON.parse(localStorage.getItem('fontSizes') || '{}');

    const byTripId = {};
    // initialize from trips
    (storedTrips || []).forEach(trip => {
      byTripId[trip.id] = {
        trip,
        expenses: expenses[trip.id] || [],
        packingLists: packingLists[trip.id] || [],
        travelNotes: travelNotes[trip.id] || [],
        travelTips: travelTips[trip.id] || [],
        hotels: hotels[trip.id] || [],
        itineraries: itineraries[trip.id] || []
      };
    });

    // include any tripIds present in other keys but not listed in trips
    Object.keys(expenses || {}).forEach(tripId => {
      if (!byTripId[tripId]) {
        byTripId[tripId] = {
          trip: null,
          expenses: expenses[tripId] || [],
          packingLists: packingLists[tripId] || [],
          travelNotes: travelNotes[tripId] || [],
          travelTips: travelTips[tripId] || [],
          hotels: hotels[tripId] || [],
          itineraries: itineraries[tripId] || []
        };
      }
    });

    const payload = {
      meta,
      trips: storedTrips,
      groupedData: {
        byTripId,
        unassigned: {
          notes,
          pageSettings,
          fontSizes,
          savedCustomCurrencyPairs,
          lastExchangeRates
        }
      }
    };

    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    // filename by date range
    let fileNameSuffix = 'all_trips';
    if (storedTrips && storedTrips.length === 1) {
      const t = storedTrips[0];
      fileNameSuffix = `${(t.name || t.id).replace(/[\\/:*?"<>|]/g,'_')}_${t.startDate || ''}`;
    } else if (storedTrips && storedTrips.length > 1) {
      const sorted = [...storedTrips].sort((a,b) => (a.startDate || '').localeCompare(b.startDate || ''));
      if (sorted[0] && sorted[sorted.length-1]) {
        fileNameSuffix = `${sorted[0].startDate || ''}_to_${sorted[sorted.length-1].endDate || ''}`;
      }
    }

    a.href = url;
    a.download = `AiTravel_Grouped_${fileNameSuffix}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // 匯入已分組的資料並合併到現有 localStorage（保留現有，避免重複 id）
  const importAllDataGrouped = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || !parsed.groupedData) {
          alert('匯入檔案不符合預期格式 (缺少 groupedData)。');
          return;
        }

        const importedTrips = parsed.trips || [];
        const byTripId = parsed.groupedData.byTripId || {};
        const unassigned = parsed.groupedData.unassigned || {};

        // Merge trips (array)
        const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
        const tripMap = new Map();
        existingTrips.forEach(t => tripMap.set(t.id, t));
        importedTrips.forEach(t => { if (!tripMap.has(t.id)) tripMap.set(t.id, t); });
        const mergedTrips = Array.from(tripMap.values());
        localStorage.setItem('trips', JSON.stringify(mergedTrips));

        // Keys that are per-trip (object mapping tripId -> array)
        const perTripKeys = ['expenses','packingLists','travelNotes','travelTips','hotels','itineraries'];
        perTripKeys.forEach(key => {
          const existing = JSON.parse(localStorage.getItem(key) || '{}');
          const result = { ...existing };
          Object.keys(byTripId).forEach(tripId => {
            const incomingList = (byTripId[tripId] && byTripId[tripId][key]) || [];
            const baseList = result[tripId] ? result[tripId] : [];
            result[tripId] = uniqueById(baseList, incomingList);
          });
          localStorage.setItem(key, JSON.stringify(result));
        });

        // Merge savedCustomCurrencyPairs (array, unique by toCode)
        const existingPairs = JSON.parse(localStorage.getItem('savedCustomCurrencyPairs') || '[]');
        const importedPairs = unassigned.savedCustomCurrencyPairs || [];
        const pairMap = new Map();
        existingPairs.forEach(p => pairMap.set(p.toCode, p));
        importedPairs.forEach(p => { if (!pairMap.has(p.toCode)) pairMap.set(p.toCode, p); });
        const mergedPairs = Array.from(pairMap.values());
        localStorage.setItem('savedCustomCurrencyPairs', JSON.stringify(mergedPairs));

        // notes (array) - unique by id
        const existingNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        const importedNotes = unassigned.notes || [];
        const mergedNotes = uniqueById(existingNotes, importedNotes);
        localStorage.setItem('notes', JSON.stringify(mergedNotes));

        // pageSettings/fontSizes/lastExchangeRates - validate and merge safely
        const existingPageSettings = JSON.parse(localStorage.getItem('pageSettings') || '{}');
        const existingFontSizes = JSON.parse(localStorage.getItem('fontSizes') || '{}');

        const knownPageKeys = ['tripManagement','dailyItinerary','hotelInfo','travelTips','packingList','travelNotes','expenseTracker','notes','dataManagement','settings'];

        // pageSettings: only merge if imported has at least one true and keys are known; coerce to boolean and remove unknown keys
        if (unassigned.pageSettings && typeof unassigned.pageSettings === 'object') {
          const importedPS = unassigned.pageSettings;
          const validEntries = {};
          let hasTrue = false;
          knownPageKeys.forEach(k => {
            if (Object.prototype.hasOwnProperty.call(importedPS, k)) {
              const v = importedPS[k];
              // Accept true, 'true', 1, '1' as true
              const boolV = (v === true || v === 'true' || v === 1 || v === '1');
              validEntries[k] = Boolean(boolV);
              if (validEntries[k]) hasTrue = true;
            }
          });
          if (hasTrue) {
            const merged = { ...existingPageSettings, ...validEntries };
            // Ensure merged only contains known keys and boolean values
            const cleaned = {};
            knownPageKeys.forEach(k => { cleaned[k] = Boolean(merged[k]); });
            localStorage.setItem('pageSettings', JSON.stringify(cleaned));
          } else {
            // ignore imported pageSettings if empty or all false to avoid hiding UI
            console.log('Ignored imported pageSettings because it was empty or all false');
          }
        }

        // fontSizes: basic validation (accept numbers between 10 and 40)
        if (unassigned.fontSizes && typeof unassigned.fontSizes === 'object') {
          const importedFS = unassigned.fontSizes;
          const validated = { ...existingFontSizes };
          Object.keys(importedFS).forEach(key => {
            const val = parseInt(importedFS[key], 10);
            if (!isNaN(val) && val >= 10 && val <= 40) {
              validated[key] = val;
            } else {
              console.log(`Ignored invalid fontSizes.${key}:`, importedFS[key]);
            }
          });
          localStorage.setItem('fontSizes', JSON.stringify(validated));
        }

        if (unassigned.lastExchangeRates) {
          try {
            const lr = unassigned.lastExchangeRates;
            if (lr && typeof lr === 'object') {
              localStorage.setItem('lastExchangeRates', JSON.stringify(lr));
            } else {
              console.log('Ignored invalid lastExchangeRates in import');
            }
          } catch (e) {
            console.log('Error processing lastExchangeRates:', e);
          }
        }

        alert('匯入並合併完成。請重新整理頁面以載入新數據。');
        window.location.reload();
      } catch (err) {
        console.error('匯入合併失敗:', err);
        alert('匯入失敗：檔案格式錯誤或內容非預期。');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  // 匯入數據
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // 更新localStorage中的所有數據
        if (importedData.trips) localStorage.setItem('trips', JSON.stringify(importedData.trips));
        if (importedData.hotels) localStorage.setItem('hotels', JSON.stringify(importedData.hotels));
        if (importedData.itineraries) localStorage.setItem('itineraries', JSON.stringify(importedData.itineraries));
        if (importedData.packingLists) localStorage.setItem('packingLists', JSON.stringify(importedData.packingLists));
        if (importedData.travelNotes) localStorage.setItem('travelNotes', JSON.stringify(importedData.travelNotes));
        if (importedData.travelTips) localStorage.setItem('travelTips', JSON.stringify(importedData.travelTips));

        alert('數據匯入成功！請重新整理頁面以載入新數據。');
        window.location.reload(); // 重新載入頁面以應用新數據
      } catch (error) {
        console.error('匯入失敗:', error);
        alert('匯入失敗，請確保檔案格式正確。');
      }
    };
    reader.readAsText(file);

    // 重置input，以便可以重複選擇同一個檔案
    event.target.value = null;
  };

// Word export functions removed

// 渲染組件
return (
  <Container>
    <h2>數據管理</h2>

    <Card>
      <h3>匯出/匯入數據</h3>
      <p>您可以匯出所有應用程式數據進行備份，或匯入之前備份的數據。</p>

      {/* 在這裡添加警告文字 */}
      <WarningText>
        此功能尚在開發當中，有可能產生未預期的錯誤
      </WarningText>

      <ButtonGroup>
        <Button onClick={exportAllDataGrouped}>
          匯出所有資料（按行程分組）
        </Button>

        {/* 匯出為 Word 已移除 */}

        <input id="groupedImportInput" type="file" accept=".txt,.json" style={{ display: 'none' }} onChange={importAllDataGrouped} />
        <label htmlFor="groupedImportInput">
          <Button as="span">匯入分組資料（TXT）</Button>
        </label>
        <Button onClick={() => {
          // reset page settings to defaults
          const defaults = {
            tripManagement: true,
            dailyItinerary: true,
            hotelInfo: true,
            travelTips: true,
            packingList: true,
            travelNotes: true,
            expenseTracker: true,
            notes: true,
            dataManagement: true,
            settings: true
          };
          localStorage.setItem('pageSettings', JSON.stringify(defaults));
          window.location.reload();
        }}>恢復預設頁面顯示</Button>
      </ButtonGroup>
    </Card>
  </Container>
);
};

export default DataManagement;