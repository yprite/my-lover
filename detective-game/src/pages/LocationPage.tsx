import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Subtitle, 
  Text, 
  Button, 
  Card, 
  Grid 
} from '../components/styled';
import { useGame } from '../contexts/GameContext';

const LocationPage: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { getLocation, gameCase, revealClue, getClue } = useGame();
  
  if (!locationId) {
    navigate('/investigation');
    return null;
  }
  
  const location = getLocation(locationId);
  
  if (!location) {
    navigate('/investigation');
    return null;
  }
  
  const handleInvestigateClue = (clueId: string) => {
    revealClue(clueId);
  };
  
  const handleBackToInvestigation = () => {
    navigate('/investigation');
  };
  
  return (
    <Container>
      <Button onClick={handleBackToInvestigation}>← 수사 본부로 돌아가기</Button>
      
      <Card>
        <Title>{location.name}</Title>
        <Text>{location.description}</Text>
      </Card>
      
      <Subtitle>이 장소에서 발견할 수 있는 단서</Subtitle>
      
      <Grid>
        {location.clues.map(clueId => {
          const clue = getClue(clueId);
          if (!clue) return null;
          
          return (
            <Card key={clue.id}>
              <Subtitle>{clue.title}</Subtitle>
              <Text>{clue.description}</Text>
              <Button onClick={() => handleInvestigateClue(clue.id)}>
                단서 수집
              </Button>
            </Card>
          );
        })}
      </Grid>
    </Container>
  );
};

export default LocationPage; 