import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GameState, Player, ChatMessage, PlayerRole, GamePhase, AIDifficulty } from '../types';
import { useUser } from './UserContext';
import { useSocket } from './SocketContext';
import { socketApi, setupSocketListeners } from '../services/socketApi';
import { 
  generateAIChatMessage, 
  selectAINightActionTarget, 
  selectAIVoteTarget,
  createAIPlayer
} from '../utils/aiUtils';

interface GameContextType {
  gameState: GameState | null;
  setGameState: (gameState: GameState) => void;
  createRoom: (roomName: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  vote: (targetId: string) => void;
  performNightAction: (action: 'kill' | 'save' | 'check', targetId: string) => void;
  sendMessage: (content: string) => void;
  getPlayerById: (playerId: string) => Player | undefined;
  getCurrentPlayer: () => Player | undefined;
  isPlayerAlive: (playerId: string) => boolean;
  getRoleDescription: (role: PlayerRole) => string;
  canPerformAction: () => boolean;
  addAIPlayer: (difficulty?: 'easy' | 'medium' | 'hard') => void;
  removeAIPlayer: (aiId: string) => void;
}

const initialGameState: GameState = {
  roomId: '',
  players: [],
  phase: 'waiting',
  nightPhase: null,
  day: 0,
  winner: null,
  votingResults: {},
  nightActions: {
    mafiaKill: null,
    doctorSave: null,
    policeCheck: {
      targetId: null,
      result: null,
    },
  },
  messages: [],
  timer: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { user, updateCurrentRoom } = useUser();
  
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

  // 소켓 연결 시 이벤트 리스너 설정
  useEffect(() => {
    if (!socket || !isConnected) return;

    const unsubscribe = setupSocketListeners(socket, {
      onGameStateUpdate: (newGameState: GameState) => {
        console.log('게임 상태 업데이트:', newGameState);
        setGameState(newGameState);
      },
      onRoomJoined: (roomId: string) => {
        console.log(`방에 입장했습니다: ${roomId}`);
      },
      onRoomLeft: () => {
        setGameState(null);
        console.log('방에서 나왔습니다');
      },
      onNewMessage: (message: ChatMessage) => {
        if (gameState) {
          setGameState({
            ...gameState,
            messages: [...gameState.messages, message]
          });
        }
      },
      onGameStarted: () => {
        console.log('게임이 시작되었습니다');
        console.log('현재 게임 상태:', gameState);
        // 게임 시작 시 화면 전환은 RoomPage 컴포넌트에서 gameState 변경을 감지하여 처리
      },
      onGameEnded: (winner: 'citizens' | 'mafia') => {
        console.log(`게임이 종료되었습니다. 승자: ${winner}`);
      },
      onTimerUpdated: (timer: number) => {
        console.log(`타이머 업데이트: ${timer}`);
        if (gameState) {
          setGameState({
            ...gameState,
            timer: timer
          });
        }
      },
      onNightPhaseChanged: (newGameState: GameState, nightPhase: 'doctor' | 'police' | 'mafia') => {
        console.log(`밤 단계 변경: ${nightPhase}`);
        setGameState(newGameState);
      },
      onAIPlayerAdded: (aiPlayer: Player) => {
        console.log(`AI 플레이어가 추가되었습니다: ${aiPlayer.name} (난이도: ${aiPlayer.aiDifficulty})`);
      },
      onAIPlayerRemoved: (aiId: string) => {
        console.log(`AI 플레이어가 제거되었습니다: ${aiId}`);
      },
      onError: (error: string) => {
        console.error('소켓 오류:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [socket, isConnected, gameState]);

  const createRoom = async (roomName: string) => {
    if (!socket || !isConnected) return;

    try {
      const response = await socketApi.createRoom(socket, roomName);
      console.log('방 생성 성공:', response);
      
      // 방 생성 후 해당 방에 참가
      const joinResponse = await socketApi.joinRoom(socket, response.roomId);
      if (joinResponse.success && joinResponse.gameState) {
        setGameState(joinResponse.gameState);
        updateCurrentRoom(response.roomId);
        console.log('방 참가 성공:', joinResponse);
      } else {
        console.error('방 참가 실패:', joinResponse);
      }
    } catch (error) {
      console.error('방 생성 오류:', error);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!socket || !isConnected) return;

    try {
      const response = await socketApi.joinRoom(socket, roomId);
      if (response.success && response.gameState) {
        setGameState(response.gameState);
        updateCurrentRoom(roomId);
      }
    } catch (error) {
      console.error('방 참가 오류:', error);
    }
  };

  const leaveRoom = async () => {
    if (!socket || !isConnected || !gameState) return;

    try {
      const response = await socketApi.leaveRoom(socket);
      if (response.success) {
        setGameState(null);
        updateCurrentRoom(null);
      }
    } catch (error) {
      console.error('방 퇴장 오류:', error);
    }
  };

  const startGame = () => {
    if (!socket || !isConnected || !gameState) return;

    try {
      socketApi.startGame(socket)
        .then(response => {
          if (response.success) {
            console.log('게임 시작 성공');
          } else {
            console.error('게임 시작 실패:', response);
          }
        });
    } catch (error) {
      console.error('게임 시작 오류:', error);
    }
  };

  const vote = async (targetId: string) => {
    if (!socket || !isConnected || !gameState) return;

    try {
      await socketApi.vote(socket, targetId);
    } catch (error) {
      console.error('투표 오류:', error);
    }
  };

  const performNightAction = async (action: 'kill' | 'save' | 'check', targetId: string) => {
    if (!socket || !isConnected || !gameState) return;

    try {
      await socketApi.performNightAction(socket, action, targetId);
    } catch (error) {
      console.error('밤 행동 오류:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!socket || !isConnected || !gameState) return;

    try {
      await socketApi.sendMessage(socket, content);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
    }
  };

  const addAIPlayer = (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    if (!socket || !isConnected || !gameState) return;

    try {
      socketApi.addAIPlayer(socket, difficulty)
        .then(response => {
          if (response.success) {
            console.log(`AI 플레이어 추가 성공 (난이도: ${difficulty})`);
          } else {
            console.error('AI 플레이어 추가 실패:', response);
          }
        });
    } catch (error) {
      console.error('AI 플레이어 추가 오류:', error);
    }
  };

  const removeAIPlayer = (aiId: string) => {
    if (!socket || !isConnected || !gameState) return;

    try {
      socketApi.removeAIPlayer(socket, aiId)
        .then(response => {
          if (response.success) {
            console.log(`AI 플레이어 제거 성공: ${aiId}`);
          } else {
            console.error('AI 플레이어 제거 실패:', response);
          }
        });
    } catch (error) {
      console.error('AI 플레이어 제거 오류:', error);
    }
  };

  const getPlayerById = (playerId: string): Player | undefined => {
    return gameState?.players.find(player => player.id === playerId);
  };

  const getCurrentPlayer = (): Player | undefined => {
    const player = getPlayerById(user.id);
    console.log('getCurrentPlayer 호출:', { 
      userId: user.id, 
      player, 
      allPlayers: gameState?.players 
    });
    return player;
  };

  const isPlayerAlive = (playerId: string): boolean => {
    const player = getPlayerById(playerId);
    return player ? player.isAlive : false;
  };

  const getRoleDescription = (role: PlayerRole): string => {
    switch (role) {
      case 'citizen':
        return '당신은 시민입니다. 마피아를 찾아 처형하세요.';
      case 'mafia':
        return '당신은 마피아입니다. 밤에 시민을 죽이고 낮에는 정체를 숨기세요.';
      case 'doctor':
        return '당신은 의사입니다. 밤에 한 명을 선택하여 마피아의 공격으로부터 보호할 수 있습니다.';
      case 'police':
        return '당신은 경찰입니다. 밤에 한 명을 조사하여 마피아인지 확인할 수 있습니다.';
      case 'spectator':
        return '당신은 관전자입니다. 게임에 참여하지 않고 관전만 할 수 있습니다.';
      default:
        return '역할이 할당되지 않았습니다.';
    }
  };

  const canPerformAction = (): boolean => {
    if (!gameState) return false;
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !currentPlayer.isAlive) return false;
    
    // 낮 투표 단계에서는 모든 살아있는 플레이어가 투표 가능
    if (gameState.phase === 'day-voting') return true;
    
    // 밤 단계에서는 역할에 따라 행동 가능
    if (gameState.phase === 'night') {
      // 마피아는 살인 가능
      if (currentPlayer.role === 'mafia' && gameState.nightActions.mafiaKill === null) return true;
      
      // 의사는 보호 가능
      if (currentPlayer.role === 'doctor' && gameState.nightActions.doctorSave === null) return true;
      
      // 경찰은 조사 가능
      if (currentPlayer.role === 'police' && gameState.nightActions.policeCheck.targetId === null) return true;
    }
    
    return false;
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        vote,
        performNightAction,
        sendMessage,
        getPlayerById,
        getCurrentPlayer,
        isPlayerAlive,
        getRoleDescription,
        canPerformAction,
        addAIPlayer,
        removeAIPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 