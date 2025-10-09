import { useState, useEffect, useRef } from 'react';
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


// 預設的消費描述選項
const defaultDescriptions = ["早餐", "午餐", "晚餐", "交通", "點心", "飲料", "伴手", "禮物", "門票"];


const ExpenseTracker = () => {
  const { trips, selectedTripId, setSelectedTripId } = useTrip();

  // 從localStorage獲取消費記錄
  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem('expenses');
    return savedExpenses ? JSON.parse(savedExpenses) : {};
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
  const allCurrencyPairs = [
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
  ];


  // 保存消費記錄到localStorage
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  // 保存自訂匯率到localStorage
  useEffect(() => {
    localStorage.setItem('savedCustomCurrencyPairs', JSON.stringify(savedCustomCurrencyPairs));
  }, [savedCustomCurrencyPairs]);


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

  // 處理行程選擇變更
  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);

    // 確保選定行程的消費記錄存在
    if (tripId && !expenses[tripId]) {
      setExpenses(prev => ({
        ...prev,
        [tripId]: []
      }));
    }
  };

  // 處理貨幣對選擇變更
  const handlePairChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedPair(selectedValue);
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
    setManualRate(newPair.rate.toString());
  };

  // 刪除自訂匯率
  const handleDeleteCustomPair = () => {
      const pair = getCurrentPair();
      if (!pair || !pair.rate) return; // Not a custom pair

      if (window.confirm(`確定要刪除 ${pair.toCode} 這個自訂匯率嗎？`)) {
          setSavedCustomCurrencyPairs(prev => prev.filter(p => p.toCode !== pair.toCode));
          setSelectedPair('TWD_JPY'); // Reset to default
          setCustomCurrencyCode('');
          setCustomCurrencyRate('');
          setManualRate('');
          setUseManualRate(false);
      }
  };


  // 記錄當前轉換
  const recordExpense = () => {
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

    const expense = {
      id: Date.now().toString(),
      description: newExpense.description,
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
