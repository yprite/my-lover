// src/types.ts
export type PlayerRole = 
  | 'citizen' 
  | 'mafia' 
  | 'doctor' 
  | 'police' 
  | 'spectator';

export type GamePhase = 
  | 'waiting' 
  | 'night' 
  | 'day-discussion' 
  | 'day-voting' 
  | 'game-over';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  isAlive: boolean;
  isHost: boolean;
  isReady?: boolean;
  isAI?: boolean;
  aiDifficulty?: AIDifficulty;
}

export interface GameState {
  roomId: string;
  players: Player[];
  phase: GamePhase;
  day: number;
  winner: 'citizens' | 'mafia' | null;
  votingResults: Record<string, string>; // key: voterId, value: votedId
  nightActions: {
    mafiaKill: string | null;
    doctorSave: string | null;
    policeCheck: {
      targetId: string | null;
      result: boolean | null;
    };
  };
  messages: ChatMessage[];
  timer: number | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isSystemMessage: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
} 