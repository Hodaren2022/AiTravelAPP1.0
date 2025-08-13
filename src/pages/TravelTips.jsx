import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTrip } from '../contexts/TripContext'

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`

const TripSelector = styled.div`
  margin-bottom: 1rem;
`

const TipCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const TipForm = styled.form`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`

const Button = styled.button`
  background-color: ${props => props.$primary ? '#3498db' : '#e74c3c'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
`

const TipCategories = [
  '簽證資訊',
  '天氣資訊',
  '交通資訊',
  '貨幣與支付',
  '安全提示',
  '當地習俗',
  '緊急聯絡',
  '其他'
];

const TravelTips = () => {
  const { trips, selectedTripId, setSelectedTripId } = useTrip();
  const [tips, setTips] = useState(() => {
    const savedTips = localStorage.getItem('travelTips');
    return savedTips ? JSON.parse(savedTips) : {};
  });
  
  const [newTip, setNewTip] = useState({
    id: '',
    category: '',
    title: '',
    content: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  
  useEffect(() => {
    localStorage.setItem('travelTips', JSON.stringify(tips));
  }, [tips]);
  
  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
    
    // 確保選定行程的旅遊須知存在
    if (tripId && !tips[tripId]) {
      setTips(prev => ({
        ...prev,
        [tripId]: []
      }));
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTip(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTripId) return;
    
    const tripTips = tips[selectedTripId] || [];
    
    if (isEditing) {
      const updatedTips = tripTips.map(tip => 
        tip.id === newTip.id ? newTip : tip
      );
      
      setTips({
        ...tips,
        [selectedTripId]: updatedTips
      });
      
      setIsEditing(false);
    } else {
      const id = Date.now().toString();
      
      setTips({
        ...tips,
        [selectedTripId]: [...tripTips, { ...newTip, id }]
      });
    }
    
    setNewTip({
      id: '',
      category: '',
      title: '',
      content: ''
    });
  };
  
  const handleEdit = (tip) => {
    setNewTip(tip);
    setIsEditing(true);
  };
  
  const handleDelete = (tipId) => {
    const tripTips = tips[selectedTripId] || [];
    
    const updatedTips = tripTips.filter(tip => tip.id !== tipId);
    
    setTips({
      ...tips,
      [selectedTripId]: updatedTips
    });
  };
  
  // 獲取選定行程的旅遊須知
  const selectedTripTips = selectedTripId ? (tips[selectedTripId] || []) : [];
  
  // 根據分類過濾旅遊須知
  const filteredTips = filterCategory
    ? selectedTripTips.filter(tip => tip.category === filterCategory)
    : selectedTripTips;
  
  return (
    <Container>
      <h2>旅遊須知</h2>
      
      <TripSelector>
        <label htmlFor="trip">選擇行程:</label>
        <select
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
        </select>
      </TripSelector>
      
      {selectedTripId ? (
        <>
          <TipForm onSubmit={handleSubmit}>
            <h3>{isEditing ? '編輯旅遊須知' : '新增旅遊須知'}</h3>
            
            <div>
              <label htmlFor="category">分類</label>
              <select
                id="category"
                name="category"
                value={newTip.category}
                onChange={handleInputChange}
                required
              >
                <option value="">-- 選擇分類 --</option>
                {TipCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="title">標題</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTip.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="content">內容</label>
              <textarea
                id="content"
                name="content"
                value={newTip.content}
                onChange={handleInputChange}
                rows="4"
                required
              ></textarea>
            </div>
            
            <ButtonGroup>
              <Button $primary type="submit">
                {isEditing ? '更新旅遊須知' : '新增旅遊須知'}
              </Button>
              {isEditing && (
                <Button type="button" onClick={() => {
                  setIsEditing(false);
                  setNewTip({
                    id: '',
                    category: '',
                    title: '',
                    content: ''
                  });
                }}>
                  取消
                </Button>
              )}
            </ButtonGroup>
          </TipForm>
          
          <div>
            <h3>已保存的旅遊須知</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="filterCategory">按分類過濾:</label>
              <select
                id="filterCategory"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">所有分類</option>
                {TipCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            {filteredTips.length === 0 ? (
              <p>{filterCategory ? `沒有${filterCategory}分類的旅遊須知` : '尚未添加任何旅遊須知'}</p>
            ) : (
              filteredTips.map(tip => (
                <TipCard key={tip.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{tip.title}</h4>
                    <span style={{
                      backgroundColor: '#f0f0f0',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {tip.category}
                    </span>
                  </div>
                  <p style={{ whiteSpace: 'pre-line' }}>{tip.content}</p>
                  <ButtonGroup>
                    <Button $primary onClick={() => handleEdit(tip)}>編輯</Button>
                    <Button onClick={() => handleDelete(tip.id)}>刪除</Button>
                  </ButtonGroup>
                </TipCard>
              ))
            )}
          </div>
        </>
      ) : (
        <p>請先選擇一個行程</p>
      )}
    </Container>
  );
};

export default TravelTips;