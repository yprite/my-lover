import React from 'react';
import { Player, PlayerRole, AIDifficulty } from '../types';
import { PlayerCard as StyledPlayerCard, Avatar, Text, Badge, FlexRow } from './styled';

interface PlayerCardProps {
  player: Player;
  showRole?: boolean;
  isCurrentPlayer?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  isMafia?: boolean;
  onClick?: () => void;
}

const getRoleColor = (role: PlayerRole): string => {
  switch (role) {
    case 'mafia':
      return '#e74c3c';
    case 'doctor':
      return '#2ecc71';
    case 'police':
      return '#f39c12';
    case 'citizen':
      return '#3498db';
    case 'spectator':
      return '#95a5a6';
    default:
      return '#3498db';
  }
};

const getRoleText = (role: PlayerRole): string => {
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
};

const getAIDifficultyText = (difficulty: AIDifficulty): string => {
  switch (difficulty) {
    case 'easy':
      return '쉬움';
    case 'medium':
      return '보통';
    case 'hard':
      return '어려움';
    default:
      return '보통';
  }
};

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  showRole = false,
  isCurrentPlayer = false,
  isSelectable = false,
  isSelected = false,
  isMafia = false,
  onClick,
}) => {
  const { name, role, isAlive, isHost, isAI, aiDifficulty } = player;
  
  const handleClick = () => {
    if (isSelectable && isAlive && onClick) {
      onClick();
    }
  };
  
  return (
    <StyledPlayerCard 
      isAlive={isAlive} 
      isSelected={isSelected}
      onClick={handleClick}
      style={{ cursor: isSelectable && isAlive ? 'pointer' : 'default' }}
    >
      <Avatar bgColor={getRoleColor(showRole || isMafia ? role : 'spectator')}>
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <div>
        <Text style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          {name} {isCurrentPlayer && '(나)'} {isMafia && '🔍'}
        </Text>
        <FlexRow>
          {isHost && <Badge variant="warning">방장</Badge>}
          {!isAlive && <Badge variant="danger">사망</Badge>}
          {showRole && <Badge variant="primary">{getRoleText(role)}</Badge>}
          {isMafia && !showRole && <Badge variant="danger">마피아</Badge>}
          {isAI && <Badge variant="secondary">AI {aiDifficulty && `(${getAIDifficultyText(aiDifficulty)})`}</Badge>}
        </FlexRow>
      </div>
    </StyledPlayerCard>
  );
};

export default PlayerCard; 