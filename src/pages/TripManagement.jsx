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
  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
  &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
`;
const TripCard = styled.div`
  flex: 0 0 300px; background-color: white; border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 1.5rem;
  display: flex; flex-direction: column; justify-content: space-between;
  transition: transform 0.2s ease-in-out;
  &:hover { transform: translateY(-5px); }
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
  background-color: ${props => props.$fixedBlue ? '#3498db' : (props.$primary ? '#3498db' : (props.$danger ? '#e74c3c' : '#bdc3c7'))};
  color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px;
  cursor: pointer; font-weight: bold;
  transition: ${props => props.$fixedBlue ? 'none' : 'background-color 0.2s'}; /* No transition for fixed blue */
  font-size: var(--font-size-body);
  &:hover {
    ${props => props.$fixedBlue ? 'opacity: 1;' : 'opacity: 0.9;'} /* No opacity change for fixed blue */
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
  const { trips, setTrips, setSelectedTripId } = useTrip();
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const initialTripState = { id: '', name: '', destination: '', startDate: '', endDate: '', description: '', flights: [] };
  const initialFlightState = { date: '', airline: '', flightNumber: '', departureCity: '', arrivalCity: '', departureTime: '', arrivalTime: '', departureTimezone: 'UTC+8 (台灣)', arrivalTimezone: 'UTC+8 (台灣)', customAirline: '', duration: '' };

  const [newTrip, setNewTrip] = useState(initialTripState);
  const [newFlight, setNewFlight] = useState(initialFlightState);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingFlight, setIsEditingFlight] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);

  useEffect(() => {
    if (isModalOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isModalOpen]);

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
    const parseTimezoneOffset = (tz) => tz ? parseFloat(tz.match(/UTC([+-]?\d+(\.\d+)?)/)?.[1] || 0) : 0;
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
    const timezones = [];
    const timezoneCountries = {
      '-12': '', '-11': '(美屬薩摩亞)', '-10': '(夏威夷)', '-9': '(阿拉斯加)', '-8': '(美國西岸)', '-7': '(美國山區)', '-6': '(美國中部)', '-5': '(美國東岸)', '-4': '(大西洋)', '-3': '(巴西)', '-2': '', '-1': '', '0': '(格林威治)', '1': '(中歐)', '2': '(東歐)', '3': '(莫斯科)', '4': '(杜拜)', '5': '(巴基斯坦)', '5.5': '(印度)', '6': '(孟加拉)', '7': '(泰國)', '8': '(台灣)', '9': '(日韓)', '10': '(澳洲東部)', '11': '', '12': '(紐西蘭)', '13': '', '14': ''
    };
    for (let i = -12; i <= 14; i++) {
      if (i === 5) {
        timezones.push(`UTC+5 ${timezoneCountries['5']}`);
        timezones.push(`UTC+5.5 ${timezoneCountries['5.5']}`);
        continue;
      }
      const sign = i >= 0 ? '+' : '';
      const annotation = timezoneCountries[i.toString()] || '';
      timezones.push(`UTC${sign}${i} ${annotation}`);
    }
    return timezones;
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

  const openAddModal = () => {
    setIsEditing(false);
    setNewTrip(initialTripState);
    setNewFlight(initialFlightState);
    setIsModalOpen(true);
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

        <CardsContainer>
          {trips.length === 0 ? (
            <EmptyCard>尚未新增行程</EmptyCard>
          ) : (
            sortTrips(trips).map(trip => (
              <TripCard key={trip.id}>
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
                  <Button $primary onClick={() => handleEdit(trip)}>編輯</Button>
                  <Button $danger onClick={() => handleDelete(trip.id)}>刪除</Button>
                </ButtonGroup>
              </TripCard>
            ))
          )}
        </CardsContainer>

        <FloatingActionButton onClick={openAddModal}>+</FloatingActionButton>

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