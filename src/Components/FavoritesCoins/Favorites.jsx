import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CryptoList/CryptoList.css'; // Adjusted path to the CSS file
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';

Chart.register(...registerables);

const Favorites = () => {
  const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favorites')) || []);
  const [cryptos, setCryptos] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            ids: favorites.join(','),
            order: 'market_cap_desc',
            sparkline: true
          }
        });
        setCryptos(response.data);
      } catch (error) {
        console.error('Error fetching favorite cryptos', error);
      }
    };

    if (favorites.length > 0) {
      fetchFavorites();
    }
  }, [favorites]);

  const toggleFavorite = (id) => {
    let updatedFavorites = [...favorites];
    if (updatedFavorites.includes(id)) {
      updatedFavorites = updatedFavorites.filter(fav => fav !== id);
    } else {
      updatedFavorites.push(id);
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  return (
    <div className="crypto-list-container">
      <div className="crypto-list-header">
        <h1>My Favorites</h1>
        <Link to="/" className="favorites-button">Back to List</Link>
      </div>
      <div className="crypto-list">
        <div className="crypto-list-row header-row">
          <span>#</span>
          <span>Favorite</span>
          <span>Name</span>
          <span>Price</span>
          <span>24h Change</span>
          <span>Chart</span>
        </div>
        {cryptos.map((crypto, index) => (
          <div key={crypto.id} className="crypto-card">
            <div className="crypto-list-row">
              <span>{index + 1}</span>
              <span className="favorite-icon" onClick={() => toggleFavorite(crypto.id)}>
                ★
              </span>
              <span>{crypto.name}</span>
              <span>${crypto.current_price}</span>
              <span className={`price-change ${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                {crypto.price_change_percentage_24h.toFixed(2)}%
              </span>
              <span className="crypto-chart-container">
                <Line
                  data={{
                    labels: crypto.sparkline_in_7d.price.map((_, index) => index),
                    datasets: [
                      {
                        data: crypto.sparkline_in_7d.price,
                        borderColor: crypto.price_change_percentage_24h >= 0 ? '#4caf50' : '#f44336',
                        backgroundColor: crypto.price_change_percentage_24h >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        fill: true,
                        pointRadius: 0,
                      }
                    ]
                  }}
                  options={{
                    scales: {
                      x: { display: false },
                      y: { display: false }
                    },
                    elements: {
                      line: { tension: 0.4 }
                    },
                    plugins: {
                      legend: { display: false }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                  className="crypto-chart"
                />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Favorites;
