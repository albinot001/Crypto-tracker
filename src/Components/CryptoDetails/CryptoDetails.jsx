import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CryptoDetails.css';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const CryptoDetails = () => {
  const { id } = useParams();
  const [crypto, setCrypto] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cryptoResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`);
        console.log('Crypto data:', cryptoResponse.data);
        setCrypto(cryptoResponse.data);

        const chartResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
          params: { vs_currency: 'usd', days: '30' }
        });
        console.log('Chart data:', chartResponse.data);

        const prices = chartResponse.data.prices;
        setChartData({
          labels: prices.map(price => new Date(price[0]).toLocaleDateString()),
          datasets: [
            {
              data: prices.map(price => price[1]),
              borderColor: cryptoResponse.data.market_data.price_change_percentage_24h >= 0 ? '#4caf50' : '#f44336',
              backgroundColor: cryptoResponse.data.market_data.price_change_percentage_24h >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
              fill: true,
              pointRadius: 0,
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchData();
  }, [id]);

  if (!crypto) return <div>Loading...</div>;

  return (
    <div className="crypto-details">
      <h1>{crypto.name}</h1>
      <div className="price-section">
        <h2>Current Price: {crypto.market_data.current_price.usd} USD</h2>
        {chartData ? <Line data={chartData} /> : <div>Loading chart...</div>}
      </div>
      <div className="market-data">
        <h2>Market Data</h2>
        <p>Market Cap: {crypto.market_data.market_cap.usd} USD</p>
        <p>24h Volume: {crypto.market_data.total_volume.usd} USD</p>
        <p>Circulating Supply: {crypto.market_data.circulating_supply}</p>
      </div>
      <div className="description">
        <h2>Description</h2>
        <p dangerouslySetInnerHTML={{ __html: crypto.description.en }}></p>
      </div>
    </div>
  );
}

export default CryptoDetails;
