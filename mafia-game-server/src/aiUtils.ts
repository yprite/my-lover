import { Player, GameState, GamePhase, AIDifficulty, ChatMessage } from './types';

// AI 플레이어 생성 함수
export const createAIPlayer = (
  aiNumber: number, 
  difficulty: AIDifficulty = 'medium',
  isHost: boolean = false
): Player => {
  const aiId = `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    id: aiId,
    name: `AI-${aiNumber}`,
    role: 'spectator',
    isAlive: true,
    isHost,
    isAI: true,
    aiDifficulty: difficulty,
  };
};

// AI 채팅 메시지 생성 함수
export const generateAIChatMessage = (
  aiPlayer: Player, 
  gameState: GameState, 
  phase: GamePhase
): string | null => {
  // AI가 죽었거나 관전자인 경우 메시지를 생성하지 않음
  if (!aiPlayer.isAlive || aiPlayer.role === 'spectator') return null;
  
  // 밤에는 메시지를 생성하지 않음 (마피아 채팅은 별도로 구현)
  if (phase === 'night') return null;
  
  const { aiDifficulty } = aiPlayer;
  const randomFactor = Math.random();
  
  // 난이도에 따라 메시지 생성 확률 조정
  const messageChance = aiDifficulty === 'easy' ? 0.3 : 
                        aiDifficulty === 'medium' ? 0.5 : 0.7;
  
  if (randomFactor > messageChance) return null;
  
  // 기본 메시지 목록
  const genericMessages = [
    '누가 의심스러운가요?',
    '저는 시민입니다!',
    '투표할 시간이 얼마 남지 않았네요.',
    '누구를 의심해야 할지 모르겠어요.',
    '이번 라운드는 조용하네요.',
    '모두 자신의 역할을 말해보세요.',
  ];
  
  // 역할별 메시지 목록
  const roleSpecificMessages: Record<string, string[]> = {
    citizen: [
      '저는 확실히 시민입니다.',
      '마피아를 찾아야 해요!',
      '누가 수상한 행동을 했나요?',
      '서로 협력해서 마피아를 찾아냅시다.',
    ],
    mafia: [
      '저는 시민입니다, 정말로요!',
      '저기 있는 사람이 의심스러워요.',
      '어젯밤에 누가 죽었죠?',
      '우리 모두 침착하게 생각해봅시다.',
      '증거 없이 서로 의심하지 맙시다.',
    ],
    doctor: [
      '저는 시민 편이에요.',
      '마피아를 빨리 찾아야 해요.',
      '누가 가장 의심스러운가요?',
      '어젯밤에 무슨 일이 있었죠?',
    ],
    police: [
      '제가 조사한 결과로는...',
      '증거를 바탕으로 투표합시다.',
      '의심스러운 행동을 주의 깊게 봐야 해요.',
      '누가 말을 너무 많이 하거나 적게 하나요?',
    ],
  };
  
  // 투표 단계에서의 메시지
  const votingMessages = [
    '저는 이 사람이 의심스러워요.',
    '이 사람에게 투표하겠습니다.',
    '이 사람이 마피아 같아요.',
    '이번에는 이 사람을 처형해봅시다.',
  ];
  
  // 난이도에 따른 메시지 선택
  let messages: string[] = [];
  
  if (phase === 'day-voting') {
    messages = votingMessages;
  } else {
    // 쉬운 난이도는 일반 메시지만 사용
    if (aiDifficulty === 'easy') {
      messages = genericMessages;
    } 
    // 중간 난이도는 일반 메시지와 역할별 메시지를 혼합
    else if (aiDifficulty === 'medium') {
      messages = [...genericMessages, ...(roleSpecificMessages[aiPlayer.role] || [])];
    } 
    // 어려운 난이도는 역할별 메시지를 주로 사용하고 상황에 맞는 메시지 추가
    else {
      messages = roleSpecificMessages[aiPlayer.role] || genericMessages;
      
      // 게임 상태에 따른 추가 메시지
      if (gameState.day > 2) {
        messages.push('패턴을 분석해 보면...');
        messages.push('지금까지의 투표를 보면 이 사람이 의심스러워요.');
      }
      
      if (gameState.players.filter(p => !p.isAlive).length > 0) {
        messages.push('죽은 사람들의 역할을 생각해보세요.');
      }
    }
  }
  
  // 랜덤하게 메시지 선택
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};

// AI 투표 대상 선택 함수
export const selectAIVoteTarget = (aiPlayer: Player, gameState: GameState): string | null => {
  const { players, votingResults } = gameState;
  const { aiDifficulty } = aiPlayer;
  
  // 투표 가능한 플레이어 목록 (살아있고, 자신이 아닌 플레이어)
  const votablePlayers = players.filter(p => 
    p.isAlive && p.id !== aiPlayer.id && p.role !== 'spectator'
  );
  
  if (votablePlayers.length === 0) return null;
  
  // 난이도에 따른 투표 전략
  switch (aiDifficulty) {
    // 쉬운 난이도: 완전 랜덤 투표
    case 'easy':
      return votablePlayers[Math.floor(Math.random() * votablePlayers.length)].id;
    
    // 중간 난이도: 다른 사람들의 투표를 약간 참고
    case 'medium': {
      // 다른 사람들의 투표 집계
      const voteCount: Record<string, number> = {};
      Object.values(votingResults).forEach(targetId => {
        if (voteCount[targetId]) {
          voteCount[targetId]++;
        } else {
          voteCount[targetId] = 1;
        }
      });
      
      // 50% 확률로 가장 많은 표를 받은 사람에게 투표, 아니면 랜덤
      if (Math.random() > 0.5) {
        let maxVotes = 0;
        let mostVotedPlayer = null;
        
        for (const [playerId, votes] of Object.entries(voteCount)) {
          if (votes > maxVotes) {
            maxVotes = votes;
            mostVotedPlayer = playerId;
          }
        }
        
        if (mostVotedPlayer && maxVotes > 0) {
          return mostVotedPlayer;
        }
      }
      
      return votablePlayers[Math.floor(Math.random() * votablePlayers.length)].id;
    }
    
    // 어려운 난이도: 역할에 따른 전략적 투표
    case 'hard': {
      // 마피아인 경우: 다른 마피아를 피해서 투표
      if (aiPlayer.role === 'mafia') {
        const nonMafiaPlayers = votablePlayers.filter(p => p.role !== 'mafia');
        
        // 다른 사람들의 투표 집계
        const voteCount: Record<string, number> = {};
        Object.values(votingResults).forEach(targetId => {
          if (voteCount[targetId]) {
            voteCount[targetId]++;
          } else {
            voteCount[targetId] = 1;
          }
        });
        
        // 가장 많은 표를 받은 사람이 마피아가 아니면 그 사람에게 투표
        let maxVotes = 0;
        let mostVotedPlayer = null;
        
        for (const [playerId, votes] of Object.entries(voteCount)) {
          if (votes > maxVotes) {
            const player = players.find(p => p.id === playerId);
            if (player && player.role !== 'mafia') {
              maxVotes = votes;
              mostVotedPlayer = playerId;
            }
          }
        }
        
        if (mostVotedPlayer && maxVotes > 0) {
          return mostVotedPlayer;
        }
        
        // 아니면 랜덤한 비마피아 플레이어에게 투표
        if (nonMafiaPlayers.length > 0) {
          return nonMafiaPlayers[Math.floor(Math.random() * nonMafiaPlayers.length)].id;
        }
      } 
      // 시민 진영인 경우: 의심스러운 행동을 한 플레이어에게 투표
      else {
        // 투표 패턴 분석
        const voteCount: Record<string, number> = {};
        Object.entries(votingResults).forEach(([voterId, targetId]) => {
          const voter = players.find(p => p.id === voterId);
          
          // 마피아가 투표한 사람은 시민일 가능성이 높음
          if (voter && voter.role === 'mafia') {
            // 마피아가 투표한 사람은 덜 의심
            const target = players.find(p => p.id === targetId);
            if (target) {
              voteCount[targetId] = (voteCount[targetId] || 0) - 2;
            }
          } else {
            // 일반 투표는 그대로 집계
            voteCount[targetId] = (voteCount[targetId] || 0) + 1;
          }
        });
        
        // 가장 의심스러운 플레이어 선택
        let maxSuspicion = -999;
        let mostSuspiciousPlayer = null;
        
        votablePlayers.forEach(player => {
          let suspicion = voteCount[player.id] || 0;
          
          // 말을 적게 하는 플레이어는 더 의심
          const playerMessages = gameState.messages.filter(
            m => m.senderId === player.id && !m.isSystemMessage
          ).length;
          
          if (playerMessages < 2) {
            suspicion += 2;
          }
          
          if (suspicion > maxSuspicion) {
            maxSuspicion = suspicion;
            mostSuspiciousPlayer = player.id;
          }
        });
        
        if (mostSuspiciousPlayer) {
          return mostSuspiciousPlayer;
        }
      }
      
      // 기본적으로는 랜덤 투표
      return votablePlayers[Math.floor(Math.random() * votablePlayers.length)].id;
    }
    
    default:
      return votablePlayers[Math.floor(Math.random() * votablePlayers.length)].id;
  }
};

// AI 밤 행동 대상 선택 함수
export const selectAINightActionTarget = (
  aiPlayer: Player, 
  gameState: GameState
): string | null => {
  const { players } = gameState;
  const { aiDifficulty, role } = aiPlayer;
  
  // 행동 가능한 플레이어 목록 (살아있는 플레이어)
  const targetablePlayers = players.filter(p => p.isAlive && p.role !== 'spectator');
  
  if (targetablePlayers.length === 0) return null;
  
  // 역할에 따른 행동 대상 선택
  switch (role) {
    // 마피아: 시민을 죽이는 것이 목표
    case 'mafia': {
      // 난이도에 따른 전략
      switch (aiDifficulty) {
        // 쉬운 난이도: 랜덤 타겟
        case 'easy': {
          const nonMafiaPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id && p.role !== 'mafia');
          if (nonMafiaPlayers.length === 0) return null;
          return nonMafiaPlayers[Math.floor(Math.random() * nonMafiaPlayers.length)].id;
        }
        
        // 중간 난이도: 의사나 경찰을 우선 타겟팅
        case 'medium': {
          const nonMafiaPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id && p.role !== 'mafia');
          if (nonMafiaPlayers.length === 0) return null;
          
          // 50% 확률로 특수 역할 타겟팅
          if (Math.random() > 0.5) {
            const specialRolePlayers = nonMafiaPlayers.filter(
              p => p.role === 'doctor' || p.role === 'police'
            );
            
            if (specialRolePlayers.length > 0) {
              return specialRolePlayers[Math.floor(Math.random() * specialRolePlayers.length)].id;
            }
          }
          
          return nonMafiaPlayers[Math.floor(Math.random() * nonMafiaPlayers.length)].id;
        }
        
        // 어려운 난이도: 의심받는 마피아를 피하고, 위험한 역할 우선 제거
        case 'hard': {
          const nonMafiaPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id && p.role !== 'mafia');
          if (nonMafiaPlayers.length === 0) return null;
          
          // 채팅 분석으로 의심받는 마피아 파악
          const suspectedMafia: Record<string, number> = {};
          gameState.messages.forEach(msg => {
            if (!msg.isSystemMessage && msg.content.includes('마피아') && msg.content.includes('의심')) {
              // 메시지에서 언급된 플레이어 찾기 (간단한 구현)
              players.forEach(p => {
                if (msg.content.includes(p.name) && p.role === 'mafia') {
                  suspectedMafia[p.id] = (suspectedMafia[p.id] || 0) + 1;
                }
              });
            }
          });
          
          // 경찰과 의사 우선 타겟팅
          const priorityTargets = nonMafiaPlayers.filter(p => p.role === 'police' || p.role === 'doctor');
          
          if (priorityTargets.length > 0) {
            // 경찰을 더 우선시
            const police = priorityTargets.find(p => p.role === 'police');
            if (police) return police.id;
            
            return priorityTargets[0].id;
          }
          
          // 아니면 의심받지 않는 일반 시민 타겟팅
          return nonMafiaPlayers[Math.floor(Math.random() * nonMafiaPlayers.length)].id;
        }
        
        default:
          const nonMafiaPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id && p.role !== 'mafia');
          if (nonMafiaPlayers.length === 0) return null;
          return nonMafiaPlayers[Math.floor(Math.random() * nonMafiaPlayers.length)].id;
      }
    }
    
    // 의사: 마피아의 타겟이 될 가능성이 높은 플레이어 보호
    case 'doctor': {
      // 난이도에 따른 전략
      switch (aiDifficulty) {
        // 쉬운 난이도: 랜덤 보호
        case 'easy':
          return targetablePlayers[Math.floor(Math.random() * targetablePlayers.length)].id;
        
        // 중간 난이도: 자신이나 특수 역할 보호
        case 'medium': {
          // 50% 확률로 자신 보호
          if (Math.random() > 0.5) {
            return aiPlayer.id;
          }
          
          // 아니면 특수 역할 보호
          const specialRolePlayers = targetablePlayers.filter(
            p => p.role === 'doctor' || p.role === 'police'
          );
          
          if (specialRolePlayers.length > 0) {
            return specialRolePlayers[Math.floor(Math.random() * specialRolePlayers.length)].id;
          }
          
          return targetablePlayers[Math.floor(Math.random() * targetablePlayers.length)].id;
        }
        
        // 어려운 난이도: 마피아의 타겟이 될 가능성이 높은 플레이어 보호
        case 'hard': {
          // 경찰 우선 보호
          const police = targetablePlayers.find(p => p.role === 'police');
          if (police) return police.id;
          
          // 채팅에서 많이 언급된 플레이어 보호 (마피아 타겟이 될 가능성 높음)
          const mentionCount: Record<string, number> = {};
          gameState.messages.forEach(msg => {
            if (!msg.isSystemMessage) {
              players.forEach(p => {
                if (msg.content.includes(p.name) && p.isAlive && p.id !== aiPlayer.id) {
                  mentionCount[p.id] = (mentionCount[p.id] || 0) + 1;
                }
              });
            }
          });
          
          let maxMentions = 0;
          let mostMentionedPlayer = null;
          
          for (const [playerId, mentions] of Object.entries(mentionCount)) {
            if (mentions > maxMentions) {
              maxMentions = mentions;
              mostMentionedPlayer = playerId;
            }
          }
          
          if (mostMentionedPlayer && maxMentions > 2) {
            return mostMentionedPlayer;
          }
          
          // 아니면 자신 보호
          return aiPlayer.id;
        }
        
        default:
          return targetablePlayers[Math.floor(Math.random() * targetablePlayers.length)].id;
      }
    }
    
    // 경찰: 마피아로 의심되는 플레이어 조사
    case 'police': {
      // 난이도에 따른 전략
      switch (aiDifficulty) {
        // 쉬운 난이도: 랜덤 조사
        case 'easy': {
          const otherPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id);
          if (otherPlayers.length === 0) return null;
          return otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
        }
        
        // 중간 난이도: 아직 조사하지 않은 플레이어 조사
        case 'medium': {
          const otherPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id);
          if (otherPlayers.length === 0) return null;
          
          // 이전에 조사한 플레이어 목록
          const checkedPlayers = new Set<string>();
          for (let day = 1; day < gameState.day; day++) {
            const nightAction = gameState.nightActions;
            if (nightAction.policeCheck.targetId) {
              checkedPlayers.add(nightAction.policeCheck.targetId);
            }
          }
          
          // 아직 조사하지 않은 플레이어 목록
          const uncheckedPlayers = otherPlayers.filter(p => !checkedPlayers.has(p.id));
          
          if (uncheckedPlayers.length > 0) {
            return uncheckedPlayers[Math.floor(Math.random() * uncheckedPlayers.length)].id;
          }
          
          return otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
        }
        
        // 어려운 난이도: 의심스러운 행동을 한 플레이어 조사
        case 'hard': {
          const otherPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id);
          if (otherPlayers.length === 0) return null;
          
          // 이전에 조사한 플레이어 목록
          const checkedPlayers = new Set<string>();
          for (let day = 1; day < gameState.day; day++) {
            const nightAction = gameState.nightActions;
            if (nightAction.policeCheck.targetId) {
              checkedPlayers.add(nightAction.policeCheck.targetId);
            }
          }
          
          // 의심 점수 계산
          const suspicionScore: Record<string, number> = {};
          
          // 채팅 분석
          gameState.messages.forEach(msg => {
            if (!msg.isSystemMessage) {
              // 마피아 관련 발언 분석
              if (msg.content.includes('시민') && msg.content.includes('저는')) {
                const player = players.find(p => p.id === msg.senderId);
                if (player && !checkedPlayers.has(player.id)) {
                  suspicionScore[player.id] = (suspicionScore[player.id] || 0) + 2;
                }
              }
              
              // 다른 플레이어 비난
              otherPlayers.forEach(p => {
                if (msg.content.includes(p.name) && msg.content.includes('의심')) {
                  suspicionScore[p.id] = (suspicionScore[p.id] || 0) + 1;
                }
              });
            }
          });
          
          // 투표 패턴 분석
          Object.entries(gameState.votingResults).forEach(([voterId, targetId]) => {
            const voter = players.find(p => p.id === voterId);
            if (voter && voter.role === 'mafia') {
              // 마피아가 투표한 사람은 시민일 가능성이 높음
              suspicionScore[targetId] = (suspicionScore[targetId] || 0) - 3;
            }
          });
          
          // 가장 의심스러운 플레이어 선택
          let maxSuspicion = -999;
          let mostSuspiciousPlayer = null;
          
          for (const [playerId, suspicion] of Object.entries(suspicionScore)) {
            if (suspicion > maxSuspicion && !checkedPlayers.has(playerId)) {
              const player = players.find(p => p.id === playerId);
              if (player && player.isAlive) {
                maxSuspicion = suspicion;
                mostSuspiciousPlayer = playerId;
              }
            }
          }
          
          if (mostSuspiciousPlayer) {
            return mostSuspiciousPlayer;
          }
          
          // 아직 조사하지 않은 플레이어 중에서 선택
          const uncheckedPlayers = otherPlayers.filter(p => !checkedPlayers.has(p.id));
          
          if (uncheckedPlayers.length > 0) {
            return uncheckedPlayers[Math.floor(Math.random() * uncheckedPlayers.length)].id;
          }
          
          return otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
        }
        
        default: {
          const otherPlayers = targetablePlayers.filter(p => p.id !== aiPlayer.id);
          if (otherPlayers.length === 0) return null;
          return otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
        }
      }
    }
    
    default:
      return null;
  }
}; 