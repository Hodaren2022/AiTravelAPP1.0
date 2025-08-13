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

const HotelCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const HotelForm = styled.form`
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

const HotelInfo = () => {
  const { trips, selectedTripId, setSelectedTripId } = useTrip();
  const [hotels, setHotels] = useState(() => {
    const savedHotels = localStorage.getItem('hotels');
    return savedHotels ? JSON.parse(savedHotels) : {};
  });
  
  const [newHotel, setNewHotel] = useState({
    id: '',
    name: '',
    address: '',
    checkIn: '',
    checkOut: '',
    confirmationNumber: '',
    notes: '',
    price: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('hotels', JSON.stringify(hotels));
  }, [hotels]);
  
  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
    
    // 確保選定行程的旅館資訊存在
    if (tripId && !hotels[tripId]) {
      setHotels(prev => ({
        ...prev,
        [tripId]: []
      }));
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHotel(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTripId) return;
    
    const tripHotels = hotels[selectedTripId] || [];
    
    if (isEditing) {
      const updatedHotels = tripHotels.map(hotel => 
        hotel.id === newHotel.id ? newHotel : hotel
      );
      
      setHotels({
        ...hotels,
        [selectedTripId]: updatedHotels
      });
      
      setIsEditing(false);
    } else {
      const id = Date.now().toString();
      
      setHotels({
        ...hotels,
        [selectedTripId]: [...tripHotels, { ...newHotel, id }]
      });
    }
    
    setNewHotel({
      id: '',
      name: '',
      address: '',
      checkIn: '',
      checkOut: '',
      confirmationNumber: '',
      notes: '',
      price: ''
    });
  };
  
  const handleEdit = (hotel) => {
    setNewHotel(hotel);
    setIsEditing(true);
  };
  
  const handleDelete = (hotelId) => {
    const tripHotels = hotels[selectedTripId] || [];
    
    const updatedHotels = tripHotels.filter(hotel => hotel.id !== hotelId);
    
    setHotels({
      ...hotels,
      [selectedTripId]: updatedHotels
    });
  };
  
  // 獲取選定行程的旅館資訊
  const selectedTripHotels = selectedTripId ? (hotels[selectedTripId] || []) : [];
  
  return (
    <Container>
      <h2>旅館資訊</h2>
      
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
          <HotelForm onSubmit={handleSubmit}>
            <h3>{isEditing ? '編輯旅館資訊' : '新增旅館資訊'}</h3>
            
            <div>
              <label htmlFor="name">旅館名稱</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newHotel.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="address">地址</label>
              <input
                type="text"
                id="address"
                name="address"
                value={newHotel.address}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="checkIn">入住日期</label>
              <input
                type="date"
                id="checkIn"
                name="checkIn"
                value={newHotel.checkIn}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="checkOut">退房日期</label>
              <input
                type="date"
                id="checkOut"
                name="checkOut"
                value={newHotel.checkOut}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmationNumber">訂房確認號碼</label>
              <input
                type="text"
                id="confirmationNumber"
                name="confirmationNumber"
                value={newHotel.confirmationNumber}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="price">價格</label>
              <input
                type="number"
                id="price"
                name="price"
                value={newHotel.price}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="notes">備註</label>
              <textarea
                id="notes"
                name="notes"
                value={newHotel.notes}
                onChange={handleInputChange}
                rows="4"
              ></textarea>
            </div>
            
            <ButtonGroup>
              <Button $primary type="submit">
                {isEditing ? '更新旅館資訊' : '新增旅館資訊'}
              </Button>
              {isEditing && (
                <Button type="button" onClick={() => {
                  setIsEditing(false);
                  setNewHotel({
                    id: '',
                    name: '',
                    address: '',
                    checkIn: '',
                    checkOut: '',
                    confirmationNumber: '',
                    notes: '',
                    price: ''
                  });
                }}>
                  取消
                </Button>
              )}
            </ButtonGroup>
          </HotelForm>
          
          <div>
            <h3>已保存的旅館資訊</h3>
            {selectedTripHotels.length === 0 ? (
              <p>尚未添加任何旅館資訊</p>
            ) : (
              selectedTripHotels.map(hotel => (
                <HotelCard key={hotel.id}>
                  <h4>{hotel.name}</h4>
                  <p><strong>地址:</strong> {hotel.address}</p>
                  <p><strong>入住日期:</strong> {hotel.checkIn}</p>
                  <p><strong>退房日期:</strong> {hotel.checkOut}</p>
                  {hotel.confirmationNumber && (
                    <p><strong>訂房確認號碼:</strong> {hotel.confirmationNumber}</p>
                  )}
                  {hotel.price && (
                    <p><strong>價格:</strong> ${hotel.price}</p>
                  )}
                  {hotel.notes && (
                    <p><strong>備註:</strong> {hotel.notes}</p>
                  )}
                  <ButtonGroup>
                    <Button $primary onClick={() => handleEdit(hotel)}>編輯</Button>
                    <Button onClick={() => handleDelete(hotel.id)}>刪除</Button>
                  </ButtonGroup>
                </HotelCard>
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

export default HotelInfo;