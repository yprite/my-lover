// import { Socket } from 'socket.io-client/build/esm/socket';
import { GameState, Player, RoomInfo, ChatMessage, PlayerRole, AIDifficulty } from '../types';

// 서버로 이벤트를 보내는 함수들
export const socketApi = {
  // 사용자 관련
  login: (socket: any, username: string): Promise<{ userId: string, username: string }> => {
    return new Promise((resolve) => {
      socket.emit('login', { username }, (response: { userId: string, username: string }) => {
        resolve(response);
      });
    });
  },

  // 방 관련
  createRoom: (socket: any, roomName: string): Promise<{ roomId: string }> => {
    return new Promise((resolve) => {
      socket.emit('create_room', { roomName }, (response: { roomId: string }) => {
        resolve(response);
      });
    });
  },

  joinRoom: (socket: any, roomId: string): Promise<{ success: boolean, gameState?: GameState }> => {
    return new Promise((resolve) => {
      socket.emit('join_room', { roomId }, (response: { success: boolean, gameState?: GameState }) => {
        resolve(response);
      });
    });
  },

  leaveRoom: (socket: any): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socket.emit('leave_room', {}, (response: { success: boolean }) => {
        resolve(response);
      });
    });
  },

  getRooms: (socket: any): Promise<RoomInfo[]> => {
    return new Promise((resolve) => {
      socket.emit('get_rooms', {}, (response: { rooms: RoomInfo[] }) => {
        resolve(response.rooms);
      });
    });
  },

  // 게임 관련
  startGame: (socket: any): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socket.emit('start_game', {}, (response: { success: boolean }) => {
        resolve(response);
      });
    });
  },

  vote: (socket: any, targetId: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socket.emit('vote', { targetId }, (response: { success: boolean }) => {
        resolve(response);
      });
    });
  },

  performNightAction: (
    socket: any, 
    action: 'kill' | 'save' | 'check', 
    targetId: string
  ): Promise<{ success: boolean, result?: boolean }> => {
    return new Promise((resolve) => {
      socket.emit('night_action', { action, targetId }, 
        (response: { success: boolean, result?: boolean }) => {
          resolve(response);
        }
      );
    });
  },

  // 채팅 관련
  sendMessage: (socket: any, content: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socket.emit('send_message', { content }, (response: { success: boolean }) => {
        resolve(response);
      });
    });
  },

  // AI 플레이어 관련
  addAIPlayer: (socket: any, difficulty: AIDifficulty = 'medium'): Promise<{ success: boolean, player?: Player }> => {
    return new Promise((resolve) => {
      socket.emit('add_ai_player', { difficulty }, 
        (response: { success: boolean, player?: Player }) => {
          resolve(response);
        }
      );
    });
  },

  removeAIPlayer: (socket: any, aiId: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socket.emit('remove_ai_player', { aiId }, (response: { success: boolean }) => {
        resolve(response);
      });
    });
  }
};

// 서버로부터 이벤트를 수신하는 함수
export const setupSocketListeners = (
  socket: any,
  callbacks: {
    onGameStateUpdate?: (gameState: GameState) => void;
    onRoomJoined?: (roomId: string) => void;
    onRoomLeft?: () => void;
    onNewMessage?: (message: ChatMessage) => void;
    onGameStarted?: () => void;
    onGameEnded?: (winner: 'citizens' | 'mafia') => void;
    onAIPlayerAdded?: (aiPlayer: Player) => void;
    onAIPlayerRemoved?: (aiId: string) => void;
    onError?: (error: string) => void;
  }
) => {
  // 게임 상태 업데이트
  socket.on('game_state_update', (data: { gameState: GameState }) => {
    if (callbacks.onGameStateUpdate) {
      callbacks.onGameStateUpdate(data.gameState);
    }
  });

  // 방 참가 성공
  socket.on('room_joined', (data: { roomId: string }) => {
    if (callbacks.onRoomJoined) {
      callbacks.onRoomJoined(data.roomId);
    }
  });

  // 방 퇴장 성공
  socket.on('room_left', () => {
    if (callbacks.onRoomLeft) {
      callbacks.onRoomLeft();
    }
  });

  // 새 메시지 수신
  socket.on('new_message', (data: { message: ChatMessage }) => {
    if (callbacks.onNewMessage) {
      callbacks.onNewMessage(data.message);
    }
  });

  // 게임 시작
  socket.on('game_started', (data: { gameState: GameState }) => {
    console.log('game_started 이벤트 수신:', data);
    if (callbacks.onGameStateUpdate && data.gameState) {
      callbacks.onGameStateUpdate(data.gameState);
    }
    if (callbacks.onGameStarted) {
      callbacks.onGameStarted();
    }
  });

  // 게임 종료
  socket.on('game_ended', (data: { winner: 'citizens' | 'mafia' }) => {
    if (callbacks.onGameEnded) {
      callbacks.onGameEnded(data.winner);
    }
  });
  
  // AI 플레이어 추가됨
  socket.on('ai_player_added', (data: { gameState: GameState, aiPlayer: Player }) => {
    if (callbacks.onGameStateUpdate) {
      callbacks.onGameStateUpdate(data.gameState);
    }
    if (callbacks.onAIPlayerAdded) {
      callbacks.onAIPlayerAdded(data.aiPlayer);
    }
  });
  
  // AI 플레이어 제거됨
  socket.on('ai_player_removed', (data: { gameState: GameState, aiId: string }) => {
    if (callbacks.onGameStateUpdate) {
      callbacks.onGameStateUpdate(data.gameState);
    }
    if (callbacks.onAIPlayerRemoved) {
      callbacks.onAIPlayerRemoved(data.aiId);
    }
  });

  // 오류 처리
  socket.on('error', (data: { message: string }) => {
    if (callbacks.onError) {
      callbacks.onError(data.message);
    }
  });

  // 리스너 제거 함수 반환
  return () => {
    socket.off('game_state_update');
    socket.off('room_joined');
    socket.off('room_left');
    socket.off('new_message');
    socket.off('game_started');
    socket.off('game_ended');
    socket.off('ai_player_added');
    socket.off('ai_player_removed');
    socket.off('error');
  };
}; 