import { Routes, Route, NavLink } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useState, useEffect } from 'react';
import { useTrip, TripProvider } from './contexts/TripContext';

// 頁面組件
import TripManagement from './pages/TripManagement';
import DailyItinerary from './pages/DailyItinerary';
import HotelInfo from './pages/HotelInfo';
import TravelTips from './pages/TravelTips';
import PackingList from './pages/PackingList';
import TravelNotes from './pages/TravelNotes';
import DataManagement from './pages/DataManagement';
import ExpenseTracker from './pages/ExpenseTracker';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

// --- 新增：全域字體樣式注入器 ---
const GlobalFontStyles = createGlobalStyle`
  :root {
    --font-size-h2: ${props => props.fontSizes.h2}px;
    --font-size-h4: ${props => props.fontSizes.h4}px;
    --font-size-destination: ${props => props.fontSizes.destination}px;
    --font-size-body: ${props => props.fontSizes.body}px;
    --font-size-small: ${props => props.fontSizes.small}px;
    --font-size-label: ${props => props.fontSizes.label}px;
  }
`;

// 這個輔助元件會從 Context 獲取字體設定，並傳遞給 GlobalFontStyles
const FontStyleInjector = () => {
  const { fontSizes } = useTrip();
  return <GlobalFontStyles fontSizes={fontSizes} />;
};

// --- 原有的樣式組件 ---
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1rem;
  background-color: #f5f5f5;
  
  @media (max-width: 768px) {
    padding: 0.8rem 0.5rem;
  }
`;

const Navigation = styled.nav`
  background-color: #34495e;
  padding: 0.5rem;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    padding: 0.3rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`;

const NavItem = styled(NavLink)`
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  
  &.active {
    background-color: #1abc9c;
  }
  
  &:hover {
    background-color: #3498db;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.4rem;
    text-align: center;
    display: block;
  }
  
  @media (max-width: 480px) {
    text-align: center;
    display: block;
  }
`;

const Footer = styled.footer`
  background-color: #2c3e50;
  color: white;
  text-align: center;
  padding: 1rem;
`;

const availablePages = [
  { id: 'tripManagement', name: '行程管理', path: '/', component: TripManagement, default: true },
  { id: 'dailyItinerary', name: '每日行程', path: '/daily', component: DailyItinerary, default: true },
  { id: 'hotelInfo', name: '旅館資訊', path: '/hotel', component: HotelInfo, default: true },
  { id: 'travelTips', name: '旅遊須知', path: '/tips', component: TravelTips, default: true },
  { id: 'packingList', name: '物品清單', path: '/packing', component: PackingList, default: true },
  { id: 'travelNotes', name: '旅遊筆記', path: '/notes', component: TravelNotes, default: true },
  { id: 'expenseTracker', name: '消費追蹤', path: '/expenses', component: ExpenseTracker, default: true },
  { id: 'notes', name: '記事本', path: '/notebook', component: Notes, default: true },
  { id: 'dataManagement', name: '數據管理', path: '/data', component: DataManagement, default: true },
  { id: 'settings', name: '設定', path: '/settings', component: Settings, default: true }
];

function App() {
  const [pageSettings, setPageSettings] = useState(() => {
    const savedSettings = localStorage.getItem('pageSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    } else {
      const defaultSettings = {};
      availablePages.forEach(page => {
        defaultSettings[page.id] = page.default;
      });
      return defaultSettings;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('pageSettings');
      if (savedSettings) {
        setPageSettings(JSON.parse(savedSettings));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <TripProvider>
      <FontStyleInjector /> {/* 在這裡注入全域字體樣式 */}
      <AppContainer>
        <Header>
          <h1>旅遊應用程序</h1>
        </Header>
        
        <Navigation>
          {availablePages.map(page => (
            pageSettings[page.id] && (
              <NavItem key={page.id} to={page.path} end={page.path === '/'}>
                {page.name}
              </NavItem>
            )
          ))}
        </Navigation>
        
        <MainContent>
          <Routes>
            {availablePages.map(page => (
              <Route key={page.id} path={page.path} element={<page.component />} />
            ))}
          </Routes>
        </MainContent>
        
        <Footer>
          <p>&copy; {new Date().getFullYear()} 旅遊應用程序</p>
        </Footer>
      </AppContainer>
    </TripProvider>
  );
}

export default App;
