import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Subtitle, 
  Text, 
  Button, 
  Card, 
  Grid, 
  FlexRow, 
  TextArea,
  Select,
  Divider
} from '../components/styled';
import { useGame } from '../contexts/GameContext';

const InvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    gameCase, 
    gameState, 
    visitLocation, 
    interviewCharacter, 
    updateGameStage,
    updatePlayerNotes,
    makeAccusation,
    getRevealedClues
  } = useGame();
  
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  
  const handleLocationClick = (locationId: string) => {
    visitLocation(locationId);
    navigate(`/location/${locationId}`);
  };
  
  const handleCharacterClick = (characterId: string) => {
    interviewCharacter(characterId);
    navigate(`/character/${characterId}`);
  };
  
  const handleAccusation = () => {
    if (!selectedCharacter) return;
    
    const isCorrect = makeAccusation(selectedCharacter);
    navigate(isCorrect ? '/conclusion/correct' : '/conclusion/incorrect');
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updatePlayerNotes(e.target.value);
  };

  return (
    <Container>
      <Title>수사 본부</Title>
      
      <Card>
        <Subtitle>장소</Subtitle>
        <Text>조사할 장소를 선택하세요:</Text>
        <Grid>
          {gameCase.locations.map(location => (
            <Card key={location.id}>
              <Subtitle>{location.name}</Subtitle>
              <Text>{location.description}</Text>
              <Button onClick={() => handleLocationClick(location.id)}>
                {gameState.visitedLocations.includes(location.id) ? '재방문' : '방문'}
              </Button>
            </Card>
          ))}
        </Grid>
      </Card>
      
      <Card>
        <Subtitle>용의자</Subtitle>
        <Text>심문할 인물을 선택하세요:</Text>
        <Grid>
          {gameCase.characters.filter(char => !char.isVictim).map(character => (
            <Card key={character.id}>
              <Subtitle>{character.name}</Subtitle>
              <Text>{character.description}</Text>
              <Button onClick={() => handleCharacterClick(character.id)}>
                {gameState.interviewedCharacters.includes(character.id) ? '재심문' : '심문'}
              </Button>
            </Card>
          ))}
        </Grid>
      </Card>
      
      <Card>
        <Subtitle>수집한 증거</Subtitle>
        {getRevealedClues().length > 0 ? (
          <Grid>
            {getRevealedClues().map(clue => (
              <Card key={clue.id}>
                <Subtitle>{clue.title}</Subtitle>
                <Text>{clue.description}</Text>
              </Card>
            ))}
          </Grid>
        ) : (
          <Text>아직 수집한 증거가 없습니다.</Text>
        )}
      </Card>
      
      <Card>
        <Subtitle>메모장</Subtitle>
        <TextArea 
          value={gameState.playerNotes} 
          onChange={handleNotesChange}
          placeholder="수사 중 발견한 단서나 생각을 메모하세요..."
        />
      </Card>
      
      <Divider />
      
      <Card>
        <Subtitle>범인 지목</Subtitle>
        <Text>충분한 증거를 수집했다면, 범인을 지목하세요:</Text>
        <FlexRow>
          <Select 
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
          >
            <option value="">범인 선택...</option>
            {gameCase.characters.filter(char => !char.isVictim).map(character => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </Select>
          <Button 
            onClick={handleAccusation}
            disabled={!selectedCharacter}
          >
            범인 지목하기
          </Button>
        </FlexRow>
      </Card>
    </Container>
  );
};

export default InvestigationPage; 