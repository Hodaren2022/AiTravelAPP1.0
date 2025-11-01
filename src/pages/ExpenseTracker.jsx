import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useTrip } from '../contexts/TripContext';

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

const TotalExpenseCard = styled(Card)`
  background-color: #f8f9fa;
  border-left: 4px solid #3498db;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const CurrencyConverterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    gap: 0.8rem;
  }
`;

const CurrencyRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem; /* 調整與上方元素的間距 */
  margin-bottom: 1rem; /* 新增與下方元素的間距 */
  
  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;

const Button = styled.button`
  background-color: ${props =>
    props.$primary ? '#3498db' :
    props.$active ? '#3498db' : // 手動匯率按鈕啟用時的顏色
    props.$danger ? '#e74c3c' : // 刪除按鈕的顏色
    props.$secondary ? '#95a5a6' : // 次要按鈕的顏色
    '#ccc'}; /* 預設或非活動狀態的顏色 */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;

  /* 為刪除按鈕特別指定背景色，因為它不是 primary 也不是 active */
  ${props => props.$danger && `
    background-color: #e74c3c;
  `}
`;

const ExpenseList = styled.div`
  margin-top: 1rem;
`;

const ExpenseItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center; /* 垂直居中 */
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const ExpenseAmount = styled.span`
  font-weight: bold;
  font-size: 1.2rem;
`;

const RateInfoText = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
  display: flex; /* 讓內部元素可以並排 */
  align-items: center; /* 垂直居中 */
  gap: 0.5rem; /* 內部元素間距 */
`;

// 新增用於描述標籤的 styled component 容器
const DescriptionTags = styled.div`
  display: flex;
  flex-wrap: wrap; /* 讓標籤可以換行 */
  gap: 0.5rem;
  margin-top: 0.5rem; /* 標籤上方空間 */
  
  @media (max-width: 480px) {
    gap: 0.3rem;
  }
`;

// 新增用於描述標籤的 styled component 個別標籤
const DescriptionTag = styled.span`
  background-color: #eee;
  color: #333;
  padding: 0.3rem 0.6rem;
  border-radius: 12px; /* 圓角讓它看起來像標籤 */
  cursor: pointer;
  font-size: 0.9rem;
  &:hover {
    background-color: #ddd;
  }
`;

const StyledSelect = styled.select`
  font-size: 16px;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

// 新增編輯模式的樣式組件
const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const EditRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const EditInputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EditActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const PieChartContainer = styled(Card)`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const PieChartWrapper = styled.div`
  flex: 0 0 250px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PieChartSvg = styled.svg`
  width: 250px;
  height: 250px;
  transform: rotate(-90deg);
`;

const CategoryList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid ${props => props.$color || '#ccc'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e9ecef;
  }
`;

const ExpenseDetailList = styled.div`
  margin-top: 0.5rem;
  padding-left: 1rem;
  border-left: 2px solid ${props => props.$color || '#ccc'};
`;

const ExpenseDetailItem = styled.div`
  padding: 0.4rem 0.5rem;
  margin: 0.3rem 0;
  background-color: white;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CategoryLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ColorDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.$color || '#ccc'};
`;

const CategoryName = styled.span`
  font-weight: 500;
`;

const CategoryAmount = styled.span`
  font-weight: bold;
  color: #333;
`;

const CategoryPercentage = styled.span`
  color: #666;
  font-size: 0.9rem;
`;


// 預設的消費描述選項
const defaultDescriptions = ["早餐", "午餐", "晚餐", "交通", "點心", "飲料", "伴手", "禮物", "門票", "住宿", "購物", "文件", "電信"];


const ExpenseTracker = () => {
  const { trips, selectedTripId, setSelectedTripId } = useTrip();

  // 從localStorage獲取消費記錄
  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem('expenses');
    return savedExpenses ? JSON.parse(savedExpenses) : {};
  });

  // 為每個行程記憶選擇的幣別對
  const [tripCurrencyPreferences, setTripCurrencyPreferences] = useState(() => {
    const savedPreferences = localStorage.getItem('tripCurrencyPreferences');
    return savedPreferences ? JSON.parse(savedPreferences) : {};
  });

  // 貨幣轉換相關狀態
  const [selectedPair, setSelectedPair] = useState('TWD_JPY');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRates, setExchangeRates] = useState({});
  const [manualRate, setManualRate] = useState('');
  const [useManualRate, setUseManualRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 自訂匯率相關狀態
  const [customCurrencyCode, setCustomCurrencyCode] = useState('');
  const [customCurrencyRate, setCustomCurrencyRate] = useState('');
  const [savedCustomCurrencyPairs, setSavedCustomCurrencyPairs] = useState(() => {
    const saved = localStorage.getItem('savedCustomCurrencyPairs');
    return saved ? JSON.parse(saved) : [];
  });

  // 編輯模式相關狀態
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    description: '',
    date: '',
    time: ''
  });


  // 新增消費記錄相關狀態
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '', // 這個欄位似乎沒有被直接使用於表單，可以考慮是否移除
    date: new Date().toISOString().split('T')[0], // 這裡仍然只儲存日期用於日期輸入框
    currencyPair: 'TWD_JPY', // 這個欄位似乎沒有被直接使用於表單，可以考慮是否移除
    fromAmount: '', // 這個欄位似乎沒有被直接使用於表單，可以考慮是否移除
    toAmount: '', // 這個欄位似乎沒有被直接使用於表單，可以考慮是否移除
    rate: '' // 這個欄位似乎沒有被直接使用於表單，可以考慮是否移除
  });

  // 動態貨幣對選項
  const allCurrencyPairs = useMemo(() => [
    { id: 'TWD_JPY', name: '台幣 → 日幣', fromCode: 'TWD', toCode: 'JPY' },
    { id: 'TWD_USD', name: '台幣 → 美金', fromCode: 'TWD', toCode: 'USD' },
    { id: 'TWD_CNY', name: '台幣 → 人民幣', fromCode: 'TWD', toCode: 'CNY' },
    { id: 'TWD_KRW', name: '台幣 → 韓元', fromCode: 'TWD', toCode: 'KRW' },
    { id: 'TWD_THB', name: '台幣 → 泰銖', fromCode: 'TWD', toCode: 'THB' },
    { id: 'TWD_MOP', name: '台幣 → 澳門元', fromCode: 'TWD', toCode: 'MOP' },
    ...savedCustomCurrencyPairs.map(pair => ({
        id: `TWD_${pair.toCode}`,
        name: `台幣 → ${pair.toCode} (自訂)`,
        fromCode: 'TWD',
        toCode: pair.toCode,
        rate: pair.rate
    })),
    { id: 'TWD_CUSTOM_NEW', name: '自訂匯率 (新增)', fromCode: 'TWD', toCode: 'CUSTOM_NEW' }
  ], [savedCustomCurrencyPairs]);


  // 保存消費記錄到localStorage
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  // 保存自訂匯率到localStorage
  useEffect(() => {
    localStorage.setItem('savedCustomCurrencyPairs', JSON.stringify(savedCustomCurrencyPairs));
  }, [savedCustomCurrencyPairs]);

  // 保存行程幣別偏好到localStorage
  useEffect(() => {
    localStorage.setItem('tripCurrencyPreferences', JSON.stringify(tripCurrencyPreferences));
  }, [tripCurrencyPreferences]);


  // 獲取匯率數據
  const fetchExchangeRates = async () => {
    try {
      setIsLoading(true);

      // 使用真實的匯率API - ExchangeRate-API (免費版本)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/TWD');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 提取我們需要的匯率
      const rates = {
        JPY: data.rates.JPY || 4.32,   // 台幣對日幣
        USD: data.rates.USD || 0.032,  // 台幣對美元
        CNY: data.rates.CNY || 0.23,   // 台幣對人民幣
        KRW: data.rates.KRW || 42.5,    // 台幣對韓元
        THB: data.rates.THB || 1.05,    // 台幣對泰銖
        MOP: data.rates.MOP || 0.25    // 台幣對澳門元
      };

      setExchangeRates(rates);
      localStorage.setItem('lastExchangeRates', JSON.stringify(rates)); // 新增這行
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('獲取匯率失敗:', error);
      
      // 如果API失敗，使用備用的模擬數據
      const fallbackRates = {
        JPY: 4.32,   // 1台幣約等於4.32日幣
        USD: 0.032,  // 1台幣約等於0.032美元
        CNY: 0.23,   // 1台幣約等於0.23人民幣
        KRW: 42.5,    // 1台幣約等於42.5韓元
        THB: 1.05,    // 1台幣約等於1.05泰銖
        MOP: 0.25    // 1台幣約等於0.25澳門元
      };
      
      const lastRates = localStorage.getItem('lastExchangeRates');
      if (lastRates) {
        setExchangeRates(JSON.parse(lastRates));
      } else {
        setExchangeRates(fallbackRates);
      }
      setLastUpdated(new Date());
      setIsLoading(false);
      alert('無法獲取即時匯率，目前使用上次的匯率數據或預設值。請檢查網路連線後重新整理匯率。');
    }
  };

  // 初始化時獲取匯率
  useEffect(() => {
    fetchExchangeRates();

    // 每小時更新一次匯率
    const intervalId = setInterval(fetchExchangeRates, 3600000);

    return () => clearInterval(intervalId);
  }, []);

  // 當選擇的行程改變時，載入該行程記憶的幣別選擇
  useEffect(() => {
    if (selectedTripId) {
      // 確保選定行程的消費記錄存在
      if (!expenses[selectedTripId]) {
        setExpenses(prev => ({
          ...prev,
          [selectedTripId]: []
        }));
      }
      
      // 載入該行程記憶的幣別選擇
      if (tripCurrencyPreferences[selectedTripId]) {
        setSelectedPair(tripCurrencyPreferences[selectedTripId]);
        
        // 如果是自訂匯率，需要設置相關狀態
        const savedPairId = tripCurrencyPreferences[selectedTripId];
        const savedPair = allCurrencyPairs.find(p => p.id === savedPairId);
        if (savedPair && savedPair.rate) {
          setUseManualRate(true);
          setCustomCurrencyCode(savedPair.toCode);
          setCustomCurrencyRate(savedPair.rate.toString());
          setManualRate(savedPair.rate.toString());
        } else if (savedPairId === 'TWD_CUSTOM_NEW') {
          setUseManualRate(true);
        } else {
          // 對於標準幣別對，確保不使用手動匯率
          setUseManualRate(false);
          setCustomCurrencyCode('');
          setCustomCurrencyRate('');
          setManualRate('');
        }
      } else {
        // 如果沒有記憶的幣別選擇，使用預設值
        setSelectedPair('TWD_JPY');
        setUseManualRate(false);
        setCustomCurrencyCode('');
        setCustomCurrencyRate('');
        setManualRate('');
      }
      
      // 清空金額輸入
      setFromAmount('');
      setToAmount('');
    }
  }, [selectedTripId, expenses, allCurrencyPairs, tripCurrencyPreferences]);

  // 處理行程選擇變更
  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
  };

  // 處理貨幣對選擇變更
  const handlePairChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedPair(selectedValue);
    
    // 記住這個行程的幣別選擇
    if (selectedTripId) {
      setTripCurrencyPreferences(prev => ({
        ...prev,
        [selectedTripId]: selectedValue
      }));
    }
    
    setFromAmount('');
    setToAmount('');

    if (selectedValue === 'TWD_CUSTOM_NEW') {
        setUseManualRate(true);
        setCustomCurrencyCode('');
        setCustomCurrencyRate('');
        setManualRate('');
    } else {
        const selectedPairObject = allCurrencyPairs.find(p => p.id === selectedValue);
        if (selectedPairObject && selectedPairObject.rate) { // It's a saved custom pair
            setUseManualRate(true);
            setCustomCurrencyCode(selectedPairObject.toCode);
            setCustomCurrencyRate(selectedPairObject.rate.toString());
            setManualRate(selectedPairObject.rate.toString());
        } else { // It's a standard pair
            setUseManualRate(false);
            setCustomCurrencyCode('');
            setCustomCurrencyRate('');
            setManualRate('');
        }
    }
  };

  // 獲取當前選擇的貨幣對
  const getCurrentPair = () => {
    return allCurrencyPairs.find(pair => pair.id === selectedPair) || allCurrencyPairs[0];
  };

  // 獲取當前匯率
  const getCurrentRate = () => {
    const pair = getCurrentPair();
    if (pair.id === 'TWD_CUSTOM_NEW') {
        return parseFloat(customCurrencyRate) || 0;
    }
    if (pair.rate) { // Saved custom pair
        return pair.rate;
    }
    if (useManualRate && manualRate) {
      const parsedManualRate = parseFloat(manualRate);
      if (!isNaN(parsedManualRate)) return parsedManualRate;
    }
    return exchangeRates[pair.toCode] || 0;
  };

  // 處理金額輸入變更 - 從第一個貨幣到第二個貨幣
  const handleFromAmountChange = (e) => {
    const value = e.target.value;
    setFromAmount(value);

    if (value === '' || isNaN(parseFloat(value))) {
      setToAmount('');
      return;
    }

    const rate = getCurrentRate();
    if (rate > 0) {
      const converted = (parseFloat(value) * rate).toFixed(2);
      setToAmount(converted);
    } else {
      setToAmount('');
    }
  };

  // 處理金額輸入變更 - 從第二個貨幣到第一個貨幣
  const handleToAmountChange = (e) => {
    const value = e.target.value;
    setToAmount(value);

    if (value === '' || isNaN(parseFloat(value))) {
      setFromAmount('');
      return;
    }

    const rate = getCurrentRate();
    if (rate > 0) {
      const converted = (parseFloat(value) / rate).toFixed(2);
      setFromAmount(converted);
    } else {
      setFromAmount('');
    }
  };

  // 處理手動匯率變更
  const handleManualRateChange = (e) => {
    const newRate = e.target.value;
    setManualRate(newRate);
    // 當手動匯率改變時，如果 fromAmount 有值，立即重新計算 toAmount
    if (fromAmount && newRate && !isNaN(parseFloat(newRate)) && parseFloat(newRate) > 0) {
        const converted = (parseFloat(fromAmount) * parseFloat(newRate)).toFixed(2);
        setToAmount(converted);
    } else if (fromAmount && (newRate === '' || isNaN(parseFloat(newRate)) || parseFloat(newRate) <= 0)) {
        // 如果手動匯率被清空或無效，且之前是手動模式，則可以選擇清空toAmount或用自動匯率重算
        //setToAmount(''); // 或者用自動匯率重算
          if (!useManualRate && exchangeRates[getCurrentPair().toCode]) { // 確保不是在手動模式下清空，且有自動匯率
            const autoRate = exchangeRates[getCurrentPair().toCode] || 0;
            const converted = (parseFloat(fromAmount) * autoRate).toFixed(2);
            setToAmount(converted);
          } else {
            setToAmount('');
          }
    }
  };

  // 切換使用手動匯率
  const toggleUseManualRate = () => {
    const newUseManualRateState = !useManualRate;
    setUseManualRate(newUseManualRateState);

    // 如果從手動切換回自動匯率，並且 fromAmount 有值
    if (!newUseManualRateState && fromAmount) {
      const autoRate = exchangeRates[getCurrentPair().toCode] || 0;
      if (autoRate > 0) {
        const converted = (parseFloat(fromAmount) * autoRate).toFixed(2);
        setToAmount(converted);
      } else {
        setToAmount('');
      }
    } else if (newUseManualRateState && fromAmount && manualRate && parseFloat(manualRate) > 0) {
      // 如果從自動切換回手動匯率，並且 fromAmount 和 manualRate 有值
      const converted = (parseFloat(fromAmount) * parseFloat(manualRate)).toFixed(2);
      setToAmount(converted);
    } else if (newUseManualRateState && fromAmount) {
      // 切換到手動，但手動匯率可能還沒輸入或無效，可以先清空 toAmount
      setToAmount('');
    }
  };


  // 處理新增消費記錄表單輸入變更
  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  // 處理點擊描述標籤的函式
  const handleTagClick = (description) => {
    // 將點擊的標籤文字設定到 newExpense.description
    setNewExpense(prev => ({ ...prev, description: description }));
  };

  // 儲存自訂匯率
  const handleSaveCustomPair = () => {
    if (!customCurrencyCode || !customCurrencyRate || isNaN(parseFloat(customCurrencyRate))) {
        alert('請輸入有效的自訂貨幣代碼和匯率');
        return;
    }
    const newPair = {
        toCode: customCurrencyCode.toUpperCase(),
        rate: parseFloat(customCurrencyRate)
    };

    setSavedCustomCurrencyPairs(prev => {
        const existingIndex = prev.findIndex(p => p.toCode === newPair.toCode);
        if (existingIndex > -1) {
            const updated = [...prev];
            updated[existingIndex] = newPair;
            return updated;
        } else {
            return [...prev, newPair];
        }
    });

    setSelectedPair(`TWD_${newPair.toCode}`);
    
    // 記住這個行程的幣別選擇
    if (selectedTripId) {
      setTripCurrencyPreferences(prev => ({
        ...prev,
        [selectedTripId]: `TWD_${newPair.toCode}`
      }));
    }
    
    setManualRate(newPair.rate.toString());
  };

  // 刪除自訂匯率
  const handleDeleteCustomPair = () => {
      const pair = getCurrentPair();
      if (!pair || !pair.rate) return; // Not a custom pair

      if (window.confirm(`確定要刪除 ${pair.toCode} 這個自訂匯率嗎？`)) {
          setSavedCustomCurrencyPairs(prev => prev.filter(p => p.toCode !== pair.toCode));
          setSelectedPair('TWD_JPY');
          
          // 更新行程的幣別選擇記憶
          if (selectedTripId) {
            setTripCurrencyPreferences(prev => ({
              ...prev,
              [selectedTripId]: 'TWD_JPY'
            }));
          }
          
          setCustomCurrencyCode('');
          setCustomCurrencyRate('');
          setManualRate('');
          setUseManualRate(false);
      }
  };

  // AI判斷消費類別（使用AI分析）
  const categorizeExpense = async (description) => {
    if (!description) return '其他';
    
    // 先檢查預設按鈕，如果能快速匹配就返回
    const desc = description.toLowerCase();
    if (defaultDescriptions.some(descBtn => desc.includes(descBtn.toLowerCase()))) {
      // 快速匹配預設按鈕
      if (desc.includes('早餐') || desc.includes('午餐') || desc.includes('晚餐') || 
          desc.includes('點心') || desc.includes('飲料')) {
        return '餐飲';
      }
      if (desc.includes('交通')) return '交通';
      if (desc.includes('伴手') || desc.includes('禮物')) return '購物';
      if (desc.includes('門票')) return '娛樂';
      if (desc.includes('住宿')) return '住宿';
      if (desc.includes('購物')) return '購物';
    }
    
    // 如果快速匹配失敗，使用AI分析
    try {
      const response = await fetch(`/.netlify/functions/categorize-expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        console.error('AI分類失敗:', response.status);
        return '其他'; // 失敗時返回"其他"
      }

      const data = await response.json();
      return data.category || '其他';
    } catch (error) {
      console.error('AI分類錯誤:', error);
      return '其他'; // 錯誤時返回"其他"
    }
  };

  // 同步版本的快速分類（用於統計已保存的消費記錄）
  const quickCategorizeExpense = (description) => {
    if (!description) return '其他';
    
    const desc = description.toLowerCase();
    
    // 餐飲相關
    if (desc.includes('早餐') || desc.includes('午餐') || desc.includes('晚餐') || 
        desc.includes('點心') || desc.includes('飲料') || desc.includes('咖啡') ||
        desc.includes('茶') || desc.includes('餐廳') || desc.includes('食物') ||
        desc.includes('吃') || desc.includes('餐') || desc.includes('飯') ||
        desc.includes('小吃') || desc.includes('宵夜')) {
      return '餐飲';
    }
    
    // 交通相關
    if (desc.includes('交通') || desc.includes('車') || desc.includes('地鐵') ||
        desc.includes('捷運') || desc.includes('公車') || desc.includes('計程車') ||
        desc.includes('taxi') || desc.includes('uber') || desc.includes('租車') ||
        desc.includes('機票') || desc.includes('船')) {
      return '交通';
    }
    
    // 購物相關
    if (desc.includes('購物') || desc.includes('買') || desc.includes('伴手') ||
        desc.includes('禮物') || desc.includes('紀念品') || desc.includes('商品') ||
        desc.includes('shopping') || desc.includes('mall') || desc.includes('百貨')) {
      return '購物';
    }
    
    // 住宿相關
    if (desc.includes('住宿') || desc.includes('飯店') || desc.includes('酒店') ||
        desc.includes('旅館') || desc.includes('民宿') || desc.includes('hotel') ||
        desc.includes('房間') || desc.includes('住宿費')) {
      return '住宿';
    }
    
    // 娛樂相關（排除交通票，只匹配娛樂票）
    if (desc.includes('門票') || desc.includes('遊樂園') || desc.includes('景點') ||
        desc.includes('電影') || desc.includes('娛樂') || desc.includes('玩') ||
        desc.includes('活動') || desc.includes('表演') || desc.includes('展覽')) {
      return '娛樂';
    }
    
    // 其他
    return '其他';
  };

  // 記錄當前轉換
  const recordExpense = async () => {
    if (!selectedTripId) {
      alert('請先選擇一個行程');
      return;
    }
    if (!newExpense.description) {
      alert('請填寫消費描述');
      return;
    }
    if (fromAmount === '' || isNaN(parseFloat(fromAmount)) || toAmount === '' || isNaN(parseFloat(toAmount))) {
        alert('請輸入有效的轉換金額');
        return;
    }


    const pair = getCurrentPair();
    const rate = getCurrentRate();

    if (rate <= 0) {
        alert('目前的匯率無效，無法記錄消費');
        return;
    }

    // 使用AI分類（異步處理）
    const category = await categorizeExpense(newExpense.description);
    
    const expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      category: category, // AI自動分類
      // Capture date and time for recording.
      // If the user selected a date in the form (`newExpense.date`), use that date
      // combined with the current time so the record's day matches the user's selection.
      // If no date was selected, fall back to the current moment.
      dateTime: (() => {
        const now = new Date();
        if (newExpense.date) {
          const pad = (n) => n.toString().padStart(2, '0');
          const hh = pad(now.getHours());
          const mm = pad(now.getMinutes());
          const ss = pad(now.getSeconds());
          const localDateTime = `${newExpense.date}T${hh}:${mm}:${ss}`;
          return new Date(localDateTime).toISOString();
        }
        return now.toISOString();
      })(),
      // Also keep the date field from the form for the input display
      date: newExpense.date,
      currencyPair: selectedPair,
      fromCurrency: pair.fromCode,
      toCurrency: pair.toCode,
      fromAmount: parseFloat(fromAmount),
      toAmount: parseFloat(toAmount),
      rate: rate
    };

    setExpenses(prev => ({
      ...prev,
      [selectedTripId]: [...(prev[selectedTripId] || []), expense]
    }));

    // Reset form (do not reset manual rate and mode for continuity)
    setNewExpense({
      description: '',
      amount: '',
      // Keep the date input as today's date by default for the next entry
      date: new Date().toISOString().split('T')[0],
      currencyPair: 'TWD_JPY',
      fromAmount: '',
      toAmount: '',
      rate: ''
    });
    setFromAmount('');
    setToAmount('');
    // setManualRate(''); // 記錄後不清空手動匯率，方便連續記錄
    // setUseManualRate(false); // 記錄後不清空手動匯率模式，方便連續記錄

    // Removed the alert message here as requested. (Confirmed it was not present in the provided code)
  };

  // 刪除消費記錄（新增確認提示）
  const deleteExpense = (expenseId) => {
    if (!selectedTripId) return;
    if (!window.confirm('確定要刪除此筆消費記錄嗎？')) return;
    setExpenses(prev => {
      const updated = { ...prev };
      if (updated[selectedTripId]) {
        updated[selectedTripId] = updated[selectedTripId].filter(exp => exp.id !== expenseId);
      }
      return updated;
    });
  };

  // 獲取選定行程的消費記錄
  const selectedTripExpenses = selectedTripId ? (expenses[selectedTripId] || []) : [];

  // Sort by dateTime if available, falling back to date
  const sortedExpenses = [...selectedTripExpenses].sort((a, b) => {
      const dateA = a.dateTime ? new Date(a.dateTime) : new Date(a.date);
      const dateB = b.dateTime ? new Date(b.dateTime) : new Date(b.date);
      return dateB - dateA; // Sort descending (latest first)
  });


  // Format function to display date and time for new entries, or just date for old ones
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A Date/Time'; // Should not happen with new data, but for safety
    const date = new Date(dateTimeString);
    // Use toLocaleString to get both date and time based on locale
    return date.toLocaleString();
  };

  // Function to format date only for older entries without dateTime
  const formatDateOnly = (dateString) => {
     if (!dateString) return 'N/A Date';
     const date = new Date(dateString);
     return date.toLocaleDateString();
  }


  const currentPairDetails = getCurrentPair();
  const currentEffectiveRate = getCurrentRate();
  const selectedPairObject = allCurrencyPairs.find(p => p.id === selectedPair);


  // 計算總花費（以新台幣為單位）
  const calculateTotalExpense = () => {
    if (!selectedTripId || !selectedTripExpenses.length) return 0;
    
    return selectedTripExpenses.reduce((total, expense) => {
      return total + expense.fromAmount;
    }, 0);
  };

  const totalExpense = calculateTotalExpense();

  // 計算各類別消費統計
  const calculateCategoryStats = () => {
    if (!selectedTripId || !selectedTripExpenses.length) return [];
    
    const categoryMap = {};
    
    selectedTripExpenses.forEach(expense => {
      // 如果已有分類就使用，否則用快速分類（避免異步問題）
      const category = expense.category || quickCategorizeExpense(expense.description);
      if (!categoryMap[category]) {
        categoryMap[category] = { total: 0, items: [] };
      }
      categoryMap[category].total += expense.fromAmount;
      categoryMap[category].items.push(expense);
    });
    
    // 轉換為數組並排序
    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        items: data.items
      }))
      .sort((a, b) => b.total - a.total);
  };

  const categoryStats = calculateCategoryStats();
  const top5Categories = categoryStats.slice(0, 5);
  
  // 追蹤展開的類別
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // 追蹤AI分類時間
  const [lastCategorizationTime, setLastCategorizationTime] = useState(null);
  const [nextCategorizationTime, setNextCategorizationTime] = useState(null);
  
  // 切換類別展開狀態
  const toggleCategoryExpansion = (categoryName) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  // 更新下一次分類時間顯示（每秒更新一次，顯示動態倒計時）
  useEffect(() => {
    if (!selectedTripId) return;
    
    const updateTimer = setInterval(() => {
      const now = new Date();
      // 計算下一次分類時間（距離現在最近的5秒間隔）
      // 因為是每5秒執行一次，所以下一次是當前時間+5秒
      setNextCategorizationTime(new Date(now.getTime() + 5000));
    }, 1000); // 每秒更新一次顯示
    
    return () => clearInterval(updateTimer);
  }, [selectedTripId]);

  // 每5秒自動分析未分類的消費記錄
  useEffect(() => {
    if (!selectedTripId) return;

    // 設置5秒間隔
    const intervalId = setInterval(async () => {
      // 使用函數式更新獲取最新的expenses狀態
      setExpenses(prevExpenses => {
        const currentExpenses = prevExpenses[selectedTripId] || [];
        if (currentExpenses.length === 0) return prevExpenses;

        // 找出所有沒有分類或分類為"其他"的消費記錄（但描述不是空的）
        const currentUncategorized = currentExpenses.filter(expense => 
          expense.description && (!expense.category || expense.category === '其他')
        );

        if (currentUncategorized.length === 0) return prevExpenses; // 沒有需要分類的記錄

        // 批量處理未分類的記錄（每次處理一個，避免過載）
        const expenseToCategorize = currentUncategorized[0]; // 每次只處理第一個
        
        // 異步處理分類
        categorizeExpense(expenseToCategorize.description).then(category => {
          // 更新最後一次分類時間
          const now = new Date();
          setLastCategorizationTime(now);
          
          // 如果AI分類結果不是"其他"，則更新記錄
          if (category && category !== '其他') {
            setExpenses(prev => {
              const updated = { ...prev };
              if (updated[selectedTripId]) {
                updated[selectedTripId] = updated[selectedTripId].map(expense =>
                  expense.id === expenseToCategorize.id
                    ? { ...expense, category }
                    : expense
                );
              }
              return updated;
            });
          }
        }).catch(error => {
          console.error('自動分類失敗:', error);
        });

        return prevExpenses; // 立即返回，不等待異步操作
      });
    }, 5000); // 每5秒執行一次

    return () => clearInterval(intervalId);
  }, [selectedTripId]); // 只在選定行程改變時重新設置間隔

  // 繪製圓餅圖
  const renderPieChart = () => {
    if (categoryStats.length === 0) return null;
    
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];
    const radius = 100;
    const centerX = 125;
    const centerY = 125;
    const total = categoryStats.reduce((sum, cat) => sum + cat.total, 0);
    
    let currentAngle = 0;
    const paths = [];
    
    categoryStats.forEach((category, index) => {
      const percentage = category.total / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // 計算扇形路徑
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      paths.push({
        path: pathData,
        color: colors[index % colors.length],
        category: category.name,
        percentage: percentage
      });
      
      currentAngle = endAngle;
    });
    
    return (
      <PieChartSvg viewBox="0 0 250 250">
        {paths.map((item, index) => (
          <path
            key={index}
            d={item.path}
            fill={item.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </PieChartSvg>
    );
  };

  // 編輯功能相關函數
  // 啟動編輯模式
  const startEditing = (expense) => {
    setEditingExpenseId(expense.id);
    
    // 從dateTime中提取日期和時間
    let date = '';
    let time = '';
    
    if (expense.dateTime) {
      const dateTime = new Date(expense.dateTime);
      date = dateTime.toISOString().split('T')[0];
      time = dateTime.toTimeString().slice(0, 5); // 取 HH:MM 格式
    } else {
      date = expense.date;
      time = '12:00'; // 默認時間
    }
    
    setEditFormData({
      description: expense.description,
      date: date,
      time: time
    });
  };

  // 處理編輯表單輸入變更
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // 保存編輯
  const saveEdit = () => {
    if (!selectedTripId || !editingExpenseId) return;
    
    // 驗證輸入
    if (!editFormData.description) {
      alert('請填寫消費描述');
      return;
    }
    
    if (!editFormData.date) {
      alert('請選擇日期');
      return;
    }
    
    // 合併日期和時間
    const dateTimeString = `${editFormData.date}T${editFormData.time}:00`;
    const newDateTime = new Date(dateTimeString).toISOString();
    
    setExpenses(prev => {
      const updated = { ...prev };
      if (updated[selectedTripId]) {
        updated[selectedTripId] = updated[selectedTripId].map(expense => {
          if (expense.id === editingExpenseId) {
            return {
              ...expense,
              description: editFormData.description,
              date: editFormData.date,
              dateTime: newDateTime
            };
          }
          return expense;
        });
      }
      return updated;
    });
    
    // 退出編輯模式
    setEditingExpenseId(null);
    setEditFormData({ description: '', date: '', time: '' });
  };

  // 取消編輯
  const cancelEdit = () => {
    setEditingExpenseId(null);
    setEditFormData({ description: '', date: '', time: '' });
  };

  return (
    <Container>
      <h2>消費追蹤</h2>

      <FormGroup>
        <label htmlFor="trip">選擇行程:</label>
        <StyledSelect
          id="trip"
          value={selectedTripId || ''}
          onChange={handleTripChange}
        >
          <option value="">-- 請選擇行程 --</option>
          {trips.map(trip => (
            <option key={trip.id} value={trip.id}>
              {trip.name} ({trip.startDate} 至 {trip.endDate})
            </option>
          ))}
        </StyledSelect>
      </FormGroup>
      
      {selectedTripId && (
        <TotalExpenseCard>
          <h3>總花費</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {totalExpense.toFixed(2)} TWD
          </div>
        </TotalExpenseCard>
      )}

      {selectedTripId ? (
        <>
          <Card>
            <h3>貨幣換算器</h3>

            <FormGroup>
              <label htmlFor="currencyPair">選擇貨幣對:</label>
              <StyledSelect
                id="currencyPair"
                value={selectedPair}
                onChange={handlePairChange}
              >
                {allCurrencyPairs.map(pair => (
                  <option key={pair.id} value={pair.id}>
                    {pair.name}
                  </option>
                ))}
              </StyledSelect>
            </FormGroup>

            {selectedPair === 'TWD_CUSTOM_NEW' && (
                <Card>
                    <FormGroup>
                        <label htmlFor="customCurrencyCode">自訂貨幣代碼 (例如: EUR):</label>
                        <input
                            type="text"
                            id="customCurrencyCode"
                            value={customCurrencyCode}
                            onChange={(e) => setCustomCurrencyCode(e.target.value)}
                            placeholder="3位英文代碼"
                            maxLength="3"
                        />
                    </FormGroup>
                    <FormGroup>
                        <label htmlFor="customCurrencyRate">自訂匯率 (1 TWD = ?):</label>
                        <input
                            type="number"
                            id="customCurrencyRate"
                            value={customCurrencyRate}
                            onChange={(e) => setCustomCurrencyRate(e.target.value)}
                            placeholder="輸入匯率"
                            min="0"
                            step="0.0001"
                        />
                    </FormGroup>
                    <Button $primary onClick={handleSaveCustomPair}>儲存自訂匯率</Button>
                </Card>
            )}

            <CurrencyConverterContainer>
              <CurrencyRow>
                <InputGroup>
                  <label htmlFor="fromAmount">{currentPairDetails.fromCode}:</label>
                  <input
                    type="number"
                    id="fromAmount"
                    value={fromAmount}
                    onChange={handleFromAmountChange}
                    placeholder="輸入金額"
                    min="0"
                    step="0.01"
                  />
                </InputGroup>

                <div style={{ alignSelf: 'flex-end', padding: '0.5rem' }}>→</div>

                <InputGroup>
                  <label htmlFor="toAmount">{currentPairDetails.toCode === 'CUSTOM_NEW' ? (customCurrencyCode || '??') : currentPairDetails.toCode}:</label>
                  <input
                    type="number"
                    id="toAmount"
                    value={toAmount}
                    onChange={handleToAmountChange}
                    placeholder="換算結果"
                    min="0"
                    step="0.01"
                  />
                </InputGroup>
              </CurrencyRow>

              <ButtonGroup>
                <Button
                  type="button"
                  $active={useManualRate}
                  onClick={toggleUseManualRate}
                  style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                >
                  手動設定匯率
                </Button>
                <Button
                  type="button"
                  $primary // 保持刷新匯率按鈕為主要樣式
                  onClick={fetchExchangeRates}
                  disabled={isLoading} // 正在加載時禁用
                  style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                >
                  {isLoading ? '更新中...' : '刷新匯率'}
                </Button>
                {selectedPairObject && selectedPairObject.rate && selectedPairObject.toCode !== 'CUSTOM_NEW' && (
                    <Button
                        type="button"
                        $danger
                        onClick={handleDeleteCustomPair}
                        style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                        刪除此匯率
                    </Button>
                )}
              </ButtonGroup>


              {useManualRate && selectedPair !== 'TWD_CUSTOM_NEW' ? (
                <FormGroup style={{ marginTop: '0.5rem' }}>
                  <label htmlFor="manualRate">自訂匯率 (1 {currentPairDetails.fromCode} = ? {currentPairDetails.toCode}):</label>
                  <input
                    type="number"
                    id="manualRate"
                    value={manualRate}
                    onChange={handleManualRateChange}
                    placeholder="輸入匯率"
                    min="0"
                    step="0.0001"
                  />
                </FormGroup>
              ) : (
                <RateInfoText>
                  <span>
                    當前匯率: 1 {currentPairDetails.fromCode} = {currentEffectiveRate > 0 ? currentEffectiveRate.toFixed(4) : 'N/A'} {currentPairDetails.toCode === 'CUSTOM_NEW' ? (customCurrencyCode || '??') : currentPairDetails.toCode}
                  </span>
                  {lastUpdated && (
                    <span>(更新時間: {lastUpdated.toLocaleTimeString()})</span>
                  )}
                </RateInfoText>
              )}
            </CurrencyConverterContainer>

            {/* --- 消費描述及其快速填寫標籤部分 --- */}
            <FormGroup>
              <label htmlFor="description">消費描述:</label>
              <input
                type="text"
                id="description"
                name="description"
                value={newExpense.description}
                onChange={handleExpenseInputChange}
                placeholder="例如：晚餐、交通費"
              />
              {/* 渲染可點擊的標籤 */}
              <DescriptionTags>
                {defaultDescriptions.map((desc, index) => (
                  <DescriptionTag key={index} onClick={() => handleTagClick(desc)}>
                    {desc}
                  </DescriptionTag>
                ))}
              </DescriptionTags>
            </FormGroup>
            {/* --- 消費描述及其快速填寫標籤部分結束 --- */}


            <FormGroup>
              {/* Keeping the date input field as it seems intended for selecting the date of the expense */}
              <label htmlFor="date">消費日期:</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newExpense.date}
                onChange={handleExpenseInputChange}
              />
            </FormGroup>

            <Button $primary onClick={recordExpense}>記錄消費</Button>
          </Card>

          {selectedTripExpenses.length > 0 && (
            <PieChartContainer>
              <h3 style={{ width: '100%', marginTop: 0, marginBottom: '1rem' }}>消費類別統計</h3>
              <PieChartWrapper>
                {renderPieChart()}
              </PieChartWrapper>
              <CategoryList>
                {top5Categories.map((category, index) => {
                  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
                  const color = colors[index % colors.length];
                  const percentage = totalExpense > 0 ? ((category.total / totalExpense) * 100).toFixed(1) : 0;
                  const isExpanded = expandedCategory === category.name;
                  
                  return (
                    <div key={category.name}>
                      <CategoryItem 
                        $color={color}
                        onClick={() => toggleCategoryExpansion(category.name)}
                        title="點擊展開查看細項"
                      >
                        <CategoryLabel>
                          <ColorDot $color={color} />
                          <CategoryName>{category.name}</CategoryName>
                        </CategoryLabel>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <CategoryAmount>{category.total.toFixed(2)} TWD</CategoryAmount>
                          <CategoryPercentage>({percentage}%)</CategoryPercentage>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </CategoryItem>
                      {isExpanded && category.items && category.items.length > 0 && (
                        <ExpenseDetailList $color={color}>
                          {category.items.map(expense => (
                            <ExpenseDetailItem key={expense.id}>
                              <span>{expense.description || '未命名消費'}</span>
                              <span style={{ fontWeight: 'bold', color: '#333' }}>
                                {expense.fromAmount.toFixed(2)} TWD
                              </span>
                            </ExpenseDetailItem>
                          ))}
                        </ExpenseDetailList>
                      )}
                    </div>
                  );
                })}
                {categoryStats.length > 5 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    共 {categoryStats.length} 個類別
                  </div>
                )}
                {(lastCategorizationTime || nextCategorizationTime) && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #eee', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                    {lastCategorizationTime && (
                      <div>AI最後分類時間：{lastCategorizationTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    )}
                    {nextCategorizationTime && (
                      <div>預計下次分類：{nextCategorizationTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    )}
                  </div>
                )}
              </CategoryList>
            </PieChartContainer>
          )}

          <Card>
            <h3>消費記錄</h3>

            {sortedExpenses.length === 0 ? (
              <p>尚無消費記錄</p>
            ) : (
              <ExpenseList>
                {sortedExpenses.map(expense => (
                  <ExpenseItem key={expense.id}>
                    {editingExpenseId === expense.id ? (
                      // 編輯模式
                      <EditForm>
                        <EditRow>
                          <EditInputGroup>
                            <label>描述:</label>
                            <input
                              type="text"
                              name="description"
                              value={editFormData.description}
                              onChange={handleEditInputChange}
                              placeholder="消費描述"
                            />
                          </EditInputGroup>
                        </EditRow>
                        
                        <EditRow>
                          <EditInputGroup>
                            <label>日期:</label>
                            <input
                              type="date"
                              name="date"
                              value={editFormData.date}
                              onChange={handleEditInputChange}
                            />
                          </EditInputGroup>
                          
                          <EditInputGroup>
                            <label>時間:</label>
                            <input
                              type="time"
                              name="time"
                              value={editFormData.time}
                              onChange={handleEditInputChange}
                            />
                          </EditInputGroup>
                        </EditRow>
                        
                        <EditActions>
                          <Button $secondary onClick={cancelEdit}>取消</Button>
                          <Button $primary onClick={saveEdit}>保存</Button>
                        </EditActions>
                      </EditForm>
                    ) : (
                      // 顯示模式
                      <div style={{ flex: 1 }}>
                        <div><strong>{expense.description}</strong></div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          <ExpenseAmount>
                            {expense.fromAmount.toFixed(2)} {expense.fromCurrency} =
                            {expense.toAmount.toFixed(2)} {expense.toCurrency}
                          </ExpenseAmount>
                          <span> · 匯率: {expense.rate.toFixed(4)} · </span>
                          <span>
                            {/* Use formatDateTime for new data (has dateTime) or formatDateOnly for old data (only has date) */}
                            {expense.dateTime ? formatDateTime(expense.dateTime) : formatDateOnly(expense.date)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      {editingExpenseId === expense.id ? null : (
                        <>
                          <Button $secondary onClick={() => startEditing(expense)} style={{ marginRight: '0.5rem' }}>編輯</Button>
                          <Button $danger onClick={() => deleteExpense(expense.id)}>刪除</Button>
                        </>
                      )}
                    </div>
                  </ExpenseItem>
                ))}
              </ExpenseList>
            )}
          </Card>
        </>
      ) : (
        <p>請先選擇一個行程</p>
      )}
    </Container>
  );
};

export default ExpenseTracker;