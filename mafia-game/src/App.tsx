import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { GameProvider } from './contexts/GameContext';
import { SocketProvider } from './contexts/SocketContext';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';
import './App.css';

// 인증 상태에 따라 리다이렉트하는 컴포넌트
const PrivateRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  // 실제 구현에서는 인증 상태를 확인합니다.
  // 여기서는 간단히 로컬 스토리지에 사용자 정보가 있는지 확인합니다.
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  return isAuthenticated ? (
    <>{element}</>
  ) : (
    <Navigate to="/" replace />
  );
};

function App() {
  return (
    <SocketProvider>
      <UserProvider>
        <GameProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/lobby" element={<LobbyPage />} />
                <Route path="/room" element={<RoomPage />} />
                <Route path="/game" element={<GamePage />} />
              </Routes>
            </div>
          </Router>
        </GameProvider>
      </UserProvider>
    </SocketProvider>
  );
}

export default App;
