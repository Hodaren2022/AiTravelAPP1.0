import { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useTrip } from '../contexts/TripContext';
import airportsData from '../data/airports.json';

// --- Styled Components using CSS Variables ---

const GlobalStyle = createGlobalStyle` body.modal-open { overflow: hidden; } `;

const Container = styled.div` 
  padding: 1rem; 
  max-width: 100%; 
  box-sizing: border-box;
  h2 { font-size: var(--font-size-h2); }
  h3 { font-size: calc(var(--font-size-h2) * 0.8); }
  h4 { font-size: var(--font-size-h4); }
`;
const CardsContainer = styled.div`
  display: flex; overflow-x: auto; gap: 1rem; padding: 1rem 0;
  scrollbar-width: thin; scrollbar-color: #ccc #f1f1f1;
  scroll-behavior: smooth;
  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
  &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
`;
const TripCard = styled.div`
  flex: 0 0 300px; background-color: white; border-radius: 8px;
  box-shadow: ${props => props.$selected ? '0 8px 20px rgba(52, 152, 219, 0.3)' : '0 4px 8px rgba(0, 0, 0, 0.1)'};
  border: ${props => props.$selected ? '2px solid #3498db' : '2px solid transparent'};
  padding: 1.5rem;
  display: flex; flex-direction: column; justify-content: space-between;
  transition: all 0.3s ease-in-out;
  transform: ${props => props.$selected ? 'translateY(-10px)' : 'translateY(0)'};
  opacity: ${props => props.$selected ? '1' : '0.6'};
  filter: ${props => props.$selected ? 'none' : 'brightness(0.85)'};
  
  &:hover {
    transform: ${props => props.$selected ? 'translateY(-10px)' : 'translateY(-5px)'};
    opacity: ${props => props.$selected ? '1' : '0.8'};
    filter: ${props => props.$selected ? 'none' : 'brightness(0.95)'};
  }
`;

const CardBodyText = styled.p`
  font-size: var(--font-size-body);
  margin: 0.5rem 0;
`;

const DestinationDisplay = styled.p`
  font-size: var(--font-size-destination);
  font-weight: 500; margin: 0.5rem 0;
  strong { font-weight: 700; }
`;
const FlightInfoList = styled.div`
  margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;
  color: #333; /* Removed max-height and overflow-y */
  font-size: var(--font-size-small);
  h5 { margin-top: 0; margin-bottom: 0.5rem; font-size: calc(var(--font-size-small) + 2px); color: #3498db; }
  p { font-size: var(--font-size-small); }
`;
const FlightEntry = styled.div`
  margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  p { margin: 0.2rem 0; line-height: 1.4; }
`;
const EmptyCard = styled(TripCard)`
  justify-content: center; align-items: center; color: #888;
  font-size: var(--font-size-body);
`;
const TripForm = styled.form`
  display: flex; flex-direction: column; gap: 1rem;
  max-height: 80vh; overflow-y: auto; padding-right: 1rem;
`;
const FormSection = styled.div` margin-top: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem; `;
const FormRow = styled.div`
  display: flex; gap: 1rem; margin-bottom: 1rem;
  @media (max-width: 768px) { flex-direction: column; gap: 0.5rem; }
`;
const FormGroup = styled.div`
  flex: 1; margin-bottom: 0.5rem; position: relative;
  label { 
    display: block; margin-bottom: 0.5rem; font-weight: bold; 
    font-size: var(--font-size-label);
  }
  input, select, textarea {
    width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;
    background-color: ${props => props.$editing ? '#fff8e6' : '#f9f9f9'};
    transition: background-color 0.3s ease; box-sizing: border-box;
    font-size: var(--font-size-body);
  }
`;
const FlightTable = styled.table`
  width: 100%; border-collapse: collapse; margin-top: 0.5rem;
  font-size: var(--font-size-small);
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background-color: #f2f2f2; }
`;
const ButtonGroup = styled.div` display: flex; gap: 0.5rem; margin-top: 1rem; justify-content: flex-end; `;
const Button = styled.button`
  background-color: ${props => 
    props.$choiceButton ? '#3498db' : // Default blue for choice buttons
    (props.$primary ? '#3498db' : 
    (props.$danger ? '#e74c3c' : '#bdc3c7'))
  };
  color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px;
  cursor: pointer; font-weight: bold;
  transition: background-color 0.2s ease; /* Always transition background-color */
  font-size: var(--font-size-body);

  &:hover {
    background-color: ${props => 
      props.$choiceButton ? '#27ae60' : // Green on hover for choice buttons
      (props.$primary ? '#2980b9' : 
      (props.$danger ? '#c0392b' : '#95a5a6'))
    };
  }

  &:active {
    background-color: ${props => 
      props.$choiceButton ? '#27ae60' : // Green on active for choice buttons (same as hover for simplicity)
      (props.$primary ? '#2980b9' : 
      (props.$danger ? '#c0392b' : '#95a5a6'))
    };
  }
`;
const ToastBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* Darker background */
  display: flex; justify-content: center; align-items: center;
  z-index: 1999; /* Below toast, above other content */
`;

const Toast = styled.div`
  background-color: #4CAF50; color: white;
  padding: 30px 40px; /* Increased padding for larger text */
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  z-index: 2000;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  font-size: 24px; /* Larger text */
  text-align: center;
  min-width: 250px; /* Ensure it's not too small */

  &.show {
    opacity: 1;
  }
`;
const FloatingActionButton = styled.button`
  position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%;
  background-color: #3498db; color: white; border: none; font-size: 2rem;
  display: flex; justify-content: center; align-items: center; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.2); cursor: pointer; z-index: 1000;
  transition: background-color 0.3s, transform 0.3s;
  &:hover { background-color: #2980b9; transform: scale(1.1); }
`;
const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center;
  align-items: center; z-index: 1500;
`;
const ModalContent = styled.div`
  background-color: white; padding: 2rem; border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 90%; max-width: 700px; position: relative;
`;
const CloseButton = styled.button`
  position: absolute; top: 10px; right: 10px; background: transparent; border: none;
  font-size: 1.5rem; cursor: pointer; color: #888;
`;
const SuggestionsList = styled.ul`
  position: absolute; background-color: white; border: 1px solid #ddd; border-top: none;
  border-radius: 0 0 4px 4px; list-style-type: none; margin: 0; padding: 0;
  width: 100%; max-height: 150px; overflow-y: auto; z-index: 1600;
`;
const SuggestionItem = styled.li`
  padding: 0.75rem; cursor: pointer;
  font-size: var(--font-size-body);
  &:hover { background-color: #f1f1f1; }
`;

// --- Autocomplete Component ---
const AutocompleteInput = ({ airports, value, onChange, onSelect, placeholder, name }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    onChange({ target: { name, value: inputValue } });

    if (inputValue.length > 0) {
      const filtered = airports.filter(airport => 
        airport.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        airport.iata.toLowerCase().includes(inputValue.toLowerCase()) ||
        airport.city.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (airport) => {
    onSelect(name, `${airport.city} (${airport.iata})`);
    setShowSuggestions(false);
  };

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={placeholder}
        name={name}
      />
      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsList>
          {suggestions.map(airport => (
            <SuggestionItem key={airport.iata} onMouseDown={() => handleSelect(airport)}>
              {airport.name} ({airport.iata})
            </SuggestionItem>
          ))}
        </SuggestionsList>
      )}
    </>
  );
};


// --- Main TripManagement Component ---
const taiwanAirlines = ['中華航空', '長榮航空', '立榮航空', '華信航空', '台灣虎航', '星宇航空', '遠東航空', '其他'];

const TripManagement = () => {
  const { trips, setTrips, selectedTripId, setSelectedTripId } = useTrip();
  const cardsContainerRef = useRef(null);
  const cardRefs = useRef({});
  const isScrollingProgrammatically = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const isUserScrolling = useRef(false);
  const touchStartRef = useRef(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  // --- AI Feature State ---
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false); // Loading state for AI

  const initialTripState = { id: '', name: '', destination: '', startDate: '', endDate: '', description: '', flights: [], hotels: [], dailyItinerary: [] };
  const initialFlightState = { date: '', airline: '', flightNumber: '', departureCity: '', arrivalCity: '', departureTime: '', arrivalTime: '', departureTimezone: 'UTC+8（中港澳台 / 中原標準）', arrivalTimezone: 'UTC+8（中港澳台 / 中原標準）', customAirline: '', duration: '' };

  const [newTrip, setNewTrip] = useState(initialTripState);
  const [newFlight, setNewFlight] = useState(initialFlightState);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingFlight, setIsEditingFlight] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);

  useEffect(() => {
    const bodyClassList = document.body.classList;
    const hasModalOpen = isModalOpen || isChoiceModalOpen || isAiModalOpen;
    if (hasModalOpen) {
      bodyClassList.add('modal-open');
    } else {
      bodyClassList.remove('modal-open');
    }
    return () => bodyClassList.remove('modal-open');
  }, [isModalOpen, isChoiceModalOpen, isAiModalOpen]);

  // 卡片選定邏輯：監聽滾動事件，自動選定中間的卡片
  useEffect(() => {
    const container = cardsContainerRef.current;
    if (!container || trips.length === 0) return;

    const handleScroll = () => {
      // 如果是程式化滾動，不觸發自動選定邏輯
      if (isScrollingProgrammatically.current) {
        return;
      }
      
      // 清除之前的定時器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // 延遲執行選定邏輯，避免滾動過程中頻繁觸發
      scrollTimeoutRef.current = setTimeout(() => {
        // 如果用戶正在手動滾動，延後處理
        if (isUserScrolling.current) {
          return;
        }
        
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;
        
        let closestCard = null;
        let closestDistance = Infinity;
        
        // 找出最接近中心的卡片
        Object.entries(cardRefs.current).forEach(([tripId, cardElement]) => {
          if (cardElement) {
            const cardRect = cardElement.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - containerCenter);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestCard = tripId;
            }
          }
        });
        
        // 只有當最接近的卡片真的在容器範圍內且與當前選定不同時才選定
        if (closestCard && closestDistance < 200 && closestCard !== selectedTripId) {
          setSelectedTripId(closestCard);
        }
      }, 150); // 150ms 延遲
    };

    const handleTouchStart = (e) => {
      isUserScrolling.current = true;
      touchStartRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      if (touchStartRef.current !== null) {
        isUserScrolling.current = true;
      }
    };

    const handleTouchEnd = () => {
      // 觸控結束後延遲重置，讓滾動慣性完成
      setTimeout(() => {
        isUserScrolling.current = false;
        touchStartRef.current = null;
      }, 300);
    };

    const handleMouseDown = () => {
      isUserScrolling.current = true;
    };

    const handleMouseUp = () => {
      setTimeout(() => {
        isUserScrolling.current = false;
      }, 300);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    
    // 清理函數
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [trips, selectedTripId, setSelectedTripId]);

  // 當 selectedTripId 從其他頁面改變時，滾動到對應卡片
  useEffect(() => {
    if (!selectedTripId || !cardsContainerRef.current) return;
    
    const selectedCard = cardRefs.current[selectedTripId];
    if (selectedCard) {
      const container = cardsContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const cardRect = selectedCard.getBoundingClientRect();
      
      // 標記為程式化滾動
      isScrollingProgrammatically.current = true;
      
      // 計算需要滾動的距離，讓卡片居中
      const scrollLeft = selectedCard.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
      
      // 滾動完成後重置標記（延遲足夠長時間確保滾動完成）
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 800); // 增加延遲時間以確保滾動動畫完成
    }
  }, [selectedTripId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrip(prev => ({ ...prev, [name]: value }));
  };

  const handleFlightInputChange = (e) => {
    const { name, value } = e.target;
    setNewFlight(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAutocompleteSelect = (name, value) => {
    setNewFlight(prev => ({ ...prev, [name]: value }));
  };

  const calculateFlightDuration = (departureTime, arrivalTime, departureTimezone, arrivalTimezone) => {
    const parseTimezoneOffset = (tz) => {
      if (!tz) return 0;
      // 支援更多時區格式的解析
      const match = tz.match(/UTC([+-]?\d+(?::\d+)?(?:\.\d+)?)/);
      if (match) {
        const offsetStr = match[1];
        // 處理小時:分鐘格式 (如 +5:30, -3:30)
        if (offsetStr.includes(':')) {
          const [hours, minutes] = offsetStr.split(':');
          return parseFloat(hours) + (parseFloat(minutes) / 60) * (hours.startsWith('-') ? -1 : 1);
        }
        return parseFloat(offsetStr);
      }
      return 0;
    };
    const departureOffset = parseTimezoneOffset(departureTimezone);
    const arrivalOffset = parseTimezoneOffset(arrivalTimezone);
    const departureDate = new Date(`2000-01-01T${departureTime || '00:00'}:00Z`);
    const arrivalDate = new Date(`2000-01-01T${arrivalTime || '00:00'}:00Z`);
    departureDate.setHours(departureDate.getHours() - departureOffset);
    arrivalDate.setHours(arrivalDate.getHours() - arrivalOffset);
    if (arrivalDate < departureDate) {
      arrivalDate.setDate(arrivalDate.getDate() + 1);
    }
    const durationMs = arrivalDate - departureDate;
    if (isNaN(durationMs) || durationMs < 0) return ''
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    return `${hours}小時${minutes}分`;
  };

  useEffect(() => {
    const { departureTime, arrivalTime, departureTimezone, arrivalTimezone } = newFlight;
    if (departureTime && arrivalTime) {
      const duration = calculateFlightDuration(departureTime, arrivalTime, departureTimezone, arrivalTimezone);
      setNewFlight(prev => ({ ...prev, duration }));
    }
  }, [newFlight.departureTime, newFlight.arrivalTime, newFlight.departureTimezone, newFlight.arrivalTimezone]);

  const generateTimezoneOptions = () => {
    return [
      'UTC-12（國際換日線）',
      'UTC-11（美屬薩摩亞）',
      'UTC-10（夏威夷－阿留申）',
      'UTC-9:30（馬克薩斯群島）',
      'UTC-9（阿拉斯加）',
      'UTC-8（太平洋）',
      'UTC-7（北美山區）',
      'UTC-6（北美中部）',
      'UTC-5（北美東部）',
      'UTC-4（大西洋）',
      'UTC-3:30（紐芬蘭島）',
      'UTC-3（巴西利亞）',
      'UTC-2（費爾南多·迪諾羅尼亞群島）',
      'UTC-1（維德角）',
      'UTC（歐洲西部.格林威治）',
      'UTC+1（歐洲中部）',
      'UTC+2（歐洲東部）',
      'UTC+3（歐洲極東／莫斯科）',
      'UTC+3:30（伊朗）',
      'UTC+4（海灣）',
      'UTC+4:30（阿富汗）',
      'UTC+5（巴基斯坦）',
      'UTC+5:30（印度）',
      'UTC+5:45（尼泊爾）',
      'UTC+6（孟加拉）',
      'UTC+6:30（緬甸）',
      'UTC+7（泰國.越南 / 中南半島）',
      'UTC+8（中港澳台 / 中原標準）',
      'UTC+9（日本）',
      'UTC+9:30（澳洲中部）',
      'UTC+10（澳洲東部）',
      'UTC+10:30（豪勳爵群島）',
      'UTC+11（萬那杜）',
      'UTC+12（紐西蘭）',
      'UTC+12:45（查塔姆群島）',
      'UTC+13（鳳凰群島）',
      'UTC+14（萊恩群島）'
    ];
  };
  const timezoneOptions = generateTimezoneOptions();

  const sortFlights = (flights) => [...flights].sort((a, b) => new Date(a.date) - new Date(b.date) || (a.departureTime || '').localeCompare(b.departureTime || ''));
  const sortTrips = (tripsToSort) => [...tripsToSort].sort((a, b) => sortOrder === 'desc' ? new Date(b.startDate) - new Date(a.startDate) : new Date(a.startDate) - new Date(b.startDate));
  const toggleSortOrder = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 1500);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setNewTrip(initialTripState);
    setNewFlight(initialFlightState);
    setIsEditingFlight(false);
    setEditingFlightId(null);
  };

  // --- Modal Handlers ---
  const openAddModal = () => {
    setIsChoiceModalOpen(false);
    setIsEditing(false);
    setNewTrip(initialTripState);
    setNewFlight(initialFlightState);
    setIsModalOpen(true);
  };

  const openAiModal = () => {
    setIsChoiceModalOpen(false);
    setIsAiModalOpen(true);
  };

  const closeAiModal = () => {
    setIsAiModalOpen(false);
    setAiInputText('');
  };

  const handleAiSubmit = async () => {
    if (!aiInputText.trim()) {
      alert("請輸入行程文字。");
      return;
    }
    setIsAiLoading(true);
    try {
      const response = await fetch(`/.netlify/functions/analyze-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: aiInputText }),
      });

      if (!response.ok) {
        throw new Error(`伺服器錯誤: ${response.status}`);
      }

      const data = await response.json();

      // 將 AI 回傳的資料填入表單
      setNewTrip(prev => ({
        ...prev,
        name: data.tripName || '',
        destination: data.destination || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        description: data.description || '',
        flights: data.flights || [],
        hotels: data.hotels || [],
        dailyItinerary: data.dailyItinerary || [],
      }));

      closeAiModal();
      setIsModalOpen(true); // 打開手動表單讓使用者確認
      showToast("AI 分析完成，請確認後儲存");

    } catch (error) {
      console.error("AI 分析失敗:", error);
      alert(`AI 分析失敗: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleEdit = (trip) => {
    setIsEditing(true);
    setNewTrip(trip);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("確定要刪除此行程嗎？此操作無法復原。")) {
      setTrips(trips.filter(trip => trip.id !== id));
      showToast('已刪除');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTrip.startDate && newTrip.endDate && new Date(newTrip.endDate) < new Date(newTrip.startDate)) {
      alert("結束日期不能早於開始日期。");
      return;
    }
    if (isEditing) {
      setTrips(trips.map(trip => trip.id === newTrip.id ? newTrip : trip));
      showToast('已更新');
    } else {
      const id = Date.now().toString();
      setTrips([...trips, { ...newTrip, id }]);
      setSelectedTripId(id);
      showToast('已新增');
    }
    closeModal();
  };

  const handleEditFlight = (flight) => {
    setNewFlight(flight);
    setIsEditingFlight(true);
    setEditingFlightId(flight.id);
  };

  const addFlight = () => {
    let airlineName = newFlight.airline === '其他' && newFlight.customAirline ? newFlight.customAirline : newFlight.airline;
    const flightToAdd = { ...newFlight, airline: airlineName, id: isEditingFlight ? editingFlightId : Date.now().toString() };
    
    let updatedFlights;
    if (isEditingFlight) {
      updatedFlights = newTrip.flights.map(f => f.id === editingFlightId ? flightToAdd : f);
      showToast('已更新航班');
    } else {
      updatedFlights = [...(newTrip.flights || []), flightToAdd];
      showToast('已新增航班');
    }
    setNewTrip(prev => ({ ...prev, flights: sortFlights(updatedFlights) }));
    showToast('請記得儲存行程後生效');

    setIsEditingFlight(false);
    setEditingFlightId(null);
    setNewFlight(initialFlightState);
  };

  const removeFlight = (flightId) => {
    setNewTrip(prev => ({ ...prev, flights: prev.flights.filter(f => f.id !== flightId) }));
    showToast('已刪除航班');
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        {toast.show && (
          <ToastBackdrop>
            <Toast className="show">{toast.message}</Toast>
          </ToastBackdrop>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>我的行程</h2>
          <Button onClick={toggleSortOrder} style={{ padding: '0.5rem 1rem' }} $fixedBlue>
            {sortOrder === 'desc' ? '排序：新到舊 ↓' : '排序：舊到新 ↑'}
          </Button>
        </div>

        <CardsContainer ref={cardsContainerRef}>
          {trips.length === 0 ? (
            <EmptyCard>尚未新增行程</EmptyCard>
          ) : (
            sortTrips(trips).map(trip => (
              <TripCard 
                key={trip.id}
                ref={el => cardRefs.current[trip.id] = el}
                $selected={selectedTripId === trip.id}
                onClick={() => setSelectedTripId(trip.id)}
              >
                <div>
                  <h4>{trip.name}</h4>
                  <DestinationDisplay><strong>目的地:</strong> {trip.destination}</DestinationDisplay>
                  <CardBodyText><strong>日期:</strong> {trip.startDate} to {trip.endDate}</CardBodyText>
                  <CardBodyText>{trip.description}</CardBodyText>

                  {trip.flights && trip.flights.length > 0 && (
                    <FlightInfoList>
                      <h5>✈️ 航班資訊</h5>
                      {sortFlights(trip.flights).map(flight => (
                        <FlightEntry key={flight.id}>
                          <p><strong>{flight.date}</strong> - {flight.airline || 'N/A'} {flight.flightNumber || 'N/A'}</p>
                          <p>{flight.departureCity || 'N/A'} ({flight.departureTime || '--:--'}) → {flight.arrivalCity || 'N/A'} ({flight.arrivalTime || '--:--'})</p>
                          <p><i>飛行時間: {flight.duration || 'N/A'}</i></p>
                        </FlightEntry>
                      ))}
                    </FlightInfoList>
                  )}
                </div>
                <ButtonGroup>
                  <Button $primary onClick={(e) => { e.stopPropagation(); handleEdit(trip); }}>編輯</Button>
                  <Button $danger onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}>刪除</Button>
                </ButtonGroup>
              </TripCard>
            ))
          )}
        </CardsContainer>

        <FloatingActionButton onClick={() => setIsChoiceModalOpen(true)}>+</FloatingActionButton>

        {/* --- Choice Modal --- */}
        {isChoiceModalOpen && (
          <ModalBackdrop onClick={() => setIsChoiceModalOpen(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <CloseButton onClick={() => setIsChoiceModalOpen(false)}>&times;</CloseButton>
              <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>選擇新增方式</h3>
              <ButtonGroup style={{ justifyContent: 'center', gap: '1rem' }}>
                <Button onClick={openAddModal} $choiceButton style={{ padding: '1rem 2rem' }}>手動輸入行程</Button>
                <Button onClick={openAiModal} $choiceButton style={{ padding: '1rem 2rem' }}>AI 辨識行程</Button>
              </ButtonGroup>
            </ModalContent>
          </ModalBackdrop>
        )}

        {/* --- AI Input Modal --- */}
        {isAiModalOpen && (
          <ModalBackdrop onClick={closeAiModal}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <CloseButton onClick={closeAiModal}>&times;</CloseButton>
              <h3>AI 辨識行程</h3>
              <p style={{ margin: '1rem 0', color: '#666' }}>請在下方貼上您的行程文字，AI 將嘗試自動為您分析並填入表單。</p>
              <textarea
                style={{ width: '100%', minHeight: '250px', marginTop: '1rem', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box' }}
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="例如：&#10;- 航班：中華航空 CI751 8/15 09:20 TPE -> SIN&#10;- 飯店：濱海灣金沙酒店 8/15-8/18&#10;- 活動：8/16 早上 10:00 環球影城"
              />
              <ButtonGroup>
                <Button type="button" onClick={closeAiModal} disabled={isAiLoading}>取消</Button>
                <Button type="button" onClick={handleAiSubmit} $primary disabled={isAiLoading}>
                  {isAiLoading ? '辨識中...' : '開始辨識'}
                </Button>
              </ButtonGroup>
            </ModalContent>
          </ModalBackdrop>
        )}

        {/* --- Manual Input Modal --- */}
        {isModalOpen && (
          <ModalBackdrop onClick={closeModal}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
              <h3>{isEditing ? '編輯行程' : '新增行程'}</h3>
              <TripForm onSubmit={handleSubmit}>
                <FormGroup $editing={isEditing}>
                  <label htmlFor="name">行程名稱</label>
                  <input type="text" id="name" name="name" value={newTrip.name} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup $editing={isEditing}>
                  <label htmlFor="destination">目的地</label>
                  <input type="text" id="destination" name="destination" value={newTrip.destination} onChange={handleInputChange} required />
                </FormGroup>
                <FormRow>
                  <FormGroup $editing={isEditing}>
                    <label htmlFor="startDate">開始日期</label>
                    <input type="date" id="startDate" name="startDate" value={newTrip.startDate} onChange={handleInputChange} required />
                  </FormGroup>
                  <FormGroup $editing={isEditing}>
                    <label htmlFor="endDate">結束日期</label>
                    <input type="date" id="endDate" name="endDate" value={newTrip.endDate} onChange={handleInputChange} required />
                  </FormGroup>
                </FormRow>
                <FormGroup $editing={isEditing}>
                  <label htmlFor="description">行程描述</label>
                  <textarea id="description" name="description" value={newTrip.description} onChange={handleInputChange} rows="3"></textarea>
                </FormGroup>

                <FormSection>
                  <h4>{isEditingFlight ? '編輯航班資訊' : '航班資訊（選填）'}</h4>
                  <FormRow>
                    <FormGroup $editing={isEditingFlight}><label>日期</label><input type="date" name="date" value={newFlight.date} onChange={handleFlightInputChange} /></FormGroup>
                    <FormGroup $editing={isEditingFlight}><label>航空公司</label><select name="airline" value={newFlight.airline} onChange={handleFlightInputChange}><option value="">--選擇--</option>{taiwanAirlines.map(a => <option key={a} value={a}>{a}</option>)}</select></FormGroup>
                    {newFlight.airline === '其他' && <FormGroup $editing={isEditingFlight}><label>自定義</label><input type="text" name="customAirline" value={newFlight.customAirline} onChange={handleFlightInputChange} /></FormGroup>}
                  </FormRow>
                  <FormRow>
                    <FormGroup $editing={isEditingFlight}><label>航班編號</label><input type="text" name="flightNumber" value={newFlight.flightNumber} onChange={handleFlightInputChange} placeholder="例如: BR182" /></FormGroup>
                  </FormRow>
                  <FormRow>
                    <FormGroup $editing={isEditingFlight}>
                      <label>起飛城市</label>
                      <AutocompleteInput airports={airportsData} value={newFlight.departureCity} onChange={handleFlightInputChange} onSelect={handleAutocompleteSelect} name="departureCity" placeholder="輸入城市或機場代碼" />
                    </FormGroup>
                    <FormGroup $editing={isEditingFlight}>
                      <label>抵達城市</label>
                      <AutocompleteInput airports={airportsData} value={newFlight.arrivalCity} onChange={handleFlightInputChange} onSelect={handleAutocompleteSelect} name="arrivalCity" placeholder="輸入城市或機場代碼" />
                    </FormGroup>
                  </FormRow>
                  <FormRow>
                    <FormGroup $editing={isEditingFlight}><label>起飛時間</label><input type="time" name="departureTime" value={newFlight.departureTime} onChange={handleFlightInputChange} /></FormGroup>
                    <FormGroup $editing={isEditingFlight}><label>起飛時區</label><select name="departureTimezone" value={newFlight.departureTimezone} onChange={handleFlightInputChange}>{timezoneOptions.map(tz => <option key={tz} value={tz}>{tz}</option>)}</select></FormGroup>
                  </FormRow>
                  <FormRow>
                    <FormGroup $editing={isEditingFlight}><label>降落時間</label><input type="time" name="arrivalTime" value={newFlight.arrivalTime} onChange={handleFlightInputChange} /></FormGroup>
                    <FormGroup $editing={isEditingFlight}><label>降落時區</label><select name="arrivalTimezone" value={newFlight.arrivalTimezone} onChange={handleFlightInputChange}>{timezoneOptions.map(tz => <option key={tz} value={tz}>{tz}</option>)}</select></FormGroup>
                  </FormRow>
                  <ButtonGroup>
                    <Button type="button" $primary onClick={addFlight}>{isEditingFlight ? '更新航班' : '新增航班'}</Button>
                    {isEditingFlight && <Button type="button" onClick={() => { setIsEditingFlight(false); setEditingFlightId(null); setNewFlight(initialFlightState); }}>取消編輯</Button>}
                  </ButtonGroup>
                  
                  {newTrip.flights && newTrip.flights.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <h5>已新增航班</h5>
                      <FlightTable>
                        <thead><tr><th>日期</th><th>航班</th><th>時間</th><th>操作</th></tr></thead>
                        <tbody>
                          {sortFlights(newTrip.flights).map(f => (
                            <tr key={f.id} style={{backgroundColor: f.id === editingFlightId ? '#fff8e6' : 'transparent'}}>
                              <td>{f.date}</td>
                              <td>{f.airline}<br/>{f.flightNumber}</td>
                              <td>{f.departureTime} - {f.arrivalTime}<br/><i>{f.duration}</i></td>
                              <td>
                                <ButtonGroup>
                                  <Button type="button" $primary onClick={() => handleEditFlight(f)}>編</Button>
                                  <Button type="button" $danger onClick={() => removeFlight(f.id)}>刪</Button>
                                </ButtonGroup>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </FlightTable>
                    </div>
                  )}
                </FormSection>

                <ButtonGroup>
                  <Button type="button" onClick={closeModal}>取消</Button>
                  <Button $primary type="submit">{isEditing ? '更新行程' : '新增行程'}</Button>
                </ButtonGroup>
              </TripForm>
            </ModalContent>
          </ModalBackdrop>
        )}
      </Container>
    </>
  );
};

export default TripManagement;