import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Button, Card } from '../components/styled';
import { useGame } from '../contexts/GameContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { gameCase, startGame } = useGame();

  const handleStartGame = () => {
    startGame();
    navigate('/intro');
  };

  return (
    <Container>
      <Card>
        <Title>추리 게임: {gameCase.title}</Title>
        <Text>
          환영합니다! 이 게임에서 당신은 형사가 되어 사건을 해결하게 됩니다.
          증거를 수집하고, 용의자를 심문하여 범인을 찾아내세요.
        </Text>
        <Text>
          {gameCase.description}
        </Text>
        <Button onClick={handleStartGame}>게임 시작</Button>
      </Card>
    </Container>
  );
};

export default HomePage; 