import React from 'react';
import { PlayerRole } from '../types';
import { RoleCard as StyledRoleCard, Text, Subtitle } from './styled';

interface RoleCardProps {
  role: PlayerRole;
  description: string;
}

const getRoleName = (role: PlayerRole): string => {
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

const RoleCard: React.FC<RoleCardProps> = ({ role, description }) => {
  return (
    <StyledRoleCard roleType={role}>
      <Subtitle style={{ color: 'white' }}>{getRoleName(role)}</Subtitle>
      <Text style={{ color: 'white' }}>{description}</Text>
    </StyledRoleCard>
  );
};

export default RoleCard; 