const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Indian Market
app.get('/api/stocks/india', async (req, res) => {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=^NSEI&token=${process.env.FINNHUB_API_KEY}`
    );
    res.json({
      market: 'india',
      nifty50: response.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// US Market
app.get('/api/stocks/us', async (req, res) => {
  try {
    const [sp500, nasdaq, dow] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/quote?symbol=%5EGSPC&token=${process.env.FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/quote?symbol=%5EIXIC&token=${process.env.FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/quote?symbol=%5EDJI&token=${process.env.FINNHUB_API_KEY}`)
    ]);
    
    res.json({
      market: 'us',
      sp500: sp500.data,
      nasdaq: nasdaq.data,
      dow: dow.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crypto
app.get('/api/crypto/list', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 50,
          sparkline: false
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// News
app.get('/api/news/market', async (req, res) => {
  try {
    const response = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: 'stock market financial news',
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 20,
          apiKey: process.env.NEWSAPI_KEY
        }
      }
    );
    res.json(response.data.articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// India News
app.get('/api/news/india', async (req, res) => {
  try {
    const response = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: 'Indian stock market NSE BSE',
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 20,
          apiKey: process.env.NEWSAPI_KEY
        }
      }
    );
    res.json(response.data.articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Geopolitics
app.get('/api/news/geopolitics', async (req, res) => {
  try {
    const response = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: 'geopolitical conflict economic impact',
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 20,
          apiKey: process.env.NEWSAPI_KEY
        }
      }
    );
    res.json(response.data.articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('✅ Client connected');
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
