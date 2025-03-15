import React, { useState, useEffect } from 'react';
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
import { GameState } from '../types';

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
  const [voteResults, setVoteResults] = useState<Record<string, number>>({});
  const [executedPlayerId, setExecutedPlayerId] = useState<string | null>(null);
  
  // 소켓 이벤트 리스너 추가 - 컴포넌트 최상위 레벨에 위치
  useEffect(() => {
    if (!gameState) return;
    
    // 투표 결과 이벤트 리스너
    const handleVoteResult = (data: { gameState: GameState, voteCounts: Record<string, number>, executedPlayerId: string | null }) => {
      setVoteResults(data.voteCounts);
      setExecutedPlayerId(data.executedPlayerId);
    };
    
    // 소켓 이벤트 리스너 등록
    const socket = (window as any).socket;
    if (socket) {
      socket.on('vote_result', handleVoteResult);
      
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        socket.off('vote_result', handleVoteResult);
      };
    }
  }, [gameState]);
  
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
  const isVoteResult = gameState.phase === 'vote-result';
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
        performNightAction('check', selectedPlayerId)
          .then((result) => {
            if (result && result.success && result.result !== undefined) {
              // 경찰 조사 결과를 로컬 스토리지에 저장
              const policeResults = JSON.parse(localStorage.getItem('policeResults') || '{}');
              policeResults[selectedPlayerId] = result.result;
              localStorage.setItem('policeResults', JSON.stringify(policeResults));
              
              // 결과 즉시 표시
              const targetPlayer = getPlayerById(selectedPlayerId);
              if (targetPlayer) {
                alert(`${targetPlayer.name}님은 ${result.result ? '마피아입니다!' : '마피아가 아닙니다.'}`);
              }
            }
          });
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
        const doctorPlayers = gameState.players.filter(p => p.isAlive && p.role === 'doctor');
        const doctorActed = gameState.nightActions.doctorSave !== null;
        
        if (doctorPlayers.length === 0) {
          return '밤이 되었습니다. 의사가 없어 다음 단계로 넘어갑니다.';
        } else if (!doctorActed) {
          return '밤이 되었습니다. 의사가 시민을 살리고 있습니다. 의사는 행동을 완료해주세요.';
        } else {
          return '밤이 되었습니다. 의사가 시민을 살렸습니다.';
        }
      } else if (gameState.nightPhase === 'police') {
        const policePlayers = gameState.players.filter(p => p.isAlive && p.role === 'police');
        const policeActed = gameState.nightActions.policeCheck.targetId !== null;
        
        if (policePlayers.length === 0) {
          return '경찰이 없어 다음 단계로 넘어갑니다.';
        } else if (!policeActed) {
          return '경찰이 시민을 조사하고 있습니다. 경찰은 행동을 완료해주세요.';
        } else {
          return '경찰이 시민을 조사했습니다.';
        }
      } else if (gameState.nightPhase === 'mafia') {
        const mafiaPlayers = gameState.players.filter(p => p.isAlive && p.role === 'mafia');
        const mafiaActed = gameState.nightActions.mafiaKill !== null;
        
        if (mafiaPlayers.length === 0) {
          return '마피아가 없어 다음 단계로 넘어갑니다.';
        } else if (!mafiaActed) {
          return '마피아가 선량한 시민을 죽이려 하고 있습니다. 마피아는 행동을 완료해주세요.';
        } else {
          return '마피아가 시민을 죽였습니다.';
        }
      }
      
      if (player.role === 'mafia') return '죽일 사람을 선택하세요.';
      if (player.role === 'doctor') return '살릴 사람을 선택하세요.';
      if (player.role === 'police') return '조사할 사람을 선택하세요.';
      return '밤이 되었습니다. 마피아, 의사, 경찰이 행동할 시간입니다.';
    }
    if (isDayDiscussion) return '낮이 되었습니다. 마피아를 찾기 위해 토론하세요.';
    if (isDayVoting) {
      const alivePlayers = gameState.players.filter(p => p.isAlive);
      const votedPlayers = Object.keys(gameState.votingResults);
      const notVotedCount = alivePlayers.length - votedPlayers.length;
      
      if (notVotedCount > 0) {
        return `투표 시간입니다. 처형할 사람을 선택하세요. 아직 ${notVotedCount}명이 투표하지 않았습니다.`;
      } else {
        return '모든 플레이어가 투표를 완료했습니다. 결과를 기다려주세요.';
      }
    }
    if (isVoteResult) return '투표 결과가 발표되었습니다.';
    if (isGameOver) {
      if (gameState.winner === 'citizens') return '시민팀이 승리했습니다!';
      if (gameState.winner === 'mafia') return '마피아팀이 승리했습니다!';
    }
    return '';
  };
  
  const getPoliceCheckResult = (): string => {
    if (player.role === 'police') {
      // 현재 밤에 조사한 결과 확인
      if (gameState.nightActions.policeCheck.targetId) {
        const targetId = gameState.nightActions.policeCheck.targetId;
        const targetPlayer = getPlayerById(targetId);
        const isMafia = gameState.nightActions.policeCheck.result;
        
        if (targetPlayer && isMafia !== null) {
          return `${targetPlayer.name}님은 ${isMafia ? '마피아입니다!' : '마피아가 아닙니다.'}`;
        }
      }
      
      // 이전에 조사한 결과 확인 (로컬 스토리지에서)
      try {
        const policeResults = JSON.parse(localStorage.getItem('policeResults') || '{}');
        const lastCheckedPlayerId = Object.keys(policeResults).pop();
        
        if (lastCheckedPlayerId) {
          const targetPlayer = getPlayerById(lastCheckedPlayerId);
          const isMafia = policeResults[lastCheckedPlayerId];
          
          if (targetPlayer) {
            return `${targetPlayer.name}님은 ${isMafia ? '마피아입니다!' : '마피아가 아닙니다.'}`;
          }
        }
      } catch (error) {
        console.error('경찰 조사 결과 로드 오류:', error);
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
    if (player.role === 'police') {
      // 현재 밤에 조사한 결과 확인
      if (gameState.nightActions.policeCheck.targetId === playerId && 
          gameState.nightActions.policeCheck.result === true) {
        return true;
      }
      
      // 이전에 조사한 결과 확인 (로컬 스토리지에서)
      try {
        const policeResults = JSON.parse(localStorage.getItem('policeResults') || '{}');
        if (policeResults[playerId] === true) {
          return true;
        }
      } catch (error) {
        console.error('경찰 조사 결과 로드 오류:', error);
      }
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
  
  // 현재 플레이어가 행동했는지 확인
  const hasPlayerActed = (): boolean => {
    if (isDayVoting) {
      // 투표 단계에서는 투표 결과에 플레이어 ID가 있는지 확인
      return Object.keys(gameState.votingResults).includes(player.id);
    }
    
    if (isNight) {
      // 밤 단계에서는 역할에 따라 행동 여부 확인
      if (gameState.nightPhase === 'doctor' && player.role === 'doctor') {
        return gameState.nightActions.doctorSave !== null;
      }
      if (gameState.nightPhase === 'police' && player.role === 'police') {
        return gameState.nightActions.policeCheck.targetId !== null;
      }
      if (gameState.nightPhase === 'mafia' && player.role === 'mafia') {
        return gameState.nightActions.mafiaKill !== null;
      }
    }
    
    return false;
  };
  
  // 투표 결과 표시 컴포넌트
  const renderVoteResults = () => {
    if (!isVoteResult || Object.keys(voteResults).length === 0) return null;
    
    // 득표수 내림차순으로 정렬
    const sortedResults = Object.entries(voteResults)
      .sort(([, a], [, b]) => b - a)
      .map(([playerId, votes]) => {
        const player = getPlayerById(playerId);
        if (!player) return null;
        
        const isExecuted = playerId === executedPlayerId;
        
        return (
          <div 
            key={playerId} 
            style={{ 
              padding: '10px', 
              margin: '5px 0', 
              backgroundColor: isExecuted ? '#ffcccc' : '#f0f0f0',
              borderRadius: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: isExecuted ? '2px solid #e74c3c' : 'none'
            }}
          >
            <div>
              <strong>{player.name}</strong>
              {isExecuted && <span style={{ color: '#e74c3c', marginLeft: '10px' }}>처형됨</span>}
            </div>
            <div>
              <Badge variant="primary">{votes}표</Badge>
            </div>
          </div>
        );
      });
    
    return (
      <Card style={{ marginTop: '20px' }}>
        <Subtitle>투표 결과</Subtitle>
        {sortedResults}
      </Card>
    );
  };
  
  return (
    <Container>
      <Card>
        <Title>마피아 게임</Title>
        <GameTimer seconds={gameState.timer} phase={gameState.phase} />
        
        <Text style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px' }}>
          {getPhaseDescription()}
        </Text>
        
        {/* 플레이어 행동 상태 표시 */}
        {(isDayVoting || isNight) && canPlayerActNow() && !hasPlayerActed() && (
          <Text style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold', marginBottom: '10px' }}>
            아직 행동을 완료하지 않았습니다. 빨리 행동을 완료해주세요!
          </Text>
        )}
        
        {(isDayVoting || isNight) && hasPlayerActed() && (
          <Text style={{ textAlign: 'center', color: '#2ecc71', fontWeight: 'bold', marginBottom: '10px' }}>
            행동을 완료했습니다. 다른 플레이어를 기다리고 있습니다.
          </Text>
        )}
        
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
        
        {/* 투표 결과 표시 */}
        {isVoteResult && renderVoteResults()}
        
        <Grid style={{ gridTemplateColumns: '1fr 2fr' }}>
          <Card>
            <Subtitle>내 정보</Subtitle>
            <RoleCard 
              role={player.role} 
              description={getRoleDescription(player.role)} 
            />
            
            {canPlayerActNow() && !hasPlayerActed() && (
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
            
            {canPlayerActNow() && hasPlayerActed() && (
              <Text style={{ marginTop: '20px', color: '#2ecc71' }}>
                행동을 완료했습니다. 다른 플레이어를 기다리고 있습니다.
              </Text>
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