import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTrip } from '../contexts/TripContext';

// 動態導入，避免在沒有安裝套件時出錯
let saveAs;
let Document, Packer, Paragraph, TextRun, HeadingLevel;

// 將 pdfMake 變數移到 Promise 外部，並初始化為 null
let pdfMakeInstance = null;

// 嘗試導入file-saver和docx套件
try {
  import('file-saver').then(module => {
    saveAs = module.saveAs;
  }).catch(err => console.error('無法載入file-saver:', err));

  import('docx').then(module => {
    Document = module.Document;
    Packer = module.Packer;
    Paragraph = module.Paragraph;
    TextRun = module.TextRun;
    HeadingLevel = module.HeadingLevel;
  }).catch(err => console.error('無法載入docx:', err));
} catch (error) {
  console.error('動態導入docx和file-saver套件失敗:', error);
}

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
      // ****** 新增 console.log 來檢查 vfs_fonts 模組的實際結構 ******
      console.log('Loaded vfs_fonts module:', module);
      // ******************************************************************

      // 檢查 pdfMakeInstance 是否已經成功載入
      if (!pdfMakeInstance) {
        console.error('pdfMakeInstance 在字體載入後為空');
        throw new Error('pdfMake物件初始化失敗');
      }

      // 嘗試多種可能的路徑來獲取vfs字體數據並註冊
      if (module && module.pdfMake && module.pdfMake.vfs) {
        // 路徑 1: module.pdfMake.vfs
        pdfMakeInstance.vfs = module.pdfMake.vfs;
        console.log('pdfMake 字體 (vfs) 從 module.pdfMake.vfs 載入並註冊完成');
        resolve(pdfMakeInstance);
      } else if (module && module.vfs) {
        // 路徑 2: module.vfs (較少見，但有可能)
        pdfMakeInstance.vfs = module.vfs;
        console.log('pdfMake 字體 (vfs) 從 module.vfs 載入並註冊完成');
        resolve(pdfMakeInstance);
      } else if (module && module.default && module.default.vfs) {
        // 路徑 3: module.default.vfs (如果 vfs_fonts 是 default export)
        pdfMakeInstance.vfs = module.default.vfs;
        console.log('pdfMake 字體 (vfs) 從 module.default.vfs 載入並註冊完成');
        resolve(pdfMakeInstance);
      } else if (window && window.pdfMake && window.pdfMake.vfs) {
        // 路徑 4: 檢查全局 window.pdfMake.vfs (如果 vfs_fonts 是通過 script 標籤載入的)
        pdfMakeInstance.vfs = window.pdfMake.vfs;
        console.log('pdfMake 字體 (vfs) 使用全局 window.pdfMake.vfs');
        resolve(pdfMakeInstance);
      } else {
        // 路徑 5: 嘗試遍歷模組的所有屬性，尋找可能的vfs對象
        let vfsFound = false;

        // 遍歷第一層屬性
        for (const key in module) {
          if (module[key] && typeof module[key] === 'object') {
            // 檢查是否有vfs屬性
            if (module[key].vfs) {
              pdfMakeInstance.vfs = module[key].vfs;
              console.log(`pdfMake 字體 (vfs) 從 module[${key}].vfs 載入並註冊完成`);
              vfsFound = true;
              break;
            }

            // 檢查第二層屬性
            for (const subKey in module[key]) {
              if (module[key][subKey] && typeof module[key][subKey] === 'object' && module[key][subKey].vfs) {
                pdfMakeInstance.vfs = module[key][subKey].vfs;
                console.log(`pdfMake 字體 (vfs) 從 module[${key}][${subKey}].vfs 載入並註冊完成`);
                vfsFound = true;
                break;
              }
            }

            if (vfsFound) break;
          }
        }

        if (vfsFound) {
          resolve(pdfMakeInstance);
        } else {
          // 如果以上所有檢查都失敗，則字體載入或結構異常
          console.warn('無法找到有效的vfs字體路徑，將使用默認字體');
          // 設置一個空的vfs對象，讓pdfMake使用默認字體
          pdfMakeInstance.vfs = pdfMakeInstance.vfs || {};
          console.log('設置空的vfs對象，將使用默認字體 (可能導致中文亂碼)');
          resolve(pdfMakeInstance);
        }
      }
    }).catch(err => {
      // 捕獲前面任何一個環節（載入主模組、載入字體）的錯誤
      console.error('pdfMake或字體載入過程中出錯 (來自 Promise 鏈):', err);
      // 讓 pdfMakeReady Promise 失敗
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

// 改進的exportToWord函數，具有更好的錯誤處理和更簡單的結構
const exportToWord = async () => {
  console.log('開始Word匯出流程...');

  // 在進行之前確保docx模組已經載入
  if (!Document || !Packer || !Paragraph || !TextRun || !saveAs) {
    console.error('必要的docx模組尚未載入');
    alert('無法匯出Word文件，請確保已安裝必要的套件 (docx 和 file-saver)。');
    return;
  }

  try {
    const allData = getAllData();
    console.log('數據獲取成功');

    // 創建更直接的文件結構
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: generateWordContent(allData)
        }
      ]
    });

    console.log('文件物件創建完成，生成blob中...');

    // 使用Promise處理以便更好地追蹤錯誤
    try {
      const blob = await Packer.toBlob(doc);
      console.log('Blob生成成功，大小:', blob.size);

      // 使用更安全的檔案名（避免特殊字元）
      const filename = `旅遊應用程式_數據_${new Date().toISOString().slice(0, 10)}.docx`;
      saveAs(blob, filename);
      console.log('檔案下載已啟動:', filename);
    } catch (blobError) {
      console.error('生成文件blob失敗:', blobError);
      alert(`生成文件失敗: ${blobError.message}`);
    }
  } catch (error) {
    console.error('Word文件匯出失敗:', error);
    alert(`匯出Word文件失敗: ${error.message}`);
  }
};

// 生成Word文檔內容的輔助函數
const generateWordContent = (data) => {
  const children = [];

  // 添加標題
  children.push(
    new Paragraph({
      text: '旅遊應用程式數據匯出',
      heading: HeadingLevel.HEADING_1,
      alignment: 'center' // docx
    })
  );

  // 添加行程信息
  children.push(
    new Paragraph({
      text: '行程信息',
      heading: HeadingLevel.HEADING_2
    })
  );

  if (data.trips && data.trips.length > 0) {
    data.trips.forEach(trip => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `行程名稱: ${trip.name || '未命名'}`, bold: true }),
            new TextRun({ text: `\n開始日期: ${trip.startDate || '未知'}`, break: 1 }),
            new TextRun({ text: `\n結束日期: ${trip.endDate || '未知'}`, break: 1 }),
            new TextRun({ text: `\n目的地: ${trip.destination || '未知'}`, break: 1 }),
            // new TextRun({ text: '\n' }) // 可選的額外換行
          ],
          spacing: { after: 200 } // 段後間距
        })
      );
    });
  } else {
    children.push(
      new Paragraph({
        text: '無行程數據'
      })
    );
  }

  // 添加其他數據類型
  const dataTypes = [
    { name: '酒店信息', key: 'hotels' },
    { name: '每日行程', key: 'itineraries' },
    { name: '打包清單', key: 'packingLists' },
    { name: '旅遊筆記', key: 'travelNotes' },
    { name: '旅遊須知', key: 'travelTips' }
  ];

  dataTypes.forEach(type => {
    children.push(
      new Paragraph({
        text: type.name,
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: true // 在每個新的數據類型前分頁
      })
    );

    const typeData = data[type.key];
    // 檢查 typeData 是否存在且不為空對象或空陣列
    const hasContent = typeData &&
                       (Array.isArray(typeData) ? typeData.length > 0 : Object.keys(typeData).length > 0);

    if (hasContent) {
      // 嘗試更美觀地呈現JSON數據，或根據數據結構自定義呈現方式
      // 這裡仍然使用 JSON.stringify 作為基礎，但可以根據需要擴展
      const contentArray = [];
      if (Array.isArray(typeData)) { // 如果是陣列 (例如 travelNotes[tripId] 可能是陣列)
          typeData.forEach(item => {
              contentArray.push(new TextRun({ text: JSON.stringify(item, null, 2), break:1 }));
          });
      } else if (typeof typeData === 'object') { // 如果是物件 (例如 travelNotes 本身)
          for(const key in typeData) {
              if (Object.prototype.hasOwnProperty.call(typeData, key)) {
                  contentArray.push(new TextRun({ text: `行程ID: ${key}`, bold: true, break: 2}));
                  const tripSpecificData = typeData[key];
                  if (Array.isArray(tripSpecificData)) {
                      tripSpecificData.forEach(item => {
                           contentArray.push(new TextRun({ text: JSON.stringify(item, null, 2), break: 1 }));
                      });
                  } else {
                       contentArray.push(new TextRun({ text: JSON.stringify(tripSpecificData, null, 2), break: 1 }));
                  }
              }
          }

      } else {
           contentArray.push(new TextRun({ text: JSON.stringify(typeData, null, 2) }));
      }

      children.push(new Paragraph({ children: contentArray }));

    } else {
      children.push(
        new Paragraph({
          text: `無${type.name}數據`
        })
      );
    }
  });

  return children;
};

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
        <Button onClick={exportAllData}>
          匯出所有數據 (JSON)
        </Button>

        <Button onClick={exportToWord}>
          匯出為Word文檔
        </Button>

        <label>
          <input
            type="file"
            accept=".json"
            onChange={importData}
            style={{ display: 'none' }}
          />
          <Button as="span">
            匯入數據
          </Button>
        </label>
      </ButtonGroup>
    </Card>
  </Container>
);
};

export default DataManagement;