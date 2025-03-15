import { Player, PlayerRole, GameState, AIDifficulty } from '../types';

// AI가 채팅 메시지를 생성하는 함수
export const generateAIChatMessage = (
  player: Player,
  gameState: GameState,
  phase: string
): string | null => {
  // AI가 죽었거나 밤에는 채팅하지 않음 (마피아 제외)
  if (!player.isAlive || (phase === 'night' && player.role !== 'mafia')) {
    return null;
  }

  const { aiDifficulty = 'medium', role } = player;
  const alivePlayerCount = gameState.players.filter(p => p.isAlive).length;
  
  // 기본 메시지 풀
  const basicMessages = [
    '안녕하세요!',
    '누가 의심스러운가요?',
    '저는 시민입니다.',
    '조용한 사람이 의심스럽네요.',
    '투표할 시간이 다가오고 있어요.',
    '증거가 있나요?',
    '누구를 의심하시나요?',
    '저를 믿어주세요.',
  ];
  
  // 역할별 메시지
  const roleSpecificMessages: Record<PlayerRole, string[]> = {
    citizen: [
      '저는 확실히 시민입니다.',
      '마피아를 찾아야 해요.',
      '누가 수상한 행동을 했나요?',
    ],
    mafia: [
      '저는 시민입니다, 정말로요!',
      '저기 있는 사람이 의심스러워요.',
      '우리 모두 침착하게 생각해봐요.',
      '증거 없이 의심하지 맙시다.',
    ],
    doctor: [
      '저는 중요한 역할을 맡고 있어요.',
      '서로 협력해야 합니다.',
      '누가 마피아처럼 행동하고 있나요?',
    ],
    police: [
      '제가 조사한 결과가 있어요.',
      '증거를 바탕으로 판단합시다.',
      '의심스러운 행동을 주시하고 있어요.',
    ],
    spectator: [
      '게임을 지켜보고 있어요.',
      '재미있는 게임이네요.',
    ],
  };
  
  // 난이도별 전략적 메시지
  const strategicMessages: Record<AIDifficulty, Record<PlayerRole, string[]>> = {
    easy: {
      citizen: ['누가 마피아인 것 같아요?', '저는 시민이에요.'],
      mafia: ['저는 시민이에요.', '누가 마피아일까요?'],
      doctor: ['누구를 살려야 할까요?', '저는 의사가 아니에요.'],
      police: ['누가 마피아인지 모르겠어요.', '저는 경찰이 아니에요.'],
      spectator: ['관전 중입니다.'],
    },
    medium: {
      citizen: [
        '투표하기 전에 잘 생각해봐요.',
        '마피아는 침착한 척 하는 경우가 많아요.',
        '행동 패턴을 잘 관찰해보세요.',
      ],
      mafia: [
        '저 사람이 의심스러워요. 너무 조용해요.',
        '우리 모두 차분하게 생각해봐요.',
        '증거 없이 서로 의심하면 시민만 손해예요.',
      ],
      doctor: [
        '마피아를 찾는 것이 중요해요.',
        '서로 역할을 밝히는 것은 위험할 수 있어요.',
        '누가 가장 의심스러운가요?',
      ],
      police: [
        '제 직감으로는 저 사람이 의심스러워요.',
        '행동을 잘 관찰해보세요.',
        '마피아는 보통 남을 빨리 의심해요.',
      ],
      spectator: ['흥미로운 게임이네요.'],
    },
    hard: {
      citizen: [
        '마피아는 보통 다른 사람에게 의심을 돌리려고 해요.',
        '투표 패턴을 잘 살펴보세요. 마피아는 서로 투표하지 않아요.',
        '너무 적극적으로 누군가를 지목하는 사람도 의심해봐야 해요.',
      ],
      mafia: [
        '저 사람이 계속 침묵하는 게 의심스러워요.',
        '우리는 논리적으로 접근해야 해요. 감정적으로 판단하면 안 돼요.',
        '시민인 척 하는 마피아를 조심하세요.',
        '저는 시민이니 믿어주세요. 함께 마피아를 찾아요.',
      ],
      doctor: [
        '마피아를 찾는 것이 우선이에요.',
        '역할을 밝히는 것은 위험할 수 있어요. 마피아가 타겟으로 삼을 수 있어요.',
        '행동 패턴을 잘 관찰하면 마피아를 찾을 수 있어요.',
      ],
      police: [
        '저는 중요한 정보를 가지고 있어요.',
        '마피아는 보통 자신을 방어하려고 다른 사람을 공격해요.',
        '투표 전에 모든 가능성을 고려해보세요.',
      ],
      spectator: ['흥미로운 전개네요.'],
    },
  };
  
  // 메시지 선택 로직
  let messagePool: string[] = [];
  
  // 기본 메시지 추가
  messagePool = messagePool.concat(basicMessages);
  
  // 역할별 메시지 추가
  messagePool = messagePool.concat(roleSpecificMessages[role]);
  
  // 난이도별 전략적 메시지 추가
  messagePool = messagePool.concat(strategicMessages[aiDifficulty][role]);
  
  // 게임 상황에 따른 특별 메시지
  if (phase === 'day-voting') {
    messagePool.push('신중하게 투표해야 해요.');
    messagePool.push('증거를 바탕으로 투표합시다.');
  }
  
  if (alivePlayerCount <= 4) {
    messagePool.push('이제 얼마 남지 않았어요.');
    messagePool.push('신중하게 결정해야 해요.');
  }
  
  // 랜덤하게 메시지 선택
  const randomIndex = Math.floor(Math.random() * messagePool.length);
  return messagePool[randomIndex];
};

// AI가 밤에 행동할 대상을 선택하는 함수
export const selectAINightActionTarget = (
  player: Player,
  gameState: GameState
): string | null => {
  const { aiDifficulty = 'medium', role } = player;
  const alivePlayers = gameState.players.filter(p => p.isAlive && p.id !== player.id);
  
  if (alivePlayers.length === 0) return null;
  
  // 쉬운 난이도: 랜덤 선택
  if (aiDifficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * alivePlayers.length);
    return alivePlayers[randomIndex].id;
  }
  
  // 중간 난이도: 약간의 전략
  if (aiDifficulty === 'medium') {
    if (role === 'mafia') {
      // 의사나 경찰 역할을 가진 플레이어를 우선 타겟팅
      const priorityTargets = alivePlayers.filter(p => 
        p.role === 'doctor' || p.role === 'police'
      );
      
      if (priorityTargets.length > 0) {
        const randomIndex = Math.floor(Math.random() * priorityTargets.length);
        return priorityTargets[randomIndex].id;
      }
    }
    
    if (role === 'doctor') {
      // 자신이나 의심받는 플레이어를 보호
      const potentialTargets = [
        ...alivePlayers,
        player // 자기 자신도 포함
      ];
      const randomIndex = Math.floor(Math.random() * potentialTargets.length);
      return potentialTargets[randomIndex].id;
    }
    
    if (role === 'police') {
      // 의심스러운 플레이어 조사
      const notCheckedPlayers = alivePlayers.filter(p => {
        const previousChecks = gameState.nightActions.policeCheck;
        return previousChecks.targetId !== p.id;
      });
      
      if (notCheckedPlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * notCheckedPlayers.length);
        return notCheckedPlayers[randomIndex].id;
      }
    }
  }
  
  // 어려운 난이도: 고급 전략
  if (aiDifficulty === 'hard') {
    if (role === 'mafia') {
      // 의사나 경찰 역할을 가진 플레이어를 우선 타겟팅
      // 또는 가장 의심받는 플레이어를 타겟팅
      const priorityTargets = alivePlayers.filter(p => 
        p.role === 'doctor' || p.role === 'police'
      );
      
      if (priorityTargets.length > 0) {
        const randomIndex = Math.floor(Math.random() * priorityTargets.length);
        return priorityTargets[randomIndex].id;
      }
      
      // 투표 패턴 분석
      const voteCounts: Record<string, number> = {};
      Object.values(gameState.votingResults).forEach(votedId => {
        if (voteCounts[votedId]) {
          voteCounts[votedId]++;
        } else {
          voteCounts[votedId] = 1;
        }
      });
      
      // 가장 많은 표를 받은 플레이어 찾기
      let maxVotes = 0;
      let mostVotedPlayer: string | null = null;
      
      for (const [playerId, voteCount] of Object.entries(voteCounts)) {
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          mostVotedPlayer = playerId;
        }
      }
      
      if (mostVotedPlayer) {
        const player = alivePlayers.find(p => p.id === mostVotedPlayer);
        if (player && player.role !== 'mafia') {
          return mostVotedPlayer;
        }
      }
    }
    
    if (role === 'doctor') {
      // 자신이나 가장 중요한 플레이어를 보호
      // 마피아가 아닌 것으로 확인된 플레이어 우선 보호
      const potentialTargets = [
        player, // 자기 자신
        ...alivePlayers.filter(p => p.role !== 'mafia')
      ];
      
      const randomIndex = Math.floor(Math.random() * potentialTargets.length);
      return potentialTargets[randomIndex].id;
    }
    
    if (role === 'police') {
      // 아직 조사하지 않은 가장 의심스러운 플레이어 조사
      const notCheckedPlayers = alivePlayers.filter(p => {
        const previousChecks = gameState.nightActions.policeCheck;
        return previousChecks.targetId !== p.id;
      });
      
      if (notCheckedPlayers.length > 0) {
        // 가장 조용한 플레이어나 의심스러운 행동을 한 플레이어 조사
        const randomIndex = Math.floor(Math.random() * notCheckedPlayers.length);
        return notCheckedPlayers[randomIndex].id;
      }
    }
  }
  
  // 기본 랜덤 선택
  const randomIndex = Math.floor(Math.random() * alivePlayers.length);
  return alivePlayers[randomIndex].id;
};

// AI가 투표할 대상을 선택하는 함수
export const selectAIVoteTarget = (
  player: Player,
  gameState: GameState
): string | null => {
  const { aiDifficulty = 'medium', role } = player;
  const alivePlayers = gameState.players.filter(p => p.isAlive && p.id !== player.id);
  
  if (alivePlayers.length === 0) return null;
  
  // 쉬운 난이도: 랜덤 선택
  if (aiDifficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * alivePlayers.length);
    return alivePlayers[randomIndex].id;
  }
  
  // 중간 난이도: 약간의 전략
  if (aiDifficulty === 'medium') {
    if (role === 'mafia') {
      // 마피아가 아닌 플레이어에게 투표
      const nonMafiaPlayers = alivePlayers.filter(p => p.role !== 'mafia');
      
      if (nonMafiaPlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * nonMafiaPlayers.length);
        return nonMafiaPlayers[randomIndex].id;
      }
    } else {
      // 마피아가 아닌 역할은 의심스러운 플레이어에게 투표
      // 간단한 휴리스틱: 가장 적게 말한 플레이어가 의심스러움
      const playerMessageCounts: Record<string, number> = {};
      
      gameState.messages.forEach(msg => {
        if (!msg.isSystemMessage) {
          if (playerMessageCounts[msg.senderId]) {
            playerMessageCounts[msg.senderId]++;
          } else {
            playerMessageCounts[msg.senderId] = 1;
          }
        }
      });
      
      // 메시지 수가 적은 순서로 정렬
      const sortedPlayers = [...alivePlayers].sort((a, b) => {
        const countA = playerMessageCounts[a.id] || 0;
        const countB = playerMessageCounts[b.id] || 0;
        return countA - countB;
      });
      
      if (sortedPlayers.length > 0) {
        return sortedPlayers[0].id;
      }
    }
  }
  
  // 어려운 난이도: 고급 전략
  if (aiDifficulty === 'hard') {
    if (role === 'mafia') {
      // 마피아는 의사나 경찰을 우선적으로 제거하려고 함
      const priorityTargets = alivePlayers.filter(p => 
        p.role === 'doctor' || p.role === 'police'
      );
      
      if (priorityTargets.length > 0) {
        const randomIndex = Math.floor(Math.random() * priorityTargets.length);
        return priorityTargets[randomIndex].id;
      }
      
      // 다른 마피아에게 투표하지 않음
      const nonMafiaPlayers = alivePlayers.filter(p => p.role !== 'mafia');
      
      if (nonMafiaPlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * nonMafiaPlayers.length);
        return nonMafiaPlayers[randomIndex].id;
      }
    } else {
      // 마피아가 아닌 역할은 투표 패턴과 채팅 분석을 통해 마피아 추정
      // 투표 패턴 분석
      const voteCounts: Record<string, number> = {};
      Object.values(gameState.votingResults).forEach(votedId => {
        if (voteCounts[votedId]) {
          voteCounts[votedId]++;
        } else {
          voteCounts[votedId] = 1;
        }
      });
      
      // 마피아로 확인된 플레이어가 있으면 우선 투표
      if (role === 'police' && gameState.nightActions.policeCheck.result) {
        const mafiaId = gameState.nightActions.policeCheck.targetId;
        const mafiaPlayer = alivePlayers.find(p => p.id === mafiaId);
        
        if (mafiaPlayer && mafiaPlayer.isAlive) {
          return mafiaId;
        }
      }
      
      // 의심스러운 행동을 한 플레이어에게 투표
      // 예: 다른 사람을 빠르게 의심하는 플레이어
      const playerMessageCounts: Record<string, number> = {};
      
      gameState.messages.forEach(msg => {
        if (!msg.isSystemMessage) {
          if (playerMessageCounts[msg.senderId]) {
            playerMessageCounts[msg.senderId]++;
          } else {
            playerMessageCounts[msg.senderId] = 1;
          }
        }
      });
      
      // 메시지 수와 투표 패턴을 고려하여 의심도 계산
      const suspicionScores: Record<string, number> = {};
      
      alivePlayers.forEach(p => {
        let score = 0;
        
        // 메시지가 너무 적거나 너무 많으면 의심
        const messageCount = playerMessageCounts[p.id] || 0;
        if (messageCount < 3) score += 2;
        if (messageCount > 10) score += 1;
        
        // 투표를 많이 받은 플레이어는 의심
        score += voteCounts[p.id] || 0;
        
        suspicionScores[p.id] = score;
      });
      
      // 의심도가 높은 순서로 정렬
      const sortedByScore = [...alivePlayers].sort((a, b) => {
        return (suspicionScores[b.id] || 0) - (suspicionScores[a.id] || 0);
      });
      
      if (sortedByScore.length > 0) {
        return sortedByScore[0].id;
      }
    }
  }
  
  // 기본 랜덤 선택
  const randomIndex = Math.floor(Math.random() * alivePlayers.length);
  return alivePlayers[randomIndex].id;
};

// AI 플레이어 생성 함수
export const createAIPlayer = (
  aiNumber: number,
  difficulty: AIDifficulty = 'medium'
): Player => {
  const aiNames = [
    '인공지능', '로봇', '컴퓨터', 'AI', '봇',
    '알파', '베타', '감마', '델타', '오메가',
    '스카이넷', '할', '자비스', '울트론', '소노스',
    '아톰', '이브', '월-E', '바이센테니얼', '데이터'
  ];
  
  const randomNameIndex = Math.floor(Math.random() * aiNames.length);
  const aiName = `${aiNames[randomNameIndex]}-${aiNumber}`;
  
  return {
    id: `ai-${Date.now()}-${aiNumber}`,
    name: aiName,
    role: 'spectator', // 초기 역할은 관전자, 게임 시작 시 변경됨
    isAlive: true,
    isHost: false,
    isAI: true,
    aiDifficulty: difficulty
  };
}; 