import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserState } from '../types';
import { useSocket } from './SocketContext';
import { socketApi } from '../services/socketApi';

interface UserContextType {
  user: UserState;
  setUser: (user: UserState) => void;
  updateUserName: (name: string) => void;
  updateCurrentRoom: (roomId: string | null) => void;
  isAuthenticated: boolean;
  login: (username: string) => Promise<boolean>;
}

const initialUserState: UserState = {
  id: '',
  name: '',
  currentRoom: null,
  isLoggedIn: false
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(() => {
    // 로컬 스토리지에서 사용자 정보 불러오기
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : initialUserState;
  });
  
  // socket 관련 상태를 try-catch로 안전하게 가져옵니다
  let socket: any | null = null;
  let isConnected: boolean = false;
  try {
    const socketContext = useSocket();
    socket = socketContext.socket;
    isConnected = socketContext.isConnected;
  } catch (error) {
    console.error('소켓 컨텍스트를 가져오는 중 오류 발생:', error);
  }

  // 사용자 정보가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const updateUserName = (name: string) => {
    setUser(prevUser => ({
      ...prevUser,
      name,
    }));
  };

  const updateCurrentRoom = (roomId: string | null) => {
    setUser(prevUser => ({
      ...prevUser,
      currentRoom: roomId,
    }));
  };

  const login = async (username: string): Promise<boolean> => {
    if (!socket || !isConnected) return false;
    
    try {
      const response = await socketApi.login(socket, username);
      console.log('로그인 성공:', response);
      setUser({
        id: response.userId,
        name: response.username,
        currentRoom: null,
        isLoggedIn: true
      });
      return true;
    } catch (error) {
      console.error('로그인 오류:', error);
      return false;
    }
  };

  const isAuthenticated = !!user.id;

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUserName,
        updateCurrentRoom,
        isAuthenticated,
        login,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 