const express = require('express');
const axios = require('axios');
const pgp = require('pg-promise')();
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL database configuration
const dbConfig = {
  host: 'localhost',
  port: '0',
  database: 'hodlinfo',
  user: 'root',
  password: '',
};

const db = pgp(dbConfig);
// Fetch data from WazirX API
async function fetchWazirXData() {
  try {
    const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
    return response.data;
  } catch (error) {
    console.error('Error fetching data from WazirX API:', error.message);
    throw error;
  }
}

// Store data in the PostgreSQL database
async function storeDataInDatabase(data) {
  try {
    const insertQueries = data.map((ticker) => {
      return db.none(
        'INSERT INTO tickers(name, last, buy, sell, volume, base_unit) VALUES($1, $2, $3, $4, $5, $6)',
        [ticker.symbol, ticker.last, ticker.buy, ticker.sell, ticker.volume, ticker.baseAsset]
      );
    });

    await Promise.all(insertQueries);
    console.log('Data stored in the database successfully');
  } catch (error) {
    console.error('Error storing data in the database:', error.message);
    throw error;
  }
}

// Express route to fetch and store data
app.get('/fetch-and-store-data', async (req, res) => {
  try {
    const wazirXData = await fetchWazirXData();
    await storeDataInDatabase(wazirXData.slice(0, 10)); // Assuming you want to store the top 10 results

    res.status(200).json({ success: true, message: 'Data fetched and stored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Express route to fetch and display data
app.get('/fetch-and-display-data', async (req, res) => {
  try {
    const data = await db.any('SELECT * FROM tickers LIMIT 10');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data from the database:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Serve static files (e.g., your index.html file)
app.use(express.static('public'));

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
