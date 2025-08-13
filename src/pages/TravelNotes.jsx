import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useTrip } from '../contexts/TripContext'

// 動態導入，避免在沒有安裝套件時出錯
let saveAs;
let Document, Packer, Paragraph, TextRun, HeadingLevel;

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
  console.error('動態導入套件失敗:', error);
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`

const TripSelector = styled.div`
  margin-bottom: 1rem;
`

const NoteCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const NoteForm = styled.form`
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
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`

const QuickTextButton = styled.button.attrs({
  type: 'button' // 設置按鈕類型為button，防止在表單中自動提交
})`
  background-color: ${props => props.negative ? '#ffebee' : '#e3f2fd'};
  color: ${props => props.negative ? '#c62828' : '#1565c0'};
  border: 1px solid ${props => props.negative ? '#ffcdd2' : '#bbdefb'};
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  margin: 0.2rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.negative ? '#ffcdd2' : '#bbdefb'};
  }
`

const QuickTextContainer = styled.div`
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const QuickTextSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`

// ImportExportContainer is not used in this file after moving functionality
// const ImportExportContainer = styled.div`
//   display: flex;
//   gap: 0.5rem;
//   margin-top: 1rem;
//   margin-bottom: 1rem;
// `

const TravelNotes = () => {
  const { trips, selectedTripId, setSelectedTripId } = useTrip();
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('travelNotes');
    return savedNotes ? JSON.parse(savedNotes) : {};
  });

  const contentRef = useRef(null);

  const positiveWords = ["好吃", "有特色", "美麗", "親切", "想再來", "難忘", "便利", "高CP"];
  const negativeWords = ["服務差", "不推薦", "難吃", "無聊", "太貴", "太花時間", "不值得"];
  const noteTemplates = ["我到了...", "我看了...", "我吃了...", "我聽了...", "我玩了..."];

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const initialNewNoteData = {
    id: '',
    title: getCurrentDateTime(),
    content: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    weather: '',
    temperature: ''
  };

  const [newNote, setNewNote] = useState(initialNewNoteData);
  const [isEditing, setIsEditing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [weatherStatus, setWeatherStatus] = useState('');
  const [sortNewestFirst, setSortNewestFirst] = useState(true); // 新增排序狀態

  // Debug: Log newNote whenever it changes
  useEffect(() => {
    console.log("newNote state updated:", newNote);
  }, [newNote]);

  useEffect(() => {
    localStorage.setItem('travelNotes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (!isEditing && selectedTripId && navigator.geolocation) {
      setGpsStatus('正在獲取位置...');
      setWeatherStatus(''); // Clear previous weather status
      // Optionally clear previous location/weather from newNote for a fresh start
      // setNewNote(prev => ({ ...prev, location: '', weather: '', temperature: '' }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setNewNote(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          setGpsStatus('位置已獲取');
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('獲取位置失敗:', error);
          setGpsStatus('無法獲取位置');
          setWeatherStatus(''); // Clear weather status on GPS error
        }
      );
    } else if (!selectedTripId) {
      // Clear form if no trip is selected
      setNewNote({...initialNewNoteData, title: getCurrentDateTime()});
      setGpsStatus('');
      setWeatherStatus('');
    } else if (isEditing) {
      // If user starts editing, statuses should reflect the loaded note, not "loading"
      // unless refresh is clicked.
      setGpsStatus('');
      setWeatherStatus('');
    }
  // Make sure initialNewNoteData is stable or memoized if used in deps,
  // but here it's fine as it's used to reset state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, selectedTripId]);

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      setWeatherStatus('正在獲取天氣信息...');
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      const mockWeatherData = {
        main: { temp: Math.floor(Math.random() * 15) + 15 }, // Random temp between 15-29
        weather: [{ description: ['晴天', '多雲', '小雨'][Math.floor(Math.random() * 3)] }] // Random weather
      };

      setNewNote(prev => ({
        ...prev,
        weather: mockWeatherData.weather[0].description,
        temperature: `${mockWeatherData.main.temp}°C`
      }));
      setWeatherStatus('天氣信息已獲取');
    } catch (error) {
      console.error('獲取天氣信息失敗:', error);
      setWeatherStatus('無法獲取天氣信息');
    }
  };

  const refreshLocationAndWeather = () => {
    if (navigator.geolocation) {
      setGpsStatus('正在重新獲取位置...');
      setWeatherStatus('等待位置信息...'); // Indicate that weather will follow
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setNewNote(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          setGpsStatus('位置已更新');
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('重新獲取位置失敗:', error);
          setGpsStatus('無法獲取位置');
          setWeatherStatus(''); // Clear weather status on GPS error
        }
      );
    }
  };

  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
    setIsEditing(false); // Reset editing state when trip changes
    setNewNote({...initialNewNoteData, title: getCurrentDateTime() }); // Reset form for new trip

    if (tripId && !notes[tripId]) {
      setNotes(prev => ({
        ...prev,
        [tripId]: []
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNote(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickTextClick = (text) => {
    if (contentRef.current) {
      const start = contentRef.current.selectionStart;
      const end = contentRef.current.selectionEnd;
      const currentContent = newNote.content || ""; // Ensure currentContent is not null
      const newContentValue = currentContent.substring(0, start) + text + currentContent.substring(end);
      setNewNote(prev => ({ ...prev, content: newContentValue }));
      setTimeout(() => {
        if (contentRef.current) {
            contentRef.current.focus();
            contentRef.current.setSelectionRange(start + text.length, start + text.length);
        }
      }, 0);
    } else {
      setNewNote(prev => ({ ...prev, content: (prev.content || "") + text }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTripId) {
        alert("請先選擇一個行程。");
        return;
    }
    if (!newNote.content.trim()) {
        alert("筆記內容不能為空。");
        return;
    }

    // Debug: Log the note object that is about to be saved
    console.log("Submitting note data:", newNote);

    const tripNotes = notes[selectedTripId] || [];
    let noteToSave = { ...newNote };

    // Ensure all auto-fetched fields are part of the saved object
    // (newNote should already have them if fetched successfully)

    if (isEditing) {
      const updatedNotes = tripNotes.map(note =>
        note.id === noteToSave.id ? noteToSave : note
      );
      setNotes({ ...notes, [selectedTripId]: updatedNotes });
      setIsEditing(false);
    } else {
      noteToSave.id = Date.now().toString();
      setNotes({ ...notes, [selectedTripId]: [...tripNotes, noteToSave] });
    }

    setNewNote({...initialNewNoteData, title: getCurrentDateTime()}); // Reset form, new title
    // GPS and weather will be fetched again by useEffect if !isEditing
  };

  const handleEdit = (note) => {
    setNewNote(note);
    setIsEditing(true);
    // When editing, clear current fetching statuses as they pertain to a new note
    setGpsStatus(note.location ? '位置已載入' : '');
    setWeatherStatus(note.weather ? '天氣已載入' : '');
  };

  const handleDelete = (noteId) => {
    if (!selectedTripId) return;
    if (!window.confirm('確定要刪除這則旅遊筆記嗎？此動作無法復原。')) return;
    const updatedNotes = (notes[selectedTripId] || []).filter(note => note.id !== noteId);
    setNotes({ ...notes, [selectedTripId]: updatedNotes });
  };

  const selectedTripNotes = selectedTripId ? (notes[selectedTripId] || []) : [];
  // 根據排序狀態決定排序方式
  const sortedNotes = [...selectedTripNotes].sort((a, b) => {
    const aDate = new Date(a.date + 'T' + (a.title.split(' ')[1] || '00:00'));
    const bDate = new Date(b.date + 'T' + (b.title.split(' ')[1] || '00:00'));
    return sortNewestFirst ? bDate - aDate : aDate - bDate;
  });


  // Disable submit button if essential data is loading for a NEW note.
  // For existing notes, user can save with old data or refresh.
  const isFetchingInitialData = !isEditing && (gpsStatus.includes('正在') || weatherStatus.includes('正在') || weatherStatus === '等待位置信息...');

  return (
    <Container>
      <h2>旅遊筆記</h2>
      <TripSelector>
        <label htmlFor="trip">選擇行程:</label>
        <select id="trip" value={selectedTripId || ''} onChange={handleTripChange}>
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
          <NoteForm onSubmit={handleSubmit}>
            <h3>{isEditing ? '編輯筆記' : '新增筆記'}</h3>
            <div>
              <label htmlFor="title">標題</label>
              <input type="text" id="title" name="title" value={newNote.title} onChange={handleInputChange} placeholder="輸入標題（選填）" />
            </div>
            <div>
              <label htmlFor="date">日期</label>
              <input type="date" id="date" name="date" value={newNote.date} onChange={handleInputChange} required />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="location">地點 {gpsStatus && <small>({gpsStatus})</small>}</label>
                <input type="text" id="location" name="location" value={newNote.location} onChange={handleInputChange} placeholder="位置資訊" />
              </div>
              <Button type="button" $primary onClick={refreshLocationAndWeather} style={{ marginTop: '20px', padding: '0.3rem 0.6rem', fontSize:'0.9rem' }}>
                重新獲取
              </Button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="weather">天氣 {weatherStatus && <small>({weatherStatus})</small>}</label>
                <input type="text" id="weather" name="weather" value={newNote.weather} onChange={handleInputChange} placeholder="例如：晴天、多雲" />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="temperature">氣溫</label>
                <input type="text" id="temperature" name="temperature" value={newNote.temperature} onChange={handleInputChange} placeholder="例如：25°C" />
              </div>
            </div>
            <div>
              <label htmlFor="content">內容</label>
              <textarea id="content" name="content" value={newNote.content} onChange={handleInputChange} rows="8" required ref={contentRef}></textarea>
            </div>
            <QuickTextContainer>
              <div>
                <label>筆記模板：</label>
                <QuickTextSection style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                  {noteTemplates.map(template => (
                    <QuickTextButton key={template} onClick={() => handleQuickTextClick(template + '\n')} style={{ textAlign: 'left', margin: '2px 0' }}>
                      {template}
                    </QuickTextButton>
                  ))}
                </QuickTextSection>
              </div>
              <div>
                <label>正面評價詞：</label>
                <QuickTextSection>
                  {positiveWords.map(word => (<QuickTextButton key={word} onClick={() => handleQuickTextClick(word)}>{word}</QuickTextButton>))}
                </QuickTextSection>
              </div>
              <div>
                <label>負面評價詞：</label>
                <QuickTextSection>
                  {negativeWords.map(word => (<QuickTextButton key={word} negative onClick={() => handleQuickTextClick(word)}>{word}</QuickTextButton>))}
                </QuickTextSection>
              </div>
            </QuickTextContainer>
            <ButtonGroup>
              <Button $primary type="submit" disabled={isFetchingInitialData}>
                {isEditing ? '更新筆記' : '新增筆記'}
              </Button>
              {isEditing && (
                <Button type="button" onClick={() => {
                  setIsEditing(false);
                  setNewNote({...initialNewNoteData, title: getCurrentDateTime()});
                }}>
                  取消
                </Button>
              )}
            </ButtonGroup>
          </NoteForm>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>我的旅遊筆記</h3>
              <Button
                type="button"
                $primary={false}
                style={{ backgroundColor: '#7f8c8d', color: 'white', fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}
                onClick={() => setSortNewestFirst(s => !s)}
              >
                {sortNewestFirst ? '最舊在前' : '最新在前'}
                <span style={{ marginLeft: 6 }}>
                  {sortNewestFirst ? '↑' : '↓'}
                </span>
              </Button>
            </div>
            {sortedNotes.length === 0 ? (
              <p>尚未添加任何旅遊筆記</p>
            ) : (
              sortedNotes.map(note => (
                <NoteCard key={note.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{note.title}</h4>
                    <span style={{ color: '#777', fontSize: '0.9rem' }}>
                      {new Date(note.date).toLocaleDateString()}
                    </span>
                  </div>
                  {note.location && (
                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.3rem', marginTop: '0.3rem' }}>
                      <strong>地點:</strong> {note.location}
                    </p>
                  )}
                  {(note.weather || note.temperature) && (
                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <strong>天氣:</strong> {note.weather || '未記錄'}
                      {note.temperature && ` (${note.temperature || '未記錄'})`}
                    </p>
                  )}
                  <p style={{ whiteSpace: 'pre-line', marginTop: '0.5rem', marginBottom: '1rem' }}>{note.content}</p>
                  <ButtonGroup>
                    <Button $primary onClick={() => handleEdit(note)}>編輯</Button>
                    <Button onClick={() => handleDelete(note.id)}>刪除</Button>
                  </ButtonGroup>
                </NoteCard>
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

export default TravelNotes;