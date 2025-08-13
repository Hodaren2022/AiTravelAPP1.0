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

const DayCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const ActivityCard = styled.div`
  background-color: #f8f9fa;
  border-left: 4px solid #3498db;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
`

const ActivityForm = styled.form`
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

const DailyItinerary = () => {
  const { trips, selectedTripId, setSelectedTripId } = useTrip();
  const [itineraries, setItineraries] = useState(() => {
    const savedItineraries = localStorage.getItem('itineraries');
    return savedItineraries ? JSON.parse(savedItineraries) : {};
  });
  
  const [newActivity, setNewActivity] = useState({
    id: '',
    day: '',
    time: '',
    description: '',
    location: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('itineraries', JSON.stringify(itineraries));
  }, [itineraries]);
  
  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
    
    // 確保選定行程的行程表存在
    if (tripId && !itineraries[tripId]) {
      setItineraries(prev => ({
        ...prev,
        [tripId]: {}
      }));
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTripId || !newActivity.day) return;
    
    const tripItinerary = itineraries[selectedTripId] || {};
    const dayActivities = tripItinerary[newActivity.day] || [];
    
    if (isEditing) {
      const updatedActivities = dayActivities.map(activity => 
        activity.id === newActivity.id ? newActivity : activity
      );
      
      setItineraries({
        ...itineraries,
        [selectedTripId]: {
          ...tripItinerary,
          [newActivity.day]: updatedActivities
        }
      });
      
      setIsEditing(false);
    } else {
      const id = Date.now().toString();
      
      setItineraries({
        ...itineraries,
        [selectedTripId]: {
          ...tripItinerary,
          [newActivity.day]: [...dayActivities, { ...newActivity, id }]
        }
      });
    }
    
    setNewActivity({
      id: '',
      day: newActivity.day, // 保留當前選擇的日期
      time: '',
      description: '',
      location: ''
    });
  };
  
  const handleEdit = (activity) => {
    setNewActivity(activity);
    setIsEditing(true);
  };
  
  const handleDelete = (day, activityId) => {
    const tripItinerary = itineraries[selectedTripId] || {};
    const dayActivities = tripItinerary[day] || [];
    
    const updatedActivities = dayActivities.filter(activity => activity.id !== activityId);
    
    setItineraries({
      ...itineraries,
      [selectedTripId]: {
        ...tripItinerary,
        [day]: updatedActivities
      }
    });
  };
  
  // 生成日期選項
  const generateDayOptions = () => {
    if (!selectedTripId) return [];
    
    const trip = trips.find(trip => trip.id === selectedTripId);
    if (!trip) return [];
    
    const { startDate, endDate } = trip;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    return Array.from({ length: dayCount }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return {
        value: date.toISOString().split('T')[0],
        label: `第${i + 1}天 (${date.toLocaleDateString()})`
      };
    });
  };
  
  const dayOptions = generateDayOptions();
  
  // 獲取選定行程的行程表
  const selectedTripItinerary = selectedTripId ? (itineraries[selectedTripId] || {}) : {};
  
  return (
    <Container>
      <h2>每日行程</h2>
      
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
          <ActivityForm onSubmit={handleSubmit}>
            <h3>{isEditing ? '編輯活動' : '新增活動'}</h3>
            
            <div>
              <label htmlFor="day">日期</label>
              <select
                id="day"
                name="day"
                value={newActivity.day}
                onChange={handleInputChange}
                required
              >
                <option value="">-- 選擇日期 --</option>
                {dayOptions.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="time">時間</label>
              <input
                type="time"
                id="time"
                name="time"
                value={newActivity.time}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="description">活動描述</label>
              <input
                type="text"
                id="description"
                name="description"
                value={newActivity.description}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="location">地點</label>
              <input
                type="text"
                id="location"
                name="location"
                value={newActivity.location}
                onChange={handleInputChange}
              />
            </div>
            
            <ButtonGroup>
              <Button $primary type="submit">
                {isEditing ? '更新活動' : '新增活動'}
              </Button>
              {isEditing && (
                <Button type="button" onClick={() => {
                  setIsEditing(false);
                  setNewActivity({
                    id: '',
                    day: newActivity.day,
                    time: '',
                    description: '',
                    location: ''
                  });
                }}>
                  取消
                </Button>
              )}
            </ButtonGroup>
          </ActivityForm>
          
          <div>
            <h3>行程安排</h3>
            {dayOptions.length > 0 ? (
              dayOptions.map(day => {
                const activities = selectedTripItinerary[day.value] || [];
                return (
                  <DayCard key={day.value}>
                    <h4>{day.label}</h4>
                    {activities.length === 0 ? (
                      <p>尚未安排活動</p>
                    ) : (
                      activities
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map(activity => (
                          <ActivityCard key={activity.id}>
                            <p><strong>{activity.time}</strong> - {activity.description}</p>
                            {activity.location && <p>地點: {activity.location}</p>}
                            <ButtonGroup>
                              <Button $primary onClick={() => handleEdit(activity)}>編輯</Button>
                              <Button onClick={() => handleDelete(day.value, activity.id)}>刪除</Button>
                            </ButtonGroup>
                          </ActivityCard>
                        ))
                    )}
                  </DayCard>
                );
              })
            ) : (
              <p>請先設定行程的開始和結束日期</p>
            )}
          </div>
        </>
      ) : (
        <p>請先選擇一個行程</p>
      )}
    </Container>
  );
};

export default DailyItinerary;