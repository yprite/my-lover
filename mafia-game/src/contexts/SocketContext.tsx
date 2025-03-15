import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

// Socket 타입 정의
interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 소켓 연결
    const newSocket = io('http://localhost:4000');  // 서버 주소로 변경 필요

    newSocket.on('connect', () => {
      console.log('서버에 연결됨');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('서버와 연결 끊김');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('연결 오류:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 