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

const HotelInfo = () => {
  const { trips, setTrips, selectedTripId, setSelectedTripId } = useTrip();
  
  const [newHotel, setNewHotel] = useState({
    id: '',
    name: '',
    address: '',
    checkInDate: '',
    checkOutDate: '',
    contact: '',
    confirmationNumber: '',
    notes: '',
    price: ''
  });

  const initialHotelState = {
    id: '',
    name: '',
    address: '',
    checkInDate: '',
    checkOutDate: '',
    contact: '',
    confirmationNumber: '',
    notes: '',
    price: ''
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
    setNewHotel(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTripId) return;
    
    setTrips(prevTrips => prevTrips.map(trip => {
      if (trip.id === selectedTripId) {
        let updatedHotels;
        if (isEditing) {
          updatedHotels = trip.hotels.map(hotel => 
            hotel.id === newHotel.id ? newHotel : hotel
          );
        } else {
          const id = Date.now().toString();
          updatedHotels = [...(trip.hotels || []), { ...newHotel, id }];
        }
        return { ...trip, hotels: updatedHotels };
      }
      return trip;
    }));
    
    setIsEditing(false);
    setNewHotel({
      id: '',
      name: '',
      address: '',
      checkInDate: '',
      checkOutDate: '',
      contact: '',
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
    if (!selectedTripId) return;

    setTrips(prevTrips => prevTrips.map(trip => {
      if (trip.id === selectedTripId) {
        const updatedHotels = (trip.hotels || []).filter(hotel => hotel.id !== hotelId);
        return { ...trip, hotels: updatedHotels };
      }
      return trip;
    }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setNewHotel(initialHotelState);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setNewHotel(initialHotelState);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortHotels = (hotelsToSort) => {
    return [...hotelsToSort].sort((a, b) => {
      const dateA = new Date(a.checkInDate);
      const dateB = new Date(b.checkInDate);
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  };
  
  // 獲取選定行程的旅館資訊
  const selectedTrip = trips.find(trip => trip.id === selectedTripId);
  const selectedTripHotels = selectedTrip ? (selectedTrip.hotels || []) : [];

  const sortedHotels = sortHotels(selectedTripHotels);
  
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>已保存的旅館資訊</h3>
            <Button onClick={toggleSortOrder} $primary>
              排序：{sortOrder === 'asc' ? '入住日期 ↑' : '入住日期 ↓'}
            </Button>
          </div>
          {sortedHotels.length === 0 ? (
            <p>尚未添加任何旅館資訊</p>
          ) : (
            sortedHotels.map(hotel => (
              <HotelCard key={hotel.id}>
                <h4>{hotel.name}</h4>
                <p><strong>地址:</strong> {hotel.address}</p>
                <p><strong>入住日期:</strong> {hotel.checkInDate}</p>
                <p><strong>退房日期:</strong> {hotel.checkOutDate}</p>
                {hotel.contact && (
                  <p><strong>聯絡方式:</strong> {hotel.contact}</p>
                )}
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
        </>
      ) : (
        <p>請先選擇一個行程</p>
      )}

      <FloatingActionButton onClick={openAddModal}>+</FloatingActionButton>

      {isModalOpen && (
        <ModalBackdrop onClick={closeModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
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
                <label htmlFor="checkInDate">入住日期</label>
                <input
                  type="date"
                  id="checkInDate"
                  name="checkInDate"
                  value={newHotel.checkInDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="checkOutDate">退房日期</label>
                <input
                  type="date"
                  id="checkOutDate"
                  name="checkOutDate"
                  value={newHotel.checkOutDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contact">聯絡方式</label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={newHotel.contact}
                  onChange={handleInputChange}
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
                    setNewHotel(initialHotelState);
                  }}>
                    取消
                  </Button>
                )}
              </ButtonGroup>
            </HotelForm>
          </ModalContent>
        </ModalBackdrop>
      )}
    </Container>
  );
};

export default HotelInfo;