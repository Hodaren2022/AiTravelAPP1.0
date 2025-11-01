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

const DailyItinerary = () => {
  const { trips, setTrips, selectedTripId, setSelectedTripId } = useTrip();
  
  const [newActivity, setNewActivity] = useState({
    id: '',
    date: '',
    time: '',
    activity: '',
    location: '',
    notes: ''
  });

  const initialActivityState = {
    id: '',
    date: '',
    time: '',
    activity: '',
    location: '',
    notes: ''
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 預設升序
  
  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTripId || !newActivity.date) return;
    
    setTrips(prevTrips => prevTrips.map(trip => {
      if (trip.id === selectedTripId) {
        let updatedDailyItinerary;
        if (isEditing) {
          updatedDailyItinerary = trip.dailyItinerary.map(activity => 
            activity.id === newActivity.id ? newActivity : activity
          );
        } else {
          const id = Date.now().toString();
          updatedDailyItinerary = [...(trip.dailyItinerary || []), { ...newActivity, id }];
        }
        return { ...trip, dailyItinerary: updatedDailyItinerary };
      }
      return trip;
    }));
    
    setIsEditing(false);
    setNewActivity({
      id: '',
      date: newActivity.date, // 保留當前選擇的日期
      time: '',
      activity: '',
      location: '',
      notes: ''
    });
  };
  
  const handleEdit = (activity) => {
    setNewActivity(activity);
    setIsEditing(true);
    setIsModalOpen(true);
  };
  
  const handleDelete = (date, activityId) => {
    if (!selectedTripId) return;

    setTrips(prevTrips => prevTrips.map(trip => {
      if (trip.id === selectedTripId) {
        const updatedDailyItinerary = (trip.dailyItinerary || []).filter(activity => activity.id !== activityId);
        return { ...trip, dailyItinerary: updatedDailyItinerary };
      }
      return trip;
    }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setNewActivity(initialActivityState);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setNewActivity(initialActivityState);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortActivities = (activitiesToSort) => {
    return [...activitiesToSort].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA - dateB !== 0) {
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      // If dates are the same, sort by time
      return sortOrder === 'asc' ? a.time.localeCompare(b.time) : b.time.localeCompare(a.time);
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
  const selectedTrip = trips.find(trip => trip.id === selectedTripId);
  const selectedTripItinerary = selectedTrip ? (selectedTrip.dailyItinerary || []) : [];

  const sortedActivities = sortActivities(selectedTripItinerary);

  // Group activities by date for display
  const groupedActivities = sortedActivities.reduce((acc, activity) => {
    const date = activity.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {});

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>行程安排</h3>
            <Button onClick={toggleSortOrder} $primary>
              排序：{sortOrder === 'asc' ? '日期時間 ↑' : '日期時間 ↓'}
            </Button>
          </div>
          {Object.keys(groupedActivities).length > 0 ? (
            Object.keys(groupedActivities)
              .sort((dateA, dateB) => {
                const d1 = new Date(dateA);
                const d2 = new Date(dateB);
                return sortOrder === 'asc' ? d1 - d2 : d2 - d1;
              })
              .map(date => {
                const activities = groupedActivities[date] || [];
                const dayLabel = dayOptions.find(day => day.value === date)?.label || date; // 找到對應的日期標籤
                return (
                  <DayCard key={date}>
                    <h4>{dayLabel}</h4>
                    {activities.length === 0 ? (
                      <p>尚未安排活動</p>
                    ) : (
                      activities.map(activity => (
                          <ActivityCard key={activity.id}>
                            <p>{activity.time ? <><strong>{activity.time}</strong> - </> : null}{activity.activity}</p>
                            {activity.location && <p>地點: {activity.location}</p>}
                            {activity.notes && <p>備註: {activity.notes}</p>}
                            <ButtonGroup>
                              <Button $primary onClick={() => handleEdit(activity)}>編輯</Button>
                              <Button onClick={() => handleDelete(activity.date, activity.id)}>刪除</Button>
                            </ButtonGroup>
                          </ActivityCard>
                        ))
                    )}
                  </DayCard>
                );
              })
          ) : (
            <p>尚未安排活動或請先設定行程的開始和結束日期</p>
          )}
        </>
      ) : (
        <p>請先選擇一個行程</p>
      )}

      <FloatingActionButton onClick={openAddModal}>+</FloatingActionButton>

      {isModalOpen && (
        <ModalBackdrop onClick={closeModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
            <ActivityForm onSubmit={handleSubmit}>
              <h3>{isEditing ? '編輯活動' : '新增活動'}</h3>
              
              <div>
                <label htmlFor="date">日期</label>
                <select
                  id="date"
                  name="date"
                  value={newActivity.date}
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
                <label htmlFor="time">時間（選填）</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={newActivity.time}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="activity">活動描述</label>
                <input
                  type="text"
                  id="activity"
                  name="activity"
                  value={newActivity.activity}
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
              
              <div>
                <label htmlFor="notes">備註</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newActivity.notes}
                  onChange={handleInputChange}
                  rows="2"
                ></textarea>
              </div>
              
              <ButtonGroup>
                <Button $primary type="submit">
                  {isEditing ? '更新活動' : '新增活動'}
                </Button>
                {isEditing && (
                  <Button type="button" onClick={() => {
                    setIsEditing(false);
                    setNewActivity(initialActivityState);
                  }}>
                    取消
                  </Button>
                )}
              </ButtonGroup>
            </ActivityForm>
          </ModalContent>
        </ModalBackdrop>
      )}
    </Container>
  );
};

export default DailyItinerary;