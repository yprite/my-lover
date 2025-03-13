export interface Character {
  id: string;
  name: string;
  description: string;
  image?: string;
  isVictim?: boolean;
  isCulprit?: boolean;
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  image?: string;
  relatedTo: string[]; // Character IDs or location IDs
  isRevealed: boolean;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  image?: string;
  clues: string[]; // Clue IDs
}

export interface GameState {
  currentScene: string;
  revealedClues: string[];
  visitedLocations: string[];
  interviewedCharacters: string[];
  gameStage: 'intro' | 'investigation' | 'accusation' | 'conclusion';
  playerNotes: string;
}

export interface GameCase {
  id: string;
  title: string;
  description: string;
  characters: Character[];
  locations: Location[];
  clues: Clue[];
  solution: string;
  introText: string;
  conclusionText: string;
} 