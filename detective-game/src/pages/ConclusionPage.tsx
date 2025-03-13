import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Subtitle, 
  Text, 
  Button, 
  Card 
} from '../components/styled';
import { useGame } from '../contexts/GameContext';

const ConclusionPage: React.FC = () => {
  const { result } = useParams<{ result: string }>();
  const navigate = useNavigate();
  const { gameCase, resetGame, getCharacter } = useGame();
  
  const isCorrect = result === 'correct';
  const culprit = gameCase.characters.find(char => char.isCulprit);
  
  const handleRestartGame = () => {
    resetGame();
    navigate('/');
  };
  
  return (
    <Container>
      <Card>
        <Title>{isCorrect ? '축하합니다!' : '아쉽습니다!'}</Title>
        
        {isCorrect ? (
          <>
            <Text>{gameCase.conclusionText}</Text>
            <Subtitle>사건 해결!</Subtitle>
            <Text>
              당신은 성공적으로 사건을 해결했습니다. 
              {culprit && `범인은 ${culprit.name}이었습니다.`}
            </Text>
          </>
        ) : (
          <>
            <Text>
              당신의 추리는 틀렸습니다. 
              {culprit && `진짜 범인은 ${culprit.name}이었습니다.`}
            </Text>
            <Subtitle>사건의 진실</Subtitle>
            <Text>{gameCase.conclusionText}</Text>
          </>
        )}
        
        <Button onClick={handleRestartGame}>다시 시작하기</Button>
      </Card>
    </Container>
  );
};

export default ConclusionPage; 