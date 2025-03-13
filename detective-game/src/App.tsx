import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import HomePage from './pages/HomePage';
import IntroPage from './pages/IntroPage';
import InvestigationPage from './pages/InvestigationPage';
import LocationPage from './pages/LocationPage';
import CharacterPage from './pages/CharacterPage';
import ConclusionPage from './pages/ConclusionPage';
import './App.css';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/intro" element={<IntroPage />} />
            <Route path="/investigation" element={<InvestigationPage />} />
            <Route path="/location/:locationId" element={<LocationPage />} />
            <Route path="/character/:characterId" element={<CharacterPage />} />
            <Route path="/conclusion/:result" element={<ConclusionPage />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
