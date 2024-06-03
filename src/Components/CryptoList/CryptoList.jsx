import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CryptoList.css';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';
import { FaSearch, FaStar } from 'react-icons/fa';

Chart.register(...registerables);

const CryptoList = () => {
  const [cryptos, setCryptos] = useState([]);
  const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favorites')) || []);
  const [search, setSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: true
          }
        });
        setCryptos(response.data);

        // Set up WebSocket for real-time updates
        const socket = new WebSocket('wss://ws-feed.pro.coinbase.com');

        socket.onopen = () => {
          const subscribeMessage = {
            type: 'subscribe',
            channels: [
              {
                name: 'ticker',
                product_ids: response.data.map(crypto => `${crypto.symbol.toUpperCase()}-USD`)
              }
            ]
          };
          socket.send(JSON.stringify(subscribeMessage));
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'ticker') {
            setCryptos(prevCryptos =>
              prevCryptos.map(crypto =>
                crypto.symbol.toUpperCase() === data.product_id.split('-')[0]
                  ? { ...crypto, current_price: data.price }
                  : crypto
              )
            );
          }
        };

        return () => socket.close();
      } catch (error) {
        console.error('Error fetching cryptos', error);
      }
    };

    fetchCryptos();
  }, []);

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

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    if (search === '') {
      setIsSearchExpanded(false);
    }
  };

  const handleFavoritesMouseEnter = () => {
    setIsFavoritesExpanded(true);
  };

  const handleFavoritesMouseLeave = () => {
    setIsFavoritesExpanded(false);
  };

  const sortCryptos = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCryptos = cryptos.sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredCryptos = sortedCryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(search.toLowerCase()) || crypto.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="crypto-list-container">
      <div className="crypto-list-header">
        <h1>Crypto Tracker</h1>
        <div className="header-buttons">
          <div className={`search-container ${isSearchExpanded ? 'expanded' : ''}`}>
            {!isSearchExpanded && (
              <FaSearch className="search-icon" onClick={handleSearchClick} />
            )}
            <input
              type="text"
              placeholder="Search for a coin..."
              value={search}
              onChange={handleSearchChange}
              onFocus={handleSearchClick}
              onBlur={handleSearchBlur}
              className={`search-bar ${isSearchExpanded ? 'expanded' : ''}`}
            />
          </div>
          <div
            className={`favorites-container ${isFavoritesExpanded ? 'expanded' : ''}`}
            onMouseEnter={handleFavoritesMouseEnter}
            onMouseLeave={handleFavoritesMouseLeave}
          >
            <Link to="/favorites" className="favorites-link">
              <FaStar className="favorites-icon" />
            </Link>
            {isFavoritesExpanded && <span className="favorites-tooltip">My Favorites</span>}
          </div>
        </div>
      </div>
      <div className="crypto-list">
        <div className="crypto-list-row header-row">
          <span>#</span>
          <span>Favorite</span>
          <span onClick={() => sortCryptos('name')}>Name</span>
          <span onClick={() => sortCryptos('current_price')}>
            Price {sortConfig.key === 'current_price' && (sortConfig.direction === 'asc' ? '↓' : '↑')}
          </span>
          <span onClick={() => sortCryptos('price_change_percentage_24h')}>
            24h Change {sortConfig.key === 'price_change_percentage_24h' && (sortConfig.direction === 'asc' ? '↓' : '↑')}
          </span>
          <span>Chart</span>
        </div>
        {filteredCryptos.map((crypto, index) => (
          <Link key={crypto.id} to={`/crypto/${crypto.id}`} className="crypto-card">
            <div className="crypto-list-row">
              <span>{index + 1}</span>
              <span onClick={() => toggleFavorite(crypto.id)} className="favorite-icon">
                {favorites.includes(crypto.id) ? '★' : '☆'}
              </span>
              <span>
                <img src={crypto.image} alt={crypto.name} className="crypto-icon" />
                {crypto.name}
              </span>
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
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CryptoList;
