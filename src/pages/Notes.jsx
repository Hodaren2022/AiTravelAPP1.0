import { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const NoteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
  }
`;

const Button = styled.button`
  background-color: ${props => props.$primary ? '#3498db' : '#ccc'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
`;

const NoteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NoteItem = styled.div`
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
`;

const NoteContent = styled.div`
  white-space: pre-wrap;
  margin-bottom: 0.5rem;
`;

const NoteActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;

const DeleteButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
`;

const CheckboxButton = styled.button`
  background-color: ${props => props.checked ? '#4CAF50' : '#e74c3c'};
  color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  margin-right: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.checked ? '#45a049' : '#d62c1a'};
  }
`;

const InsertCheckboxButton = styled.button`
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
  display: inline-block;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const ButtonDescription = styled.span`
  margin-left: 10px;
  font-size: 0.9rem;
  color: #666;
  display: inline-block;
  vertical-align: middle;
  
  @media (max-width: 480px) {
    margin-left: 0;
    margin-top: 5px;
    display: block;
  }
`;

const Notes = () => {
  // 從localStorage獲取記事
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  
  // 保存記事到localStorage
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);
  
  // 處理記事輸入變更
  const handleNoteChange = (e) => {
    setNewNote(e.target.value);
  };
  
  // 插入待辦按鈕
  const handleInsertCheckbox = () => {
    const checkboxPlaceholder = '[待辦] ';
    setNewNote(prev => prev + checkboxPlaceholder);
  };
  
  // 新增記事
  const handleAddNote = (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) return;
    
    const noteWithCheckboxes = processCheckboxes(newNote);
    
    if (editingNote) {
      // 更新現有記事
      const updatedNotes = notes.map(note => 
        note.id === editingNote.id ? { ...note, content: noteWithCheckboxes } : note
      );
      setNotes(updatedNotes);
      setEditingNote(null);
    } else {
      // 新增記事
      const newNoteObj = {
        id: Date.now().toString(),
        content: noteWithCheckboxes,
        createdAt: new Date().toISOString()
      };
      setNotes([newNoteObj, ...notes]);
    }
    
    setNewNote('');
  };
  
  // 處理記事中的待辦按鈕
  const processCheckboxes = (text) => {
    // 將文本中的 [待辦] 標記轉換為帶有狀態的對象
    return text.replace(/\[待辦\]/g, (match, offset) => {
      const id = Date.now().toString() + offset;
      return `[CHECKBOX:${id}:false]`;
    });
  };
  
  // 切換完成狀態
  const toggleCheckbox = (noteId, checkboxId) => {
    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        const regex = new RegExp(`\\[CHECKBOX:${checkboxId}:(true|false)\\]`, 'g');
        const updatedContent = note.content.replace(regex, (match, state) => {
          const newState = state === 'true' ? 'false' : 'true';
          return `[CHECKBOX:${checkboxId}:${newState}]`;
        });
        return { ...note, content: updatedContent };
      }
      return note;
    });
    
    setNotes(updatedNotes);
  };
  
  // 編輯記事
  const handleEditNote = (note) => {
    // 將記事內容中的複選框標記轉換回 [待辦] 格式以便編輯
    const editableContent = note.content.replace(/\[CHECKBOX:([^:]+):(true|false)\]/g, '[待辦]');
    setNewNote(editableContent);
    setEditingNote(note);
  };
  
  // 刪除記事
  const handleDeleteNote = (noteId) => {
    if (!window.confirm('確定要刪除這則記事嗎？此動作無法復原。')) return;
    setNotes(notes.filter(note => note.id !== noteId));
    
    if (editingNote && editingNote.id === noteId) {
      setEditingNote(null);
      setNewNote('');
    }
  };
  
  // 渲染記事內容，將複選框標記轉換為實際的按鈕
  const renderNoteContent = (note) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\[CHECKBOX:([^:]+):(true|false)\]/g;
    let match;
    
    while ((match = regex.exec(note.content)) !== null) {
      // 添加複選框前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {note.content.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // 添加複選框按鈕
      const [, checkboxId, state] = match;
      parts.push(
        <CheckboxButton
          key={`checkbox-${checkboxId}`}
          checked={state === 'true'}
          onClick={() => toggleCheckbox(note.id, checkboxId)}
        >
          {state === 'true' ? '完成' : '待辦'}
        </CheckboxButton>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    // 添加剩餘的文本
    if (lastIndex < note.content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {note.content.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Container>
      <h2>記事本</h2>
      
      <Card>
        <NoteForm onSubmit={handleAddNote}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InsertCheckboxButton 
              type="button" 
              onClick={handleInsertCheckbox}
            >
              待辦
            </InsertCheckboxButton>
            <ButtonDescription>
              插入待辦按鈕即可在新增筆記後變成待辦清單模式
            </ButtonDescription>
          </div>
          
          <TextArea
            value={newNote}
            onChange={handleNoteChange}
            placeholder="輸入記事內容..."
            required
          />
          
          <ButtonGroup>
            <Button $primary type="submit">
              {editingNote ? '更新記事' : '新增記事'}
            </Button>
            {editingNote && (
              <Button 
                type="button" 
                onClick={() => {
                  setEditingNote(null);
                  setNewNote('');
                }}
              >
                取消編輯
              </Button>
            )}
          </ButtonGroup>
        </NoteForm>
      </Card>
      
      <NoteList>
        {notes.length === 0 ? (
          <p>尚無記事</p>
        ) : (
          notes.map(note => (
            <NoteItem key={note.id}>
              <NoteContent>{renderNoteContent(note)}</NoteContent>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {formatDate(note.createdAt)}
              </div>
              <NoteActions>
                <Button 
                  type="button" 
                  onClick={() => handleEditNote(note)}
                >
                  編輯
                </Button>
                <DeleteButton 
                  type="button" 
                  onClick={() => handleDeleteNote(note.id)}
                >
                  刪除
                </DeleteButton>
              </NoteActions>
            </NoteItem>
          ))
        )}
      </NoteList>
    </Container>
  );
};

export default Notes;