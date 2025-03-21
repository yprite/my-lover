import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameState, Player, ChatMessage, PlayerRole, AIDifficulty, RoomInfo } from './types';
import { createAIPlayer, generateAIChatMessage, selectAIVoteTarget, selectAINightActionTarget } from './aiUtils';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 리액트 앱 주소
    methods: ["GET", "POST"]
  }
});

// 게임 상태를 저장할 객체
interface Room {
  id: string;
  players: Player[];
  phase: 'waiting' | 'night' | 'day-discussion' | 'day-voting' | 'vote-result' | 'game-over';
  nightPhase: 'doctor' | 'police' | 'mafia' | null;
  day: number;
  winner: 'citizens' | 'mafia' | null;
  votingResults: Record<string, string>;
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
  executedPlayer: Player | null; // 처형된 플레이어 정보 저장
}

const rooms: Record<string, Room> = {};

// 소켓 연결 처리
io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);

  // 로그인 처리
  socket.on('login', ({ username }, callback) => {
    const userId = socket.id;
    console.log(`사용자 로그인: ${username} (ID: ${userId})`);
    callback({ userId, username });
  }); 

  // 방 생성
  socket.on('create_room', ({ roomName }, callback) => {
    const roomId = `room-${Date.now()}`;
    rooms[roomId] = {
      id: roomId,
      players: [],
      phase: 'waiting',
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
      nightPhase: null,
      executedPlayer: null,
    };
    
    callback({ roomId });
    console.log(`방 생성됨: ${roomId}`);
  });

  // 방 참가
  socket.on('join_room', ({ roomId }, callback) => {
    if (rooms[roomId]) {
      // 로컬 스토리지에서 사용자 정보 가져오기
      const userId = socket.id;
      
      // 이미 방에 있는 플레이어인지 확인
      const existingPlayer = rooms[roomId].players.find(p => p.id === userId);
      if (existingPlayer) {
        // 이미 방에 있는 플레이어라면 게임 상태만 반환
        socket.join(roomId);
        callback({ success: true, gameState: rooms[roomId] });
        return;
      }
      
      // 새 플레이어 생성
      const newPlayer: Player = {
        id: userId,
        name: `Player-${userId.substring(0, 5)}`,
        role: 'citizen', // 기본 역할
        isAlive: true,
        isHost: rooms[roomId].players.length === 0, // 첫 번째 플레이어가 호스트
        isReady: false,
        isAI: false,
        aiDifficulty: undefined
      };
      
      rooms[roomId].players.push(newPlayer);
      socket.join(roomId);
      
      // 방에 있는 모든 클라이언트에게 게임 상태 업데이트 전송
      io.to(roomId).emit('game_state_update', { gameState: rooms[roomId] });
      
      // 방에 참가한 클라이언트에게 성공 응답 전송
      callback({ success: true, gameState: rooms[roomId] });
      socket.emit('room_joined', { roomId });
      
      console.log(`플레이어 ${newPlayer.name}가 방 ${roomId}에 참가함`);
    } else {
      callback({ success: false, message: '존재하지 않는 방입니다.' });
    }
  });

  // 방 나가기
  socket.on('leave_room', ({}, callback) => {
    // 플레이어가 속한 방 찾기
    const roomId = Object.keys(rooms).find(roomId => 
      rooms[roomId].players.some(player => player.id === socket.id)
    );
    
    if (roomId && rooms[roomId]) {
      // 방에서 플레이어 제거
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
      
      // 방에 플레이어가 없으면 방 삭제
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
        console.log(`방 ${roomId} 삭제됨 (플레이어 없음)`);
      } else {
        // 호스트가 나갔다면 다음 플레이어에게 호스트 권한 부여
        if (rooms[roomId].players.length > 0 && !rooms[roomId].players.some(p => p.isHost)) {
          rooms[roomId].players[0].isHost = true;
        }
        
        // 방에 있는 모든 클라이언트에게 게임 상태 업데이트 전송
        io.to(roomId).emit('game_state_update', { gameState: rooms[roomId] });
      }
      
      socket.leave(roomId);
      socket.emit('room_left');
      callback({ success: true });
      console.log(`플레이어 ${socket.id}가 방 ${roomId}에서 나감`);
    } else {
      callback({ success: false, message: '방을 찾을 수 없습니다.' });
    }
  });

  // 게임 시작
  socket.on('start_game', ({}, callback) => {
    // 플레이어가 속한 방 찾기
    const roomId = Object.keys(rooms).find(roomId => 
      rooms[roomId].players.some(player => player.id === socket.id && player.isHost)
    );
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      
      // 역할 할당 로직
      const players = [...room.players];
      const roles: PlayerRole[] = [];
      
      // 플레이어 수에 따라 역할 분배
      const playerCount = players.length;
      const mafiaCount = Math.max(1, Math.floor(playerCount / 4));
      const doctorCount = 1;
      const policeCount = 1;
      const citizenCount = playerCount - mafiaCount - doctorCount - policeCount;
      
      // 역할 배열 생성
      for (let i = 0; i < mafiaCount; i++) roles.push('mafia');
      for (let i = 0; i < doctorCount; i++) roles.push('doctor');
      for (let i = 0; i < policeCount; i++) roles.push('police');
      for (let i = 0; i < citizenCount; i++) roles.push('citizen');
      
      // 역할 섞기
      for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
      }
      
      // 역할 할당
      players.forEach((player, index) => {
        player.role = roles[index];
        player.isAlive = true;
      });
      
      // 시스템 메시지 추가
      const systemMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: '시스템',
        content: '게임이 시작되었습니다. 낮이 되었습니다. 마피아를 찾기 위해 토론하세요.',
        timestamp: Date.now(),
        isSystemMessage: true,
      };
      
      room.players = players;
      room.phase = 'day-discussion';
      room.day = 1;
      room.messages = [...room.messages, systemMessage];
      room.timer = 60; // 60초 타이머 (낮 토론 시간)
      room.nightPhase = null; // 밤 단계 초기화
      
      io.to(roomId).emit('game_started', { gameState: room });
      callback({ success: true });
      console.log(`방 ${roomId}에서 게임 시작됨`);
      
      // 타이머 시작
      startTimer(roomId);
    } else {
      callback({ success: false, message: '방을 찾을 수 없거나 호스트가 아닙니다.' });
    }
  });

  // 메시지 전송
  socket.on('send_message', ({ content }, callback) => {
    // 플레이어가 속한 방 찾기
    const roomId = Object.keys(rooms).find(roomId => 
      rooms[roomId].players.some(player => player.id === socket.id)
    );
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const player = room.players.find(p => p.id === socket.id);
      
      if (player) {
        const message: ChatMessage = {
          id: `msg-${Date.now()}-${socket.id}`,
          senderId: socket.id,
          senderName: player.name,
          content,
          timestamp: Date.now(),
          isSystemMessage: false,
        };
        
        room.messages.push(message);
        io.to(roomId).emit('new_message', { message, gameState: room });
        callback({ success: true });
      } else {
        callback({ success: false, message: '플레이어를 찾을 수 없습니다.' });
      }
    } else {
      callback({ success: false, message: '방을 찾을 수 없습니다.' });
    }
  });

  // 투표
  socket.on('vote', ({ targetId }, callback) => {
    // 플레이어가 속한 방 찾기
    const roomId = Object.keys(rooms).find(roomId => 
      rooms[roomId].players.some(player => player.id === socket.id)
    );
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      
      if (room.phase === 'day-voting') {
        const voterId = socket.id;
        room.votingResults[voterId] = targetId;
        
        io.to(roomId).emit('vote_updated', { gameState: room });
        callback({ success: true });
        
        // 모든 살아있는 플레이어가 투표했는지 확인
        const alivePlayers = room.players.filter(p => p.isAlive);
        const votedPlayers = Object.keys(room.votingResults);
        
        if (alivePlayers.every(p => votedPlayers.includes(p.id))) {
          // 투표 결과 처리
          processVotingResults(roomId);
        }
      } else {
        callback({ success: false, message: '현재 투표 단계가 아닙니다.' });
      }
    } else {
      callback({ success: false, message: '방을 찾을 수 없습니다.' });
    }
  });

  // 밤 행동
  socket.on('night_action', ({ action, targetId }, callback) => {
    // 플레이어가 속한 방 찾기
    const roomId = Object.keys(rooms).find(roomId => 
      rooms[roomId].players.some(player => player.id === socket.id)
    );
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      
      if (room.phase === 'night') {
        const playerId = socket.id;
        const player = room.players.find(p => p.id === playerId);
        
        if (player && player.isAlive) {
          let success = false;
          let result = null;
          
          if (action === 'kill' && player.role === 'mafia') {
            room.nightActions.mafiaKill = targetId;
            success = true;
          } else if (action === 'save' && player.role === 'doctor') {
            room.nightActions.doctorSave = targetId;
            success = true;
          } else if (action === 'check' && player.role === 'police') {
            const targetPlayer = room.players.find(p => p.id === targetId);
            result = targetPlayer?.role === 'mafia';
            room.nightActions.policeCheck = {
              targetId,
              result,
            };
            success = true;
          }
          
          if (success) {
            // 밤 행동 수행 이벤트 발생
            io.to(roomId).emit('night_action_performed', { gameState: room });
            
            // 콜백 함수 호출
            callback({ success: true, result });
            
            // 모든 밤 행동이 완료되었는지 확인
            checkNightActionsCompleted(roomId);
          } else {
            callback({ success: false, message: '유효하지 않은 행동입니다.' });
          }
        } else {
          callback({ success: false, message: '플레이어를 찾을 수 없거나 죽은 상태입니다.' });
        }
      } else {
        callback({ success: false, message: '현재 밤 단계가 아닙니다.' });
      }
    } else {
      callback({ success: false, message: '방을 찾을 수 없습니다.' });
    }
  });

  // AI 플레이어 추가
  socket.on('add_ai_player', ({ difficulty = 'medium' }, callback) => {
    // 플레이어가 속한 방 찾기
    const roomId = Object.keys(rooms).find(roomId => 
      rooms[roomId].players.some(player => player.id === socket.id && player.isHost)
    );
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      
      if (room.phase === 'waiting') {
        // AI 번호 계산 (기존 AI 플레이어 수 + 1)
        const aiNumber = room.players.filter(p => p.isAI).length + 1;
        
        // AI 플레이어 생성
        const aiPlayer = createAIPlayer(aiNumber, difficulty);
        
        // 방에 AI 플레이어 추가
        room.players.push(aiPlayer);
        
        // 클라이언트에 알림
        io.to(roomId).emit('ai_player_added', { 
          gameState: room,
          aiPlayer
        });
        
        callback({ success: true, player: aiPlayer });
        console.log(`AI 플레이어 ${aiPlayer.name}(난이도: ${difficulty})가 방 ${roomId}에 추가됨`);
      } else {
        callback({ success: false, message: '대기 중인 방에서만 AI 플레이어를 추가할 수 있습니다.' });
      }
    } else {
      callback({ success: false, message: '방을 찾을 수 없거나 호스트가 아닙니다.' });
    }
  });

  // AI 플레이어 제거
  socket.on('remove_ai_player', ({ aiId }, callback) => {
    // 플레이어가 속한 방 찾기
    const roomId = Object.keys(rooms).find(roomId => 
      rooms[roomId].players.some(player => player.id === socket.id && player.isHost)
    );
    
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      
      if (room.phase === 'waiting') {
        // 제거할 AI 플레이어 찾기
        const aiPlayer = room.players.find(p => p.id === aiId && p.isAI);
        
        if (aiPlayer) {
          // 방에서 AI 플레이어 제거
          room.players = room.players.filter(p => p.id !== aiId);
          
          // 클라이언트에 알림
          io.to(roomId).emit('ai_player_removed', { 
            gameState: room,
            aiId
          });
          
          callback({ success: true });
          console.log(`AI 플레이어 ${aiPlayer.name}가 방 ${roomId}에서 제거됨`);
        } else {
          callback({ success: false, message: 'AI 플레이어를 찾을 수 없습니다.' });
        }
      } else {
        callback({ success: false, message: '대기 중인 방에서만 AI 플레이어를 제거할 수 있습니다.' });
      }
    } else {
      callback({ success: false, message: '방을 찾을 수 없거나 호스트가 아닙니다.' });
    }
  });

  // 방 목록 가져오기
  socket.on('get_rooms', ({}, callback) => {
    // 방 정보 형식으로 변환
    const roomInfoList: RoomInfo[] = Object.values(rooms).map(room => ({
      id: room.id,
      name: `방 ${room.id.substring(5)}`, // room-timestamp에서 timestamp 부분만 사용
      playerCount: room.players.length,
      maxPlayers: 8, // 최대 플레이어 수
      status: room.phase === 'waiting' ? 'waiting' : 'playing'
    }));
    
    callback({ rooms: roomInfoList });
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
    // 방에서 플레이어 제거 로직은 복잡할 수 있으므로 여기서는 생략
  });
});

// 타이머 관리
function startTimer(roomId: string, callback?: () => void) {
  const room = rooms[roomId];
  if (!room || room.timer === null) return;
  
  const timerId = setInterval(() => {
    if (room.timer !== null && room.timer > 0) {
      room.timer--;
      io.to(roomId).emit('timer_updated', { timer: room.timer });
      
      // AI 플레이어 행동 처리
      handleAIActions(roomId);
      
      if (room.timer === 0) {
        clearInterval(timerId);
        
        // 콜백 함수가 있으면 실행
        if (callback) {
          callback();
          return;
        }
        
        // 타이머가 끝났을 때 다음 단계로 진행
        if (room.phase === 'day-discussion') {
          startVotingPhase(roomId);
        } else if (room.phase === 'day-voting') {
          // 투표 단계에서는 타이머가 끝나도 자동으로 다음 단계로 넘어가지 않음
          // 대신 투표하지 않은 플레이어에게 메시지를 보냄
          const alivePlayers = room.players.filter(p => p.isAlive);
          const votedPlayers = Object.keys(room.votingResults);
          const notVotedPlayers = alivePlayers.filter(p => !votedPlayers.includes(p.id));
          
          if (notVotedPlayers.length > 0) {
            const message: ChatMessage = {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: '시스템',
              content: `투표 시간이 종료되었습니다. 아직 ${notVotedPlayers.length}명의 플레이어가 투표하지 않았습니다. 모든 플레이어가 투표를 완료해야 다음 단계로 넘어갑니다.`,
              timestamp: Date.now(),
              isSystemMessage: true,
            };
            
            room.messages.push(message);
            io.to(roomId).emit('new_message', { message, gameState: room });
            
            // 타이머를 30초로 재설정
            room.timer = 30;
            startTimer(roomId);
          } else {
            // 모든 플레이어가 투표했다면 결과 처리
            processVotingResults(roomId);
          }
        } else if (room.phase === 'vote-result') {
          // 투표 결과 단계 종료 후 밤 단계로 전환
          startNightPhase(roomId);
        } else if (room.phase === 'night') {
          // 밤 단계 진행
          if (room.nightPhase === 'doctor') {
            // 의사 단계에서는 타이머가 끝나도 자동으로 다음 단계로 넘어가지 않음
            // 의사가 없거나 의사가 행동을 완료한 경우에만 다음 단계로 넘어감
            const doctorPlayers = room.players.filter(p => p.isAlive && p.role === 'doctor');
            
            if (doctorPlayers.length === 0 || room.nightActions.doctorSave !== null) {
              // 의사 단계 종료, 경찰 단계 시작
              room.nightPhase = 'police';
              room.timer = 30; // 경찰 30초로 변경
              
              const message: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderId: 'system',
                senderName: '시스템',
                content: '경찰이 시민을 조사하고 있습니다.',
                timestamp: Date.now(),
                isSystemMessage: true,
              };
              room.messages.push(message);
              
              io.to(roomId).emit('night_phase_changed', { 
                gameState: room,
                nightPhase: 'police'
              });
              
              startTimer(roomId);
            } else {
              // 의사가 행동을 완료하지 않았다면 메시지를 보내고 타이머 재설정
              const message: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderId: 'system',
                senderName: '시스템',
                content: '의사가 아직 행동을 완료하지 않았습니다. 의사는 빨리 행동을 완료해주세요.',
                timestamp: Date.now(),
                isSystemMessage: true,
              };
              
              room.messages.push(message);
              io.to(roomId).emit('new_message', { message, gameState: room });
              
              // 타이머를 15초로 재설정
              room.timer = 15;
              startTimer(roomId);
            }
          } else if (room.nightPhase === 'police') {
            // 경찰 단계에서는 타이머가 끝나도 자동으로 다음 단계로 넘어가지 않음
            // 경찰이 없거나 경찰이 행동을 완료한 경우에만 다음 단계로 넘어감
            const policePlayers = room.players.filter(p => p.isAlive && p.role === 'police');
            
            if (policePlayers.length === 0 || room.nightActions.policeCheck.targetId !== null) {
              // 경찰 단계 종료, 마피아 단계 시작
              room.nightPhase = 'mafia';
              room.timer = 30; // 마피아 30초로 변경
              
              const message: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderId: 'system',
                senderName: '시스템',
                content: '마피아가 선량한 시민을 죽이려 하고 있습니다.',
                timestamp: Date.now(),
                isSystemMessage: true,
              };
              room.messages.push(message);
              
              io.to(roomId).emit('night_phase_changed', { 
                gameState: room,
                nightPhase: 'mafia'
              });
              
              startTimer(roomId);
            } else {
              // 경찰이 행동을 완료하지 않았다면 메시지를 보내고 타이머 재설정
              const message: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderId: 'system',
                senderName: '시스템',
                content: '경찰이 아직 행동을 완료하지 않았습니다. 경찰은 빨리 행동을 완료해주세요.',
                timestamp: Date.now(),
                isSystemMessage: true,
              };
              
              room.messages.push(message);
              io.to(roomId).emit('new_message', { message, gameState: room });
              
              // 타이머를 15초로 재설정
              room.timer = 15;
              startTimer(roomId);
            }
          } else if (room.nightPhase === 'mafia') {
            // 마피아 단계에서는 타이머가 끝나도 자동으로 다음 단계로 넘어가지 않음
            // 마피아가 없거나 마피아가 행동을 완료한 경우에만 다음 단계로 넘어감
            const mafiaPlayers = room.players.filter(p => p.isAlive && p.role === 'mafia');
            
            if (mafiaPlayers.length === 0 || room.nightActions.mafiaKill !== null) {
              // 마피아 단계 종료, 밤 행동 처리
              processNightActions(roomId);
            } else {
              // 마피아가 행동을 완료하지 않았다면 메시지를 보내고 타이머 재설정
              const message: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderId: 'system',
                senderName: '시스템',
                content: '마피아가 아직 행동을 완료하지 않았습니다. 마피아는 빨리 행동을 완료해주세요.',
                timestamp: Date.now(),
                isSystemMessage: true,
              };
              
              room.messages.push(message);
              io.to(roomId).emit('new_message', { message, gameState: room });
              
              // 타이머를 15초로 재설정
              room.timer = 15;
              startTimer(roomId);
            }
          }
        }
      }
    } else {
      clearInterval(timerId);
    }
  }, 1000);
}

// AI 플레이어 행동 처리
function handleAIActions(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  
  // AI 플레이어 목록 (살아있는 AI만)
  const aiPlayers = room.players.filter(p => p.isAI && p.isAlive);
  if (aiPlayers.length === 0) return;
  
  // 현재 게임 단계에 따라 AI 행동 처리
  switch (room.phase) {
    case 'day-discussion':
      // 토론 단계에서는 AI가 채팅 메시지를 보냄
      handleAIChatMessages(room, aiPlayers);
      break;
      
    case 'day-voting':
      // 투표 단계에서는 AI가 투표를 함
      handleAIVoting(room, aiPlayers);
      break;
      
    case 'vote-result':
      // 투표 결과 단계에서는 AI가 아무 행동도 하지 않음
      break;
      
    case 'night':
      // 밤 단계에서는 AI가 역할에 따른 행동을 함
      handleAINightActions(room, aiPlayers);
      break;
  }
}

// AI 채팅 메시지 처리
function handleAIChatMessages(room: Room, aiPlayers: Player[]) {
  // 각 AI 플레이어마다 일정 확률로 메시지 생성
  aiPlayers.forEach(aiPlayer => {
    // 난이도에 따라 메시지 생성 확률 조정 (초당)
    const messageChance = aiPlayer.aiDifficulty === 'easy' ? 0.01 : 
                         aiPlayer.aiDifficulty === 'medium' ? 0.02 : 0.03;
    
    // 랜덤 확률로 메시지 생성
    if (Math.random() < messageChance) {
      // Room을 GameState로 변환
      const gameState: GameState = {
        roomId: room.id,
        players: room.players,
        phase: room.phase,
        day: room.day,
        winner: room.winner,
        votingResults: room.votingResults,
        nightActions: room.nightActions,
        messages: room.messages,
        timer: room.timer,
        nightPhase: room.nightPhase
      };
      
      const content = generateAIChatMessage(aiPlayer, gameState, room.phase);
      
      if (content) {
        const message: ChatMessage = {
          id: `msg-${Date.now()}-${aiPlayer.id}`,
          senderId: aiPlayer.id,
          senderName: aiPlayer.name,
          content,
          timestamp: Date.now(),
          isSystemMessage: false,
        };
        
        room.messages.push(message);
        io.to(room.id).emit('new_message', { message, gameState: room });
      }
    }
  });
}

// AI 투표 처리
function handleAIVoting(room: Room, aiPlayers: Player[]) {
  // 아직 투표하지 않은 AI 플레이어들만 필터링
  const aiPlayersWhoHaventVoted = aiPlayers.filter(
    p => !Object.keys(room.votingResults).includes(p.id)
  );
  
  if (aiPlayersWhoHaventVoted.length === 0) return;
  
  // Room을 GameState로 변환
  const gameState: GameState = {
    roomId: room.id,
    players: room.players,
    phase: room.phase,
    day: room.day,
    winner: room.winner,
    votingResults: room.votingResults,
    nightActions: room.nightActions,
    messages: room.messages,
    timer: room.timer,
    nightPhase: room.nightPhase
  };
  
  // 각 AI 플레이어마다 일정 확률로 투표 진행
  aiPlayersWhoHaventVoted.forEach(aiPlayer => {
    // 난이도에 따라 투표 확률 조정 (초당)
    const voteChance = aiPlayer.aiDifficulty === 'easy' ? 0.03 : 
                      aiPlayer.aiDifficulty === 'medium' ? 0.05 : 0.08;
    
    // 타이머가 5초 이하로 남았다면 무조건 투표
    const shouldVote = room.timer !== null && room.timer <= 5 ? true : Math.random() < voteChance;
    
    if (shouldVote) {
      const targetId = selectAIVoteTarget(aiPlayer, gameState);
      
      if (targetId) {
        room.votingResults[aiPlayer.id] = targetId;
        io.to(room.id).emit('vote_updated', { gameState: room });
        
        console.log(`AI 플레이어 ${aiPlayer.name}가 ${targetId}에게 투표함`);
        
        // 모든 살아있는 플레이어가 투표했는지 확인
        const alivePlayers = room.players.filter(p => p.isAlive);
        const votedPlayers = Object.keys(room.votingResults);
        
        if (alivePlayers.every(p => votedPlayers.includes(p.id))) {
          // 투표 결과 처리
          processVotingResults(room.id);
        }
      }
    }
  });
}

// AI 밤 행동 처리
function handleAINightActions(room: Room, aiPlayers: Player[]) {
  // 현재 밤 단계에 따라 AI 행동 처리
  if (room.nightPhase === 'doctor') {
    // 의사 AI 행동
    const aiDoctors = aiPlayers.filter(p => p.role === 'doctor');
    
    if (aiDoctors.length > 0 && room.nightActions.doctorSave === null) {
      // 난이도에 따라 행동 확률 조정 (초당)
      const actionChance = aiDoctors[0].aiDifficulty === 'easy' ? 0.03 : 
                          aiDoctors[0].aiDifficulty === 'medium' ? 0.05 : 0.08;
      
      // 타이머가 5초 이하로 남았다면 무조건 행동
      const shouldAct = room.timer !== null && room.timer <= 5 ? true : Math.random() < actionChance;
      
      if (shouldAct) {
        const aiDoctor = aiDoctors[0]; // 의사는 보통 한 명
        
        // Room을 GameState로 변환
        const gameState: GameState = {
          roomId: room.id,
          players: room.players,
          phase: room.phase,
          day: room.day,
          winner: room.winner,
          votingResults: room.votingResults,
          nightActions: room.nightActions,
          messages: room.messages,
          timer: room.timer,
          nightPhase: room.nightPhase
        };
        
        const targetId = selectAINightActionTarget(aiDoctor, gameState);
        
        if (targetId) {
          room.nightActions.doctorSave = targetId;
          io.to(room.id).emit('night_action_performed', { gameState: room });
          
          console.log(`AI 의사 ${aiDoctor.name}가 ${targetId}를 보호 대상으로 선택함`);
          
          // 의사 행동 완료 확인
          checkNightActionsCompleted(room.id);
        }
      }
    }
  } else if (room.nightPhase === 'police') {
    // 경찰 AI 행동
    const aiPolice = aiPlayers.filter(p => p.role === 'police');
    
    if (aiPolice.length > 0 && room.nightActions.policeCheck.targetId === null) {
      // 난이도에 따라 행동 확률 조정 (초당)
      const actionChance = aiPolice[0].aiDifficulty === 'easy' ? 0.03 : 
                          aiPolice[0].aiDifficulty === 'medium' ? 0.05 : 0.08;
      
      // 타이머가 5초 이하로 남았다면 무조건 행동
      const shouldAct = room.timer !== null && room.timer <= 5 ? true : Math.random() < actionChance;
      
      if (shouldAct) {
        const aiPoliceOfficer = aiPolice[0]; // 경찰은 보통 한 명
        
        // Room을 GameState로 변환
        const gameState: GameState = {
          roomId: room.id,
          players: room.players,
          phase: room.phase,
          day: room.day,
          winner: room.winner,
          votingResults: room.votingResults,
          nightActions: room.nightActions,
          messages: room.messages,
          timer: room.timer,
          nightPhase: room.nightPhase
        };
        
        const targetId = selectAINightActionTarget(aiPoliceOfficer, gameState);
        
        if (targetId) {
          const targetPlayer = room.players.find(p => p.id === targetId);
          room.nightActions.policeCheck = {
            targetId,
            result: targetPlayer?.role === 'mafia',
          };
          io.to(room.id).emit('night_action_performed', { gameState: room });
          
          console.log(`AI 경찰 ${aiPoliceOfficer.name}가 ${targetId}를 조사 대상으로 선택함`);
          
          // 경찰 행동 완료 확인
          checkNightActionsCompleted(room.id);
        }
      }
    }
  } else if (room.nightPhase === 'mafia') {
    // 마피아 AI 행동
    const aiMafias = aiPlayers.filter(p => p.role === 'mafia');
    
    if (aiMafias.length > 0 && room.nightActions.mafiaKill === null) {
      // 난이도에 따라 행동 확률 조정 (초당)
      const actionChance = aiMafias[0].aiDifficulty === 'easy' ? 0.03 : 
                          aiMafias[0].aiDifficulty === 'medium' ? 0.05 : 0.08;
      
      // 타이머가 5초 이하로 남았다면 무조건 행동
      const shouldAct = room.timer !== null && room.timer <= 5 ? true : Math.random() < actionChance;
      
      if (shouldAct) {
        // 여러 마피아가 있을 경우 랜덤하게 한 명 선택
        const randomAIMafia = aiMafias[Math.floor(Math.random() * aiMafias.length)];
        
        // Room을 GameState로 변환
        const gameState: GameState = {
          roomId: room.id,
          players: room.players,
          phase: room.phase,
          day: room.day,
          winner: room.winner,
          votingResults: room.votingResults,
          nightActions: room.nightActions,
          messages: room.messages,
          timer: room.timer,
          nightPhase: room.nightPhase
        };
        
        const targetId = selectAINightActionTarget(randomAIMafia, gameState);
        
        if (targetId) {
          room.nightActions.mafiaKill = targetId;
          io.to(room.id).emit('night_action_performed', { gameState: room });
          
          console.log(`AI 마피아 ${randomAIMafia.name}가 ${targetId}를 살해 대상으로 선택함`);
          
          // 마피아 행동 완료 확인
          checkNightActionsCompleted(room.id);
        }
      }
    }
  }
}

// 밤 행동 완료 확인
function checkNightActionsCompleted(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  
  // 현재 밤 단계에 따라 확인
  if (room.nightPhase === 'doctor') {
    const doctorPlayers = room.players.filter(p => p.isAlive && p.role === 'doctor');
    const doctorActed = room.nightActions.doctorSave !== null || doctorPlayers.length === 0;
    
    if (doctorActed) {
      // 의사 행동 완료, 타이머를 0으로 설정하여 다음 단계로 진행
      room.timer = 0;
      io.to(roomId).emit('timer_updated', { timer: room.timer });
    }
  } else if (room.nightPhase === 'police') {
    const policePlayers = room.players.filter(p => p.isAlive && p.role === 'police');
    const policeActed = room.nightActions.policeCheck.targetId !== null || policePlayers.length === 0;
    
    if (policeActed) {
      // 경찰 행동 완료, 타이머를 0으로 설정하여 다음 단계로 진행
      room.timer = 0;
      io.to(roomId).emit('timer_updated', { timer: room.timer });
    }
  } else if (room.nightPhase === 'mafia') {
    const mafiaPlayers = room.players.filter(p => p.isAlive && p.role === 'mafia');
    const mafiaActed = room.nightActions.mafiaKill !== null || mafiaPlayers.length === 0;
    
    if (mafiaActed) {
      // 마피아 행동 완료, 타이머를 0으로 설정하여 다음 단계로 진행
      room.timer = 0;
      io.to(roomId).emit('timer_updated', { timer: room.timer });
    }
  }
}

// 밤 행동 결과 처리
function processNightActions(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  
  console.log(`밤 행동 결과 처리 시작 - 방 ID: ${roomId}, 현재 단계: ${room.phase}`);
  
  const killedPlayerId = room.nightActions.mafiaKill;
  const savedPlayerId = room.nightActions.doctorSave;
  
  console.log(`마피아 살인 대상: ${killedPlayerId || '없음'}, 의사 보호 대상: ${savedPlayerId || '없음'}`);
  
  // 시스템 메시지 생성
  const messages: ChatMessage[] = [];
  
  // 마피아 살인 결과
  if (killedPlayerId) {
    const killedPlayer = room.players.find(p => p.id === killedPlayerId);
    if (killedPlayer) {
      if (killedPlayerId === savedPlayerId) {
        // 의사가 살린 경우
        messages.push({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: '시스템',
          content: '선량한 시민을 의사가 살렸습니다.',
          timestamp: Date.now(),
          isSystemMessage: true,
        });
        console.log(`의사가 ${killedPlayer.name}(${killedPlayer.role})를 살렸습니다.`);
      } else {
        // 마피아가 죽인 경우
        killedPlayer.isAlive = false;
        messages.push({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: '시스템',
          content: `선량한 시민 ${killedPlayer.name}님이 마피아에 의해 죽었습니다.`,
          timestamp: Date.now(),
          isSystemMessage: true,
        });
        console.log(`마피아가 ${killedPlayer.name}(${killedPlayer.role})를 죽였습니다.`);
      }
    }
  } else {
    messages.push({
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: '시스템',
      content: '마피아가 아무도 죽이지 않았습니다.',
      timestamp: Date.now(),
      isSystemMessage: true,
    });
    console.log('마피아가 아무도 죽이지 않았습니다.');
  }
  
  // 낮 토론 단계로 전환
  room.phase = 'day-discussion';
  room.nightPhase = null;
  room.timer = 60; // 60초 토론 시간 (고정)
  room.messages = [...room.messages, ...messages];
  
  // 밤 행동 초기화
  room.nightActions = {
    mafiaKill: null,
    doctorSave: null,
    policeCheck: {
      targetId: null,
      result: null,
    },
  };
  
  // 승리 조건 확인
  const winner = checkWinCondition(roomId);
  
  // 게임이 끝나지 않았다면 낮 단계 진행
  if (!winner) {
    console.log(`밤 단계 종료, 낮 토론 단계로 전환 (${room.day}일차)`);
    
    // 게임 상태 업데이트 전송
    io.to(roomId).emit('game_state_update', room);
    io.to(roomId).emit('dayStarted', { gameState: room });
    startTimer(roomId);
  }
}

// 투표 단계 시작
function startVotingPhase(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  
  room.phase = 'day-voting';
  room.timer = 60; // 60초 투표 시간으로 변경 (충분한 시간 제공)
  room.votingResults = {};
  
  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    senderId: 'system',
    senderName: '시스템',
    content: '투표 시간입니다. 처형할 사람을 선택하세요. 모든 플레이어가 투표를 완료하면 다음 단계로 넘어갑니다.',
    timestamp: Date.now(),
    isSystemMessage: true,
  };
  
  room.messages.push(message);
  
  io.to(roomId).emit('votingStarted', { gameState: room });
  startTimer(roomId);
}

// 투표 결과 처리
function processVotingResults(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  
  console.log(`투표 결과 처리 시작 - 방 ID: ${roomId}, 현재 단계: ${room.phase}`);
  
  // 투표 집계
  const voteCounts: Record<string, number> = {};
  Object.values(room.votingResults).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });
  
  console.log('투표 결과:', voteCounts);
  
  // 가장 많은 표를 받은 플레이어 찾기
  let maxVotes = 0;
  let executedPlayerId: string | null = null;
  
  for (const [playerId, voteCount] of Object.entries(voteCounts)) {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      executedPlayerId = playerId;
    }
  }
  
  // 동점인 경우 처리
  const tiedPlayers = Object.entries(voteCounts)
    .filter(([_, votes]) => votes === maxVotes)
    .map(([playerId]) => playerId);
  
  if (tiedPlayers.length > 1) {
    executedPlayerId = null; // 동점인 경우 처형 없음
    console.log('투표 동점으로 처형 없음');
  }
  
  // 투표 결과 메시지 생성
  const messages: ChatMessage[] = [];
  
  // 투표 결과 요약 메시지 추가
  const voteResultMessage = Object.entries(voteCounts)
    .sort((a, b) => b[1] - a[1]) // 득표수 내림차순 정렬
    .map(([playerId, votes]) => {
      const player = room.players.find(p => p.id === playerId);
      return player ? `${player.name}: ${votes}표` : '';
    })
    .filter(text => text) // 빈 문자열 제거
    .join(', ');
  
  messages.push({
    id: `msg-${Date.now()}`,
    senderId: 'system',
    senderName: '시스템',
    content: `투표 결과: ${voteResultMessage}`,
    timestamp: Date.now(),
    isSystemMessage: true,
  });
  
  // 처형 결과 메시지 추가
  if (executedPlayerId) {
    const executedPlayer = room.players.find(p => p.id === executedPlayerId);
    if (executedPlayer) {
      executedPlayer.isAlive = false;
      
      messages.push({
        id: `msg-${Date.now() + 1}`,
        senderId: 'system',
        senderName: '시스템',
        content: `${executedPlayer.name}님이 투표로 처형되었습니다. 역할은 ${getRoleText(executedPlayer.role)}였습니다.`,
        timestamp: Date.now() + 1,
        isSystemMessage: true,
      });
      
      console.log(`플레이어 ${executedPlayer.name}(${executedPlayer.role}) 처형됨`);
    }
  } else {
    messages.push({
      id: `msg-${Date.now() + 1}`,
      senderId: 'system',
      senderName: '시스템',
      content: '투표가 동점이거나 없어 아무도 처형되지 않았습니다.',
      timestamp: Date.now() + 1,
      isSystemMessage: true,
    });
  }
  
  room.messages = [...room.messages, ...messages];
  
  // 투표 결과 발표 단계로 전환
  room.phase = 'vote-result';
  room.timer = 10; // 10초 동안 결과 표시
  
  // 승리 조건 확인
  const winner = checkWinCondition(roomId);
  
  if (winner) {
    // 승자가 결정된 경우 게임 종료
    console.log('게임 종료 - 승자:', winner);
    return;
  }
  
  // 투표 결과 정보를 클라이언트에 전송
  io.to(roomId).emit('vote_result', { 
    gameState: room,
    voteCounts: voteCounts,
    executedPlayerId: executedPlayerId
  });
  
  // 타이머 시작
  startTimer(roomId, () => {
    // 타이머 종료 후 밤 단계로 전환
    console.log(`투표 결과 단계 종료, 밤 단계로 전환 (${room.day + 1}일차)`);
    
    // 밤 단계로 전환
    room.phase = 'night';
    room.nightPhase = 'doctor'; // 의사부터 시작
    room.day++;
    room.timer = 30; // 의사 30초로 변경
    
    const nightMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: '시스템',
      content: '밤이 되었습니다. 의사가 시민을 살리고 있습니다.',
      timestamp: Date.now(),
      isSystemMessage: true,
    };
    
    room.messages.push(nightMessage);
    
    // 게임 상태 업데이트 전송
    io.to(roomId).emit('game_state_update', room);
    io.to(roomId).emit('nightStarted', { gameState: room });
    startTimer(roomId);
  });
}

// 승리 조건 확인
function checkWinCondition(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  
  const alivePlayers = room.players.filter(p => p.isAlive);
  const aliveMafia = alivePlayers.filter(p => p.role === 'mafia');
  // 시민 수 계산 수정: 마피아가 아닌 모든 역할(의사, 경찰, 시민)을 시민팀으로 간주
  const aliveCitizens = alivePlayers.filter(p => p.role !== 'mafia');
  
  let winner: 'citizens' | 'mafia' | null = null;
  
  console.log(`승리 조건 확인: 전체 생존자 ${alivePlayers.length}명, 마피아 ${aliveMafia.length}명, 시민팀 ${aliveCitizens.length}명`);
  
  // 마피아가 모두 죽었으면 시민 승리
  if (aliveMafia.length === 0) {
    winner = 'citizens';
    console.log('마피아가 모두 죽어 시민팀 승리');
  }
  // 마피아 수가 시민 수 이상이면 마피아 승리
  else if (aliveMafia.length >= aliveCitizens.length) {
    winner = 'mafia';
    console.log('마피아 수가 시민팀 수 이상이 되어 마피아 승리');
  }
  
  if (winner) {
    room.phase = 'game-over';
    room.winner = winner;
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: '시스템',
      content: winner === 'citizens' ? '시민팀이 승리했습니다!' : '마피아팀이 승리했습니다!',
      timestamp: Date.now(),
      isSystemMessage: true,
    };
    
    room.messages.push(message);
    io.to(roomId).emit('game_state_update', room);
    io.to(roomId).emit('gameOver', { gameState: room });
  }
  
  return winner;
}

// 역할 텍스트 변환
function getRoleText(role: PlayerRole): string {
  switch (role) {
    case 'mafia':
      return '마피아';
    case 'doctor':
      return '의사';
    case 'police':
      return '경찰';
    case 'citizen':
      return '시민';
    case 'spectator':
      return '관전자';
    default:
      return '알 수 없음';
  }
}

// 밤 단계 시작 함수
function startNightPhase(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  
  // 승리 조건 확인
  checkWinCondition(roomId);
  
  // 게임이 끝나지 않았다면 밤 단계로 전환
  if (!room.winner) {
    // 밤 단계로 전환
    room.phase = 'night';
    room.nightPhase = 'doctor'; // 의사부터 시작
    room.day++;
    room.timer = 10; // 의사 10초로 변경
    
    const nightMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: '시스템',
      content: '밤이 되었습니다. 의사가 시민을 살리고 있습니다.',
      timestamp: Date.now(),
      isSystemMessage: true,
    };
    
    room.messages.push(nightMessage);
    
    io.to(roomId).emit('nightStarted', { gameState: room });
    startTimer(roomId);
  }
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});