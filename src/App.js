import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CryptoList from './Components/CryptoList/CryptoList';
import CryptoDetails from './Components/CryptoDetails/CryptoDetails';
import Favorites from './Components/FavoritesCoins/Favorites';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<CryptoList />} />
          <Route path="/crypto/:id" element={<CryptoDetails />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
