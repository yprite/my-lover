import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameState, GameCase, Character, Clue, Location } from '../types';
import { sampleCase } from '../data/sampleCase';

interface GameContextType {
  gameCase: GameCase;
  gameState: GameState;
  startGame: () => void;
  revealClue: (clueId: string) => void;
  visitLocation: (locationId: string) => void;
  interviewCharacter: (characterId: string) => void;
  updateGameStage: (stage: GameState['gameStage']) => void;
  updatePlayerNotes: (notes: string) => void;
  resetGame: () => void;
  makeAccusation: (characterId: string) => boolean;
  getCharacter: (characterId: string) => Character | undefined;
  getClue: (clueId: string) => Clue | undefined;
  getLocation: (locationId: string) => Location | undefined;
  getRevealedClues: () => Clue[];
}

const initialGameState: GameState = {
  currentScene: '',
  revealedClues: [],
  visitedLocations: [],
  interviewedCharacters: [],
  gameStage: 'intro',
  playerNotes: '',
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameCase, setGameCase] = useState<GameCase>(sampleCase);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const startGame = () => {
    setGameState({
      ...initialGameState,
      currentScene: 'intro',
      gameStage: 'intro',
    });
  };

  const revealClue = (clueId: string) => {
    if (!gameState.revealedClues.includes(clueId)) {
      setGameState({
        ...gameState,
        revealedClues: [...gameState.revealedClues, clueId],
      });
    }
  };

  const visitLocation = (locationId: string) => {
    if (!gameState.visitedLocations.includes(locationId)) {
      setGameState({
        ...gameState,
        visitedLocations: [...gameState.visitedLocations, locationId],
        currentScene: `location-${locationId}`,
      });
    } else {
      setGameState({
        ...gameState,
        currentScene: `location-${locationId}`,
      });
    }
  };

  const interviewCharacter = (characterId: string) => {
    if (!gameState.interviewedCharacters.includes(characterId)) {
      setGameState({
        ...gameState,
        interviewedCharacters: [...gameState.interviewedCharacters, characterId],
        currentScene: `character-${characterId}`,
      });
    } else {
      setGameState({
        ...gameState,
        currentScene: `character-${characterId}`,
      });
    }
  };

  const updateGameStage = (stage: GameState['gameStage']) => {
    setGameState({
      ...gameState,
      gameStage: stage,
    });
  };

  const updatePlayerNotes = (notes: string) => {
    setGameState({
      ...gameState,
      playerNotes: notes,
    });
  };

  const resetGame = () => {
    setGameState(initialGameState);
  };

  const makeAccusation = (characterId: string): boolean => {
    const isCorrect = characterId === gameCase.solution;
    setGameState({
      ...gameState,
      gameStage: 'conclusion',
    });
    return isCorrect;
  };

  const getCharacter = (characterId: string): Character | undefined => {
    return gameCase.characters.find(character => character.id === characterId);
  };

  const getClue = (clueId: string): Clue | undefined => {
    return gameCase.clues.find(clue => clue.id === clueId);
  };

  const getLocation = (locationId: string): Location | undefined => {
    return gameCase.locations.find(location => location.id === locationId);
  };

  const getRevealedClues = (): Clue[] => {
    return gameCase.clues.filter(clue => gameState.revealedClues.includes(clue.id));
  };

  return (
    <GameContext.Provider
      value={{
        gameCase,
        gameState,
        startGame,
        revealClue,
        visitLocation,
        interviewCharacter,
        updateGameStage,
        updatePlayerNotes,
        resetGame,
        makeAccusation,
        getCharacter,
        getClue,
        getLocation,
        getRevealedClues,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 