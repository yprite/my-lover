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
    console.error('GamePage: gameState가 없습니다.');
    navigate('/lobby');
    return null;
  }
  
  console.log('GamePage: 게임 상태', gameState);
  
  const currentPlayer = getCurrentPlayer();
  console.log('GamePage: 현재 플레이어', currentPlayer);
  
  if (!currentPlayer) {
    console.error('GamePage: currentPlayer가 없습니다. 유저 ID:', user.id);
    console.log('GamePage: 모든 플레이어', gameState.players);
    
    // 플레이어를 찾을 수 없는 경우 직접 찾아보기
    const playerInRoom = gameState.players.find(p => p.id === user.id);
    console.log('GamePage: 직접 찾은 플레이어', playerInRoom);
    
    if (playerInRoom) {
      // 플레이어를 찾았으면 계속 진행
      console.log('GamePage: 플레이어를 직접 찾았습니다.');
    } else {
      // 플레이어를 찾지 못했으면 로비로 이동
      navigate('/lobby');
      return null;
    }
  }
  
  // 이 시점에서 currentPlayer가 없을 수 있으므로 playerInRoom을 사용
  const player = currentPlayer || gameState.players.find(p => p.id === user.id);
  
  if (!player) {
    console.error('GamePage: 플레이어를 찾을 수 없습니다.');
    navigate('/lobby');
    return null;
  }
  
  const isNight = gameState.phase === 'night';
  const isDayDiscussion = gameState.phase === 'day-discussion';
  const isDayVoting = gameState.phase === 'day-voting';
  const isGameOver = gameState.phase === 'game-over';
  
  const canChat = !isNight || (isNight && player.role === 'mafia');
  
  const handlePlayerSelect = (playerId: string) => {
    if (canPerformAction() && playerId !== user.id) {
      setSelectedPlayerId(playerId);
    }
  };
  
  const handleAction = () => {
    if (!selectedPlayerId || !canPerformAction()) return;
    
    if (isNight) {
      // 밤 행동
      if (player.role === 'mafia') {
        performNightAction('kill', selectedPlayerId);
      } else if (player.role === 'doctor') {
        performNightAction('save', selectedPlayerId);
      } else if (player.role === 'police') {
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
      if (player.role === 'mafia') return '죽이기';
      if (player.role === 'doctor') return '살리기';
      if (player.role === 'police') return '조사하기';
    }
    if (isDayVoting) return '투표하기';
    return '행동하기';
  };
  
  const getPhaseDescription = (): string => {
    if (isNight) {
      if (gameState.nightPhase === 'doctor') {
        return '밤이 되었습니다. 의사가 시민을 살리고 있습니다.';
      } else if (gameState.nightPhase === 'police') {
        return '경찰이 시민을 조사하고 있습니다.';
      } else if (gameState.nightPhase === 'mafia') {
        return '마피아가 선량한 시민을 죽이려 하고 있습니다.';
      }
      
      if (player.role === 'mafia') return '죽일 사람을 선택하세요.';
      if (player.role === 'doctor') return '살릴 사람을 선택하세요.';
      if (player.role === 'police') return '조사할 사람을 선택하세요.';
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
    if (player.role === 'police' && gameState.nightActions.policeCheck.targetId) {
      const targetId = gameState.nightActions.policeCheck.targetId;
      const targetPlayer = getPlayerById(targetId);
      const isMafia = gameState.nightActions.policeCheck.result;
      
      if (targetPlayer) {
        return `${targetPlayer.name}님은 ${isMafia ? '마피아입니다!' : '마피아가 아닙니다.'}`;
      }
    }
    return '';
  };

  // 플레이어 카드에 마피아 표시 여부 결정
  const shouldShowMafiaIndicator = (playerId: string): boolean => {
    // 자신이 마피아인 경우 다른 마피아를 표시
    if (player.role === 'mafia') {
      const targetPlayer = getPlayerById(playerId);
      return targetPlayer?.role === 'mafia' || false;
    }
    
    // 자신이 경찰이고 해당 플레이어를 조사한 경우에만 마피아 여부 표시
    if (player.role === 'police' && 
        gameState.nightActions.policeCheck.targetId === playerId && 
        gameState.nightActions.policeCheck.result === true) {
      return true;
    }
    
    return false;
  };

  // AI 플레이어 수 계산
  const aiPlayers = gameState.players.filter(p => p.isAI);
  const aiPlayersCount = aiPlayers.length;
  
  // 현재 플레이어가 행동할 수 있는지 확인
  const canPlayerActNow = (): boolean => {
    // 게임 종료 시 행동 불가
    if (isGameOver) return false;
    
    // 플레이어가 죽었으면 행동 불가
    if (!player.isAlive) return false;
    
    // 투표 단계에서는 모든 살아있는 플레이어가 투표 가능
    if (isDayVoting) return true;
    
    // 밤 단계에서는 현재 밤 단계에 맞는 역할만 행동 가능
    if (isNight) {
      if (gameState.nightPhase === 'doctor' && player.role === 'doctor') return true;
      if (gameState.nightPhase === 'police' && player.role === 'police') return true;
      if (gameState.nightPhase === 'mafia' && player.role === 'mafia') return true;
      return false;
    }
    
    return false;
  };
  
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
        
        {player.role === 'police' && getPoliceCheckResult() && (
          <Text style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold', marginBottom: '20px' }}>
            {getPoliceCheckResult()}
          </Text>
        )}
        
        <Grid style={{ gridTemplateColumns: '1fr 2fr' }}>
          <Card>
            <Subtitle>내 정보</Subtitle>
            <RoleCard 
              role={player.role} 
              description={getRoleDescription(player.role)} 
            />
            
            {canPlayerActNow() && (
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
            <Subtitle>플레이어 목록</Subtitle>
            <Grid style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {gameState.players.map(p => (
                <PlayerCard 
                  key={p.id}
                  player={p}
                  isSelected={p.id === selectedPlayerId}
                  onClick={() => handlePlayerSelect(p.id)}
                  isCurrentPlayer={p.id === player.id}
                  isMafia={shouldShowMafiaIndicator(p.id)}
                  isSelectable={canPerformAction() && p.id !== player.id && p.isAlive}
                  showRole={isGameOver || p.id === player.id}
                />
              ))}
            </Grid>
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