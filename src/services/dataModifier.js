// 數據修改服務 - 處理實際的數據變更操作

// 數據修改錯誤類
class DataModificationError extends Error {
  constructor(message, changeId = null) {
    super(message);
    this.name = 'DataModificationError';
    this.changeId = changeId;
  }
}

// 數據修改服務類
class DataModifier {
  constructor() {
    this.changeHistory = [];
  }

  // 應用單個變更
  async applyChange(change) {
    try {
      const { category } = change;
      
      switch (category) {
        case 'trip':
          return await this.modifyTripData(change);
        case 'expense':
          return await this.modifyExpenseData(change);
        case 'note':
          return await this.modifyNoteData(change);
        case 'packing':
          return await this.modifyPackingData(change);
        case 'hotel':
          return await this.modifyHotelData(change);
        case 'itinerary':
          return await this.modifyItineraryData(change);
        default:
          throw new DataModificationError(`不支持的數據類型: ${category}`, change.id);
      }
    } catch (error) {
      console.error('Error applying change:', error);
      throw new DataModificationError(
        error.message || '應用變更時發生錯誤',
        change.id
      );
    }
  }

  // 批量應用變更
  async applyChanges(changes) {
    const results = [];
    const errors = [];

    for (const change of changes) {
      try {
        const result = await this.applyChange(change);
        results.push({ changeId: change.id, success: true, result });
        
        // 記錄變更歷史
        this.changeHistory.push({
          ...change,
          appliedAt: new Date(),
          success: true
        });
      } catch (error) {
        errors.push({ changeId: change.id, error: error.message });
        
        // 記錄失敗的變更
        this.changeHistory.push({
          ...change,
          appliedAt: new Date(),
          success: false,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  // 修改行程數據
  async modifyTripData(change) {
    const { type, field, newValue, targetId } = change;
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    switch (type) {
      case 'create': {
        // 建立新行程
        const newTrip = {
          ...newValue,
          id: newValue.id || `trip_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        trips.push(newTrip);
        
        // 設定為當前選中的行程
        localStorage.setItem('lastSelectedTrip', newTrip.id);
        
        localStorage.setItem('trips', JSON.stringify(trips));
        window.dispatchEvent(new Event('storage'));
        
        return newTrip;
      }
        
      case 'edit':
      case 'add':
      case 'delete': {
        let tripIndex = -1;
        if (targetId) {
          tripIndex = trips.findIndex(trip => trip.id === targetId);
        } else {
          // 如果沒有指定ID，使用當前選中的行程
          const selectedTripId = localStorage.getItem('lastSelectedTrip');
          tripIndex = trips.findIndex(trip => trip.id === selectedTripId);
        }

        if (tripIndex === -1) {
          throw new DataModificationError('找不到指定的行程');
        }

        switch (type) {
          case 'edit':
            trips[tripIndex][field] = newValue;
            trips[tripIndex].updatedAt = new Date().toISOString();
            break;
          case 'add':
            if (field === 'flights') {
              trips[tripIndex].flights = trips[tripIndex].flights || [];
              trips[tripIndex].flights.push(newValue);
            } else if (field === 'hotels') {
              trips[tripIndex].hotels = trips[tripIndex].hotels || [];
              trips[tripIndex].hotels.push(newValue);
            } else {
              trips[tripIndex][field] = newValue;
            }
            trips[tripIndex].updatedAt = new Date().toISOString();
            break;
          case 'delete':
            if (field === 'flights' || field === 'hotels') {
              const array = trips[tripIndex][field] || [];
              const itemIndex = array.findIndex(item => item.id === newValue);
              if (itemIndex > -1) {
                array.splice(itemIndex, 1);
              }
            } else {
              delete trips[tripIndex][field];
            }
            trips[tripIndex].updatedAt = new Date().toISOString();
            break;
        }

        localStorage.setItem('trips', JSON.stringify(trips));
        window.dispatchEvent(new Event('storage'));
        
        return trips[tripIndex];
      }
    }
  }

  // 修改費用數據
  async modifyExpenseData(change) {
    const { type, field, newValue, targetId } = change;
    const selectedTripId = localStorage.getItem('lastSelectedTrip');
    const expenses = JSON.parse(localStorage.getItem('expenses') || '{}');
    
    if (!selectedTripId) {
      throw new DataModificationError('沒有選中的行程');
    }

    const tripExpenses = expenses[selectedTripId] || [];

    switch (type) {
      case 'add': {
        tripExpenses.push({
          id: Date.now().toString(),
          ...newValue,
          createdAt: new Date().toISOString()
        });
        break;
      }
      case 'edit': {
        const expenseIndex = tripExpenses.findIndex(exp => exp.id === targetId);
        if (expenseIndex > -1) {
          tripExpenses[expenseIndex][field] = newValue;
        }
        break;
      }
      case 'delete': {
        const deleteIndex = tripExpenses.findIndex(exp => exp.id === targetId);
        if (deleteIndex > -1) {
          tripExpenses.splice(deleteIndex, 1);
        }
        break;
      }
    }

    expenses[selectedTripId] = tripExpenses;
    localStorage.setItem('expenses', JSON.stringify(expenses));
    window.dispatchEvent(new Event('storage'));
    
    return tripExpenses;
  }

  // 修改筆記數據
  async modifyNoteData(change) {
    const { type, field, newValue, targetId } = change;
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');

    switch (type) {
      case 'add': {
        notes.push({
          id: Date.now().toString(),
          ...newValue,
          createdAt: new Date().toISOString()
        });
        break;
      }
      case 'edit': {
        const noteIndex = notes.findIndex(note => note.id === targetId);
        if (noteIndex > -1) {
          notes[noteIndex][field] = newValue;
        }
        break;
      }
      case 'delete': {
        const deleteIndex = notes.findIndex(note => note.id === targetId);
        if (deleteIndex > -1) {
          notes.splice(deleteIndex, 1);
        }
        break;
      }
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    window.dispatchEvent(new Event('storage'));
    
    return notes;
  }

  // 修改打包清單數據
  async modifyPackingData(change) {
    const { type, field, newValue, targetId } = change;
    const selectedTripId = localStorage.getItem('lastSelectedTrip');
    const packingLists = JSON.parse(localStorage.getItem('packingLists') || '{}');
    
    if (!selectedTripId) {
      throw new DataModificationError('沒有選中的行程');
    }

    const tripPackingList = packingLists[selectedTripId] || [];

    switch (type) {
      case 'add': {
        tripPackingList.push({
          id: Date.now().toString(),
          ...newValue,
          createdAt: new Date().toISOString()
        });
        break;
      }
      case 'edit': {
        const itemIndex = tripPackingList.findIndex(item => item.id === targetId);
        if (itemIndex > -1) {
          tripPackingList[itemIndex][field] = newValue;
        }
        break;
      }
      case 'delete': {
        const deleteIndex = tripPackingList.findIndex(item => item.id === targetId);
        if (deleteIndex > -1) {
          tripPackingList.splice(deleteIndex, 1);
        }
        break;
      }
    }

    packingLists[selectedTripId] = tripPackingList;
    localStorage.setItem('packingLists', JSON.stringify(packingLists));
    window.dispatchEvent(new Event('storage'));
    
    return tripPackingList;
  }

  // 修改旅館數據
  async modifyHotelData(change) {
    const { type, field, newValue, targetId } = change;
    const selectedTripId = localStorage.getItem('lastSelectedTrip');
    const hotels = JSON.parse(localStorage.getItem('hotels') || '{}');
    
    if (!selectedTripId) {
      throw new DataModificationError('沒有選中的行程');
    }

    const tripHotels = hotels[selectedTripId] || [];

    switch (type) {
      case 'add': {
        tripHotels.push({
          id: Date.now().toString(),
          ...newValue,
          createdAt: new Date().toISOString()
        });
        break;
      }
      case 'edit': {
        const hotelIndex = tripHotels.findIndex(hotel => hotel.id === targetId);
        if (hotelIndex > -1) {
          tripHotels[hotelIndex][field] = newValue;
        }
        break;
      }
      case 'delete': {
        const deleteIndex = tripHotels.findIndex(hotel => hotel.id === targetId);
        if (deleteIndex > -1) {
          tripHotels.splice(deleteIndex, 1);
        }
        break;
      }
    }

    hotels[selectedTripId] = tripHotels;
    localStorage.setItem('hotels', JSON.stringify(hotels));
    window.dispatchEvent(new Event('storage'));
    
    return tripHotels;
  }

  // 修改行程安排數據
  async modifyItineraryData(change) {
    const { type, field, newValue, targetId } = change;
    const selectedTripId = localStorage.getItem('lastSelectedTrip');
    const itineraries = JSON.parse(localStorage.getItem('itineraries') || '{}');
    
    if (!selectedTripId) {
      throw new DataModificationError('沒有選中的行程');
    }

    const tripItinerary = itineraries[selectedTripId] || [];

    switch (type) {
      case 'add': {
        tripItinerary.push({
          id: Date.now().toString(),
          ...newValue,
          createdAt: new Date().toISOString()
        });
        break;
      }
      case 'edit': {
        const itemIndex = tripItinerary.findIndex(item => item.id === targetId);
        if (itemIndex > -1) {
          tripItinerary[itemIndex][field] = newValue;
        }
        break;
      }
      case 'delete': {
        const deleteIndex = tripItinerary.findIndex(item => item.id === targetId);
        if (deleteIndex > -1) {
          tripItinerary.splice(deleteIndex, 1);
        }
        break;
      }
    }

    itineraries[selectedTripId] = tripItinerary;
    localStorage.setItem('itineraries', JSON.stringify(itineraries));
    window.dispatchEvent(new Event('storage'));
    
    return tripItinerary;
  }

  // 獲取變更歷史
  getChangeHistory() {
    return this.changeHistory;
  }

  // 清除變更歷史
  clearHistory() {
    this.changeHistory = [];
  }
}

// 創建單例實例
const dataModifier = new DataModifier();

// 導出服務實例和錯誤類
export { dataModifier, DataModificationError };
export default dataModifier;