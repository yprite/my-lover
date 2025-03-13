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

const CharacterPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { getCharacter, gameState } = useGame();
  
  if (!characterId) {
    navigate('/investigation');
    return null;
  }
  
  const character = getCharacter(characterId);
  
  if (!character) {
    navigate('/investigation');
    return null;
  }
  
  const handleBackToInvestigation = () => {
    navigate('/investigation');
  };
  
  // 각 캐릭터별 대화 내용 (실제 게임에서는 더 복잡한 대화 시스템을 구현할 수 있습니다)
  const getDialogue = () => {
    switch (character.id) {
      case 'character-002': // 이지현
        return "저는 그날 밤 김재원 사장님과 회의가 있었어요. 하지만 약속 시간에 도착했을 때 이미 그는... 죽어 있었어요. 너무 충격적이었죠. 사장님은 최근에 회사 일로 스트레스를 많이 받고 계셨어요.";
      case 'character-003': // 박서연
        return "남편과 저는 최근에 사이가 좋지 않았어요. 이혼을 고려하고 있었죠. 하지만 그를 해치고 싶지는 않았어요. 그날 밤 저는 친구와 함께 식사를 하고 있었어요. 여러 사람들이 증인이 될 수 있어요.";
      case 'character-004': // 최준호
        return "김재원과 저는 최근 사업 방향에 대해 의견 차이가 있었지만, 그건 단지 비즈니스적인 문제였을 뿐이에요. 그날 밤 저는 다른 투자자들과 미팅이 있었어요. 그가 죽었다는 소식을 듣고 충격을 받았습니다.";
      case 'character-005': // 김민수
        return "아버지와 저는 사이가 좋지 않았어요. 그는 항상 제가 하는 일에 간섭했죠. 하지만 그렇다고 해서 제가 아버지를 해칠 이유는 없어요. 그날 밤 저는 친구들과 클럽에 있었어요.";
      default:
        return "대화 내용이 없습니다.";
    }
  };
  
  return (
    <Container>
      <Button onClick={handleBackToInvestigation}>← 수사 본부로 돌아가기</Button>
      
      <Card>
        <Title>{character.name}</Title>
        <Text>{character.description}</Text>
      </Card>
      
      <Card>
        <Subtitle>심문 내용</Subtitle>
        <Text>{getDialogue()}</Text>
      </Card>
    </Container>
  );
};

export default CharacterPage; 