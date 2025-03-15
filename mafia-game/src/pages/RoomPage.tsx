import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Title, 
  Subtitle, 
  Button, 
  Text, 
  Grid, 
  FlexRow, 
  Divider,
  Select
} from '../components/styled';
import PlayerCard from '../components/PlayerCard';
import Chat from '../components/Chat';
import { useUser } from '../contexts/UserContext';
import { useGame } from '../contexts/GameContext';
import { AIDifficulty } from '../types';

const RoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { 
    gameState, 
    leaveRoom, 
    startGame, 
    getCurrentPlayer, 
    sendMessage,
    addAIPlayer,
    removeAIPlayer
  } = useGame();
  
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  
  if (!gameState) {
    navigate('/lobby');
    return null;
  }
  
  const currentPlayer = getCurrentPlayer();
  const isHost = currentPlayer?.isHost || false;
  
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/lobby');
  };
  
  const handleStartGame = () => {
    startGame();
    navigate('/game');
  };
  
  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    alert('방 코드가 클립보드에 복사되었습니다.');
  };
  
  const handleAddAIPlayer = () => {
    addAIPlayer(aiDifficulty);
  };
  
  const handleRemoveAIPlayer = (aiId: string) => {
    removeAIPlayer(aiId);
  };
  
  const aiPlayers = gameState.players.filter(player => player.isAI);
  const humanPlayers = gameState.players.filter(player => !player.isAI);
  
  return (
    <Container>
      <Card>
        <FlexRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Title>게임 대기실</Title>
          <Button variant="danger" onClick={handleLeaveRoom}>
            나가기
          </Button>
        </FlexRow>
        
        <FlexRow style={{ marginBottom: '20px' }}>
          <Text>방 코드: {gameState.roomId}</Text>
          <Button variant="secondary" onClick={copyRoomCode} style={{ marginLeft: '10px' }}>
            코드 복사
          </Button>
        </FlexRow>
        
        <Grid style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Card>
            <Subtitle>참가자 ({gameState.players.length}명)</Subtitle>
            
            {humanPlayers.length > 0 && (
              <>
                <Text style={{ fontWeight: 'bold', marginTop: '10px' }}>사람 플레이어</Text>
                {humanPlayers.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isCurrentPlayer={player.id === user.id}
                  />
                ))}
              </>
            )}
            
            {aiPlayers.length > 0 && (
              <>
                <Text style={{ fontWeight: 'bold', marginTop: '20px' }}>AI 플레이어</Text>
                {aiPlayers.map(player => (
                  <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PlayerCard
                      player={player}
                      isCurrentPlayer={false}
                    />
                    {isHost && (
                      <Button 
                        variant="danger" 
                        onClick={() => handleRemoveAIPlayer(player.id)}
                        style={{ marginLeft: '10px', padding: '5px 10px' }}
                      >
                        제거
                      </Button>
                    )}
                  </div>
                ))}
              </>
            )}
            
            {isHost && (
              <Card style={{ marginTop: '20px', padding: '10px' }}>
                <Text style={{ fontWeight: 'bold' }}>AI 플레이어 추가</Text>
                <Text style={{ fontSize: '0.9em', marginTop: '5px' }}>
                  AI 플레이어는 자동으로 채팅, 투표, 밤 행동을 수행합니다. 난이도에 따라 행동 패턴이 달라집니다.
                </Text>
                <FlexRow style={{ marginTop: '10px', alignItems: 'center' }}>
                  <Text>난이도:</Text>
                  <Select 
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as AIDifficulty)}
                    style={{ marginLeft: '10px', marginRight: '10px' }}
                  >
                    <option value="easy">쉬움</option>
                    <option value="medium">보통</option>
                    <option value="hard">어려움</option>
                  </Select>
                  <Button onClick={handleAddAIPlayer}>
                    AI 추가
                  </Button>
                </FlexRow>
              </Card>
            )}
            
            {isHost && gameState.players.length >= 4 && (
              <Button onClick={handleStartGame} style={{ marginTop: '20px' }}>
                게임 시작
              </Button>
            )}
            
            {isHost && gameState.players.length < 4 && (
              <Text style={{ color: 'red', marginTop: '20px' }}>
                게임을 시작하려면 최소 4명의 플레이어가 필요합니다.
              </Text>
            )}
          </Card>
          
          <Card>
            <Subtitle>채팅</Subtitle>
            <Chat
              messages={gameState.messages}
              onSendMessage={sendMessage}
            />
          </Card>
        </Grid>
        
        <Divider />
        
        <Card>
          <Subtitle>게임 규칙</Subtitle>
          <Text>
            1. 게임은 낮과 밤으로 진행됩니다.
          </Text>
          <Text>
            2. 밤에는 마피아가 한 명을 죽이고, 의사는 한 명을 살릴 수 있으며, 경찰은 한 명의 정체를 확인할 수 있습니다.
          </Text>
          <Text>
            3. 낮에는 모든 참가자가 토론을 통해 마피아로 의심되는 사람을 투표로 처형합니다.
          </Text>
          <Text>
            4. 시민팀은 모든 마피아를 찾아내면 승리하고, 마피아팀은 시민의 수가 마피아와 같거나 적어지면 승리합니다.
          </Text>
          <Text>
            5. AI 플레이어는 난이도에 따라 다른 전략을 사용합니다. 쉬움은 무작위로 행동하고, 보통은 기본적인 전략을 사용하며, 어려움은 고급 전략을 사용합니다.
          </Text>
        </Card>
      </Card>
    </Container>
  );
};

export default RoomPage; 