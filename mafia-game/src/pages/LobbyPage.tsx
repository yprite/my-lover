import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Title, 
  Subtitle, 
  Button, 
  Input, 
  Text, 
  Grid, 
  Badge, 
  FlexRow 
} from '../components/styled';
import { useUser } from '../contexts/UserContext';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import { socketApi } from '../services/socketApi';
import { RoomInfo } from '../types';

const LobbyPage: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const { user } = useUser();
  const { createRoom, joinRoom } = useGame();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  
  // 방 목록 가져오기
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const roomList = await socketApi.getRooms(socket);
        setRooms(roomList);
      } catch (error) {
        console.error('방 목록 가져오기 오류:', error);
        setError('방 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRooms();
    
    // 방 목록 업데이트 이벤트 리스너
    socket.on('rooms_update', (data: { rooms: RoomInfo[] }) => {
      setRooms(data.rooms);
    });
    
    return () => {
      socket.off('rooms_update');
    };
  }, [socket, isConnected]);
  
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('방 이름을 입력해주세요.');
      return;
    }
    
    if (!isConnected) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await createRoom(roomName);
      navigate('/room');
    } catch (error) {
      console.error('방 생성 오류:', error);
      setError('방 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinRoom = async (roomId: string) => {
    if (!isConnected) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await joinRoom(roomId);
      navigate('/room');
    } catch (error) {
      console.error('방 참가 오류:', error);
      setError('방 참가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinByCode = async () => {
    if (!roomId.trim()) {
      setError('방 코드를 입력해주세요.');
      return;
    }
    
    if (!isConnected) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await joinRoom(roomId);
      navigate('/room');
    } catch (error) {
      console.error('방 참가 오류:', error);
      setError('존재하지 않는 방 코드이거나 참가할 수 없는 방입니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <Card>
        <Title>마피아 게임 로비</Title>
        <Text>안녕하세요, {user.name}님! 게임방을 생성하거나 참여하세요.</Text>
        
        <Card>
          <Subtitle>새 게임방 만들기</Subtitle>
          <Input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="방 이름"
            maxLength={20}
            disabled={isLoading || !isConnected}
          />
          <Button 
            onClick={handleCreateRoom}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? '처리 중...' : '방 만들기'}
          </Button>
        </Card>
        
        <Card>
          <Subtitle>코드로 참여하기</Subtitle>
          <Input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="방 코드"
            disabled={isLoading || !isConnected}
          />
          <Button 
            onClick={handleJoinByCode}
            disabled={isLoading || !isConnected}
          >
            {isLoading ? '처리 중...' : '참여하기'}
          </Button>
        </Card>
        
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        {!isConnected && <Text style={{ color: 'orange' }}>서버에 연결 중입니다...</Text>}
        
        <Subtitle>현재 열린 게임방</Subtitle>
        {isLoading && <Text>방 목록을 불러오는 중...</Text>}
        
        {rooms.length === 0 && !isLoading ? (
          <Text>현재 열린 게임방이 없습니다. 새로운 방을 만들어보세요!</Text>
        ) : (
          <Grid>
            {rooms.map(room => (
              <Card key={room.id}>
                <Subtitle>{room.name}</Subtitle>
                <FlexRow style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                  <Text>플레이어: {room.playerCount}/{room.maxPlayers}</Text>
                  <Badge variant={room.status === 'waiting' ? 'success' : 'warning'}>
                    {room.status === 'waiting' ? '대기중' : '게임중'}
                  </Badge>
                </FlexRow>
                <Button 
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={isLoading || !isConnected || room.status === 'playing' || room.playerCount >= room.maxPlayers}
                >
                  {isLoading ? '처리 중...' : '참여하기'}
                </Button>
              </Card>
            ))}
          </Grid>
        )}
      </Card>
    </Container>
  );
};

export default LobbyPage; 