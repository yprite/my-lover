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
  Badge
} from '../components/styled';
import PlayerCard from '../components/PlayerCard';
import RoleCard from '../components/RoleCard';
import GameTimer from '../components/GameTimer';
import Chat from '../components/Chat';
import { useUser } from '../contexts/UserContext';
import { useGame } from '../contexts/GameContext';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { 
    gameState, 
    getCurrentPlayer, 
    getPlayerById, 
    isPlayerAlive, 
    getRoleDescription, 
    canPerformAction, 
    performNightAction, 
    vote, 
    sendMessage 
  } = useGame();
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  if (!gameState) {
    navigate('/lobby');
    return null;
  }
  
  const currentPlayer = getCurrentPlayer();
  
  if (!currentPlayer) {
    navigate('/lobby');
    return null;
  }
  
  const isNight = gameState.phase === 'night';
  const isDayDiscussion = gameState.phase === 'day-discussion';
  const isDayVoting = gameState.phase === 'day-voting';
  const isGameOver = gameState.phase === 'game-over';
  
  const canChat = !isNight || (isNight && currentPlayer.role === 'mafia');
  
  const handlePlayerSelect = (playerId: string) => {
    if (canPerformAction() && playerId !== user.id) {
      setSelectedPlayerId(playerId);
    }
  };
  
  const handleAction = () => {
    if (!selectedPlayerId || !canPerformAction()) return;
    
    if (isNight) {
      // 밤 행동
      if (currentPlayer.role === 'mafia') {
        performNightAction('kill', selectedPlayerId);
      } else if (currentPlayer.role === 'doctor') {
        performNightAction('save', selectedPlayerId);
      } else if (currentPlayer.role === 'police') {
        performNightAction('check', selectedPlayerId);
      }
    } else if (isDayVoting) {
      // 투표
      vote(selectedPlayerId);
    }
    
    setSelectedPlayerId(null);
  };
  
  const getActionButtonText = (): string => {
    if (isNight) {
      if (currentPlayer.role === 'mafia') return '죽이기';
      if (currentPlayer.role === 'doctor') return '살리기';
      if (currentPlayer.role === 'police') return '조사하기';
    }
    if (isDayVoting) return '투표하기';
    return '행동하기';
  };
  
  const getPhaseDescription = (): string => {
    if (isNight) {
      if (currentPlayer.role === 'mafia') return '죽일 사람을 선택하세요.';
      if (currentPlayer.role === 'doctor') return '살릴 사람을 선택하세요.';
      if (currentPlayer.role === 'police') return '조사할 사람을 선택하세요.';
      return '밤이 되었습니다. 마피아, 의사, 경찰이 행동할 시간입니다.';
    }
    if (isDayDiscussion) return '낮이 되었습니다. 마피아를 찾기 위해 토론하세요.';
    if (isDayVoting) return '투표 시간입니다. 처형할 사람을 선택하세요.';
    if (isGameOver) {
      if (gameState.winner === 'citizens') return '시민팀이 승리했습니다!';
      if (gameState.winner === 'mafia') return '마피아팀이 승리했습니다!';
    }
    return '';
  };
  
  const getPoliceCheckResult = (): string => {
    if (currentPlayer.role === 'police' && gameState.nightActions.policeCheck.targetId) {
      const targetId = gameState.nightActions.policeCheck.targetId;
      const targetPlayer = getPlayerById(targetId);
      const isMafia = gameState.nightActions.policeCheck.result;
      
      return `${targetPlayer?.name}님은 ${isMafia ? '마피아' : '마피아가 아닙니다'}.`;
    }
    return '';
  };

  // AI 플레이어 수 계산
  const aiPlayers = gameState.players.filter(p => p.isAI);
  const aiPlayersCount = aiPlayers.length;
  
  return (
    <Container>
      <Card>
        <Title>마피아 게임</Title>
        <GameTimer seconds={gameState.timer} phase={gameState.phase} />
        
        <Text style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px' }}>
          {getPhaseDescription()}
        </Text>
        
        {aiPlayersCount > 0 && (
          <Text style={{ textAlign: 'center', marginBottom: '10px' }}>
            <Badge variant="secondary">AI 플레이어 {aiPlayersCount}명 참여 중</Badge>
          </Text>
        )}
        
        {currentPlayer.role === 'police' && getPoliceCheckResult() && (
          <Text style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold', marginBottom: '20px' }}>
            {getPoliceCheckResult()}
          </Text>
        )}
        
        <Grid style={{ gridTemplateColumns: '1fr 2fr' }}>
          <Card>
            <Subtitle>내 정보</Subtitle>
            <RoleCard 
              role={currentPlayer.role} 
              description={getRoleDescription(currentPlayer.role)} 
            />
            
            {canPerformAction() && (
              <>
                <Text style={{ marginTop: '20px' }}>
                  {isNight ? '행동할 대상을 선택하세요:' : '투표할 대상을 선택하세요:'}
                </Text>
                <Button 
                  onClick={handleAction} 
                  disabled={!selectedPlayerId}
                  style={{ marginTop: '10px' }}
                >
                  {getActionButtonText()}
                </Button>
              </>
            )}
            
            {isGameOver && (
              <Button 
                onClick={() => navigate('/lobby')} 
                style={{ marginTop: '20px' }}
              >
                로비로 돌아가기
              </Button>
            )}
          </Card>
          
          <Card>
            <Subtitle>플레이어 ({gameState.players.filter(p => p.isAlive).length}명 생존)</Subtitle>
            
            {/* 인간 플레이어 섹션 */}
            {gameState.players.filter(p => !p.isAI).length > 0 && (
              <>
                <Text style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '10px' }}>사람 플레이어</Text>
                <Grid>
                  {gameState.players.filter(p => !p.isAI).map(player => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isCurrentPlayer={player.id === user.id}
                      showRole={
                        isGameOver || 
                        player.id === user.id || 
                        (currentPlayer.role === 'mafia' && player.role === 'mafia')
                      }
                      isSelectable={
                        canPerformAction() && 
                        player.id !== user.id && 
                        player.isAlive
                      }
                      isSelected={selectedPlayerId === player.id}
                      onClick={() => handlePlayerSelect(player.id)}
                    />
                  ))}
                </Grid>
              </>
            )}
            
            {/* AI 플레이어 섹션 */}
            {aiPlayersCount > 0 && (
              <>
                <Text style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>AI 플레이어</Text>
                <Grid>
                  {gameState.players.filter(p => p.isAI).map(player => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isCurrentPlayer={false}
                      showRole={
                        isGameOver || 
                        (currentPlayer.role === 'mafia' && player.role === 'mafia')
                      }
                      isSelectable={
                        canPerformAction() && 
                        player.isAlive
                      }
                      isSelected={selectedPlayerId === player.id}
                      onClick={() => handlePlayerSelect(player.id)}
                    />
                  ))}
                </Grid>
              </>
            )}
          </Card>
        </Grid>
        
        <Divider />
        
        <Card>
          <Subtitle>채팅</Subtitle>
          <Chat
            messages={gameState.messages}
            onSendMessage={sendMessage}
            disabled={!canChat}
          />
          {!canChat && (
            <Text style={{ color: '#e74c3c', textAlign: 'center' }}>
              밤에는 채팅을 사용할 수 없습니다. (마피아 제외)
            </Text>
          )}
        </Card>
      </Card>
    </Container>
  );
};

export default GamePage; 