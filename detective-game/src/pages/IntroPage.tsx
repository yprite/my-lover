import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Button, Card } from '../components/styled';
import { useGame } from '../contexts/GameContext';

const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameCase, updateGameStage } = useGame();

  const handleStartInvestigation = () => {
    updateGameStage('investigation');
    navigate('/investigation');
  };

  return (
    <Container>
      <Card>
        <Title>사건 개요</Title>
        <Text>{gameCase.introText}</Text>
        <Button onClick={handleStartInvestigation}>수사 시작</Button>
      </Card>
    </Container>
  );
};

export default IntroPage; 