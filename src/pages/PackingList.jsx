import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTrip } from '../contexts/TripContext'

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
`

const TripSelector = styled.div`
  margin-bottom: 1rem;
`

const CategoryCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const ItemForm = styled.form`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`

const ItemButton = styled.button`
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: ${props => props.isPacked ? '#4CAF50' : 'white'};
  color: ${props => props.isPacked ? 'white' : 'black'};
  text-align: left;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.isPacked ? '#45a049' : '#f5f5f5'};
  }
  
  span {
    text-decoration: ${props => props.isPacked ? 'line-through' : 'none'};
  }
`

const AddItemButton = styled.button`
  display: block;
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 4px;
  border: 1px dashed #3498db;
  background-color: white;
  color: #3498db;
  cursor: pointer;
  
  &:hover {
    background-color: #f0f8ff;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    flex-wrap: wrap;
    width: 100%;
  }
`

const Button = styled.button`
  background-color: ${props => props.$primary ? '#3498db' : '#e74c3c'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
`

const ItemCategories = [
  '衣物',
  '鞋子與配件',
  '盥洗用品',
  '電子產品',
  '藥品與急救',
  '證件與文件',
  '其他'
];

// 預設物品清單
const DefaultItems = {
  '護照、簽證與證件': ['護照', '簽證', '國際信用卡', '駕照', '身分證/記憶卡', '旅行支票', '計算機', '現金一日用', '名片'],
  '衣物與鞋子': ['帽子', '隱形眼鏡', '太陽眼鏡', '內衣', '襪子', '輕便拖鞋', '涼鞋', '睡衣', '防寒衣物', '正式服裝'],
  '盥洗與美容用品': ['牙刷', '牙膏', '洗髮精', '沐浴乳', '毛巾', '刮鬍刀', '化妝品', '防曬霜', '髮膠', '保養品'],
  '電子產品': ['相機/數位相機', '充電器', '筆記型電腦', '筆電電源', '行動電源', '變壓器', '耳機', '手機', '平板'],
  '藥品與健康': ['個人藥物', '口罩', '防蚊液', 'OK繃', '常備藥品'],
  '旅行配件': ['行李箱', '背包', '旅遊指南', '地圖', '雨具', '望遠鏡', '筆記本', '筆', '指南針', '防曬傘'],
  '其他必需品': ['零錢包', '鑰匙包', '針線包', '塑膠袋', '日記簿', '濕紙巾']
};

const DefaultItemButton = styled.button`
  background-color: ${props => props.selected ? '#4CAF50' : 'white'};
  color: ${props => props.selected ? 'white' : 'black'};
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  margin: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.selected ? '#45a049' : '#f5f5f5'};
  }
`;

const DefaultItemsContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const DefaultItemsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  
  @media (max-width: 480px) {
    gap: 5px;
  }
`;

const PackingList = () => {
  const { trips, selectedTripId, setSelectedTripId } = useTrip();
  const [packingLists, setPackingLists] = useState(() => {
    const savedLists = localStorage.getItem('packingLists');
    return savedLists ? JSON.parse(savedLists) : {};
  });
  
  const [newItem, setNewItem] = useState({
    id: '',
    category: '',
    name: '',
    quantity: 1,
    isPacked: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedDefaultCategory, setSelectedDefaultCategory] = useState('護照、簽證與證件');
  
  useEffect(() => {
    localStorage.setItem('packingLists', JSON.stringify(packingLists));
  }, [packingLists]);
  
  const handleTripChange = (e) => {
    const tripId = e.target.value;
    setSelectedTripId(tripId);
    
    // 確保選定行程的物品清單存在
    if (tripId && !packingLists[tripId]) {
      setPackingLists(prev => ({
        ...prev,
        [tripId]: []
      }));
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTripId) return;
    
    const tripItems = packingLists[selectedTripId] || [];
    
    if (isEditing) {
      const updatedItems = tripItems.map(item => 
        item.id === newItem.id ? newItem : item
      );
      
      setPackingLists({
        ...packingLists,
        [selectedTripId]: updatedItems
      });
      
      setIsEditing(false);
    } else {
      const id = Date.now().toString();
      
      setPackingLists({
        ...packingLists,
        [selectedTripId]: [...tripItems, { ...newItem, id }]
      });
    }
    
    setNewItem({
      id: '',
      category: '',
      name: '',
      quantity: 1,
      isPacked: false
    });
  };
  
  const handleEdit = (item) => {
    setNewItem(item);
    setIsEditing(true);
  };
  
  const handleDelete = (itemId) => {
    const tripItems = packingLists[selectedTripId] || [];
    
    const updatedItems = tripItems.filter(item => item.id !== itemId);
    
    setPackingLists({
      ...packingLists,
      [selectedTripId]: updatedItems
    });
  };
  
  const togglePacked = (itemId) => {
    const tripItems = packingLists[selectedTripId] || [];
    
    const updatedItems = tripItems.map(item => {
      if (item.id === itemId) {
        return { ...item, isPacked: !item.isPacked };
      }
      return item;
    });
    
    setPackingLists({
      ...packingLists,
      [selectedTripId]: updatedItems
    });
  };
  
  // 獲取選定行程的物品清單
  const selectedTripItems = selectedTripId ? (packingLists[selectedTripId] || []) : [];
  
  // 根據分類過濾物品
  const filteredItems = filterCategory
    ? selectedTripItems.filter(item => item.category === filterCategory)
    : selectedTripItems;
  
  // 按分類分組物品
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
  
  // 計算已打包物品的百分比
  const packedPercentage = selectedTripItems.length > 0
    ? Math.round((selectedTripItems.filter(item => item.isPacked).length / selectedTripItems.length) * 100)
    : 0;
  
  // 添加預設物品到清單中
  const addDefaultItem = (itemName) => {
    if (!selectedTripId) return;
    
    const tripItems = packingLists[selectedTripId] || [];
    
    // 檢查物品是否已存在
    const itemExists = tripItems.some(item => 
      item.name.toLowerCase() === itemName.toLowerCase() && 
      item.category === getItemCategory(itemName)
    );
    
    if (!itemExists) {
      const id = Date.now().toString();
      const category = getItemCategory(itemName);
      
      setPackingLists({
        ...packingLists,
        [selectedTripId]: [...tripItems, { 
          id, 
          name: itemName, 
          category, 
          quantity: 1, 
          isPacked: false 
        }]
      });
    }
  };
  
  // 根據物品名稱判斷其分類
  const getItemCategory = (itemName) => {
    for (const [category, items] of Object.entries(DefaultItems)) {
      if (items.includes(itemName)) {
        // 將預設分類映射到應用程式的分類
        if (category === '護照、簽證與證件') return '證件與文件';
        if (category === '衣物與鞋子') return '衣物';
        if (category === '盥洗與美容用品') return '盥洗用品';
        if (category === '電子產品') return '電子產品';
        if (category === '藥品與健康') return '藥品與急救';
        if (category === '旅行配件') return '其他';
        if (category === '其他必需品') return '其他';
      }
    }
    return '其他';
  };
  
  // 檢查物品是否已在清單中
  const isItemInList = (itemName) => {
    if (!selectedTripId) return false;
    
    const tripItems = packingLists[selectedTripId] || [];
    return tripItems.some(item => item.name.toLowerCase() === itemName.toLowerCase());
  };
  
  return (
    <Container>
      <h2>物品清單</h2>
      
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
          <DefaultItemsContainer>
            <h3>常用物品清單</h3>
            <div>
              <label htmlFor="defaultCategory" style={{ marginRight: '0.5rem' }}>選擇分類:</label>
              <select
                id="defaultCategory"
                value={selectedDefaultCategory}
                onChange={(e) => setSelectedDefaultCategory(e.target.value)}
              >
                {Object.keys(DefaultItems).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <DefaultItemsGrid>
              {DefaultItems[selectedDefaultCategory].map(item => (
                <DefaultItemButton
                  key={item}
                  selected={isItemInList(item)}
                  onClick={() => addDefaultItem(item)}
                >
                  {item}
                </DefaultItemButton>
              ))}
            </DefaultItemsGrid>
          </DefaultItemsContainer>
          
          <ItemForm onSubmit={handleSubmit}>
            <h3>{isEditing ? '編輯物品' : '新增物品'}</h3>
            
            <div>
              <label htmlFor="category">分類</label>
              <select
                id="category"
                name="category"
                value={newItem.category}
                onChange={handleInputChange}
                required
              >
                <option value="">-- 選擇分類 --</option>
                {ItemCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="name">物品名稱</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newItem.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="quantity">數量</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                value={newItem.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <Button 
                type="button"
                style={{
                  backgroundColor: newItem.isPacked ? '#4CAF50' : '#f0f0f0',
                  color: newItem.isPacked ? 'white' : 'black',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center'
                }}
                onClick={() => setNewItem(prev => ({ ...prev, isPacked: !prev.isPacked }))}
              >
                {newItem.isPacked ? '✓ 已打包' : '標記為已打包'}
              </Button>
            </div>
            
            <ButtonGroup>
              <Button $primary type="submit">
                {isEditing ? '更新物品' : '新增物品'}
              </Button>
              {isEditing && (
                <Button type="button" onClick={() => {
                  setIsEditing(false);
                  setNewItem({
                    id: '',
                    category: '',
                    name: '',
                    quantity: 1,
                    isPacked: false
                  });
                }}>
                  取消
                </Button>
              )}
            </ButtonGroup>
          </ItemForm>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>打包進度: {packedPercentage}%</h3>
              
              <div>
                <label htmlFor="filterCategory" style={{ marginRight: '0.5rem' }}>按分類過濾:</label>
                <select
                  id="filterCategory"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">所有分類</option>
                  {ItemCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {Object.keys(groupedItems).length === 0 ? (
              <p>{filterCategory ? `沒有${filterCategory}分類的物品` : '尚未添加任何物品'}</p>
            ) : (
              Object.entries(groupedItems).map(([category, items]) => (
                <CategoryCard key={category}>
                  <h4>{category}</h4>
                  {items.map(item => (
                    <ItemRow key={item.id}>
                      <ItemButton 
                        isPacked={item.isPacked}
                        onClick={() => togglePacked(item.id)}
                      >
                        <span>
                          {item.name} {item.quantity > 1 ? `(${item.quantity})` : ''}
                        </span>
                      </ItemButton>
                      <ButtonGroup>
                        <Button $primary onClick={() => handleEdit(item)}>編輯</Button>
                        <Button onClick={() => handleDelete(item.id)}>刪除</Button>
                      </ButtonGroup>
                    </ItemRow>
                  ))}
                  <AddItemButton 
                    onClick={() => {
                      setNewItem({
                        id: '',
                        category: category,
                        name: '',
                        quantity: 1,
                        isPacked: false
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    + 新增{category}物品
                  </AddItemButton>
                </CategoryCard>
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

export default PackingList;