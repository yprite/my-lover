import React from 'react';
import { Timer, Text } from './styled';

interface GameTimerProps {
  seconds: number | null;
  phase: string;
}

const GameTimer: React.FC<GameTimerProps> = ({ seconds, phase }) => {
  if (seconds === null) {
    return null;
  }
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const getPhaseText = (phase: string): string => {
    switch (phase) {
      case 'night':
        return '밤 시간';
      case 'day-discussion':
        return '낮 토론 시간';
      case 'day-voting':
        return '투표 시간';
      default:
        return '';
    }
  };
  
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <Text>{getPhaseText(phase)}</Text>
      <Timer>{formatTime(seconds)}</Timer>
    </div>
  );
};

export default GameTimer; 