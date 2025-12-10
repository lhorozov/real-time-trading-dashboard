import express, { Request, Response } from 'express';
import cors from 'cors';
import { MarketDataSimulator } from './services/MarketDataSimulator';

const app = express();
const marketData = new MarketDataSimulator();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get all tickers
app.get('/api/tickers', (req: Request, res: Response) => {
  const tickers = marketData.getTickers();
  res.json(tickers);
});

// Get specific ticker
app.get('/api/tickers/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const ticker = marketData.getTicker(symbol.toUpperCase());
  
  if (!ticker) {
    return res.status(404).json({ error: 'Ticker not found' });
  }
  
  res.json(ticker);
});

// Get historical data
app.get('/api/history/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  
  const ticker = marketData.getTicker(symbol.toUpperCase());
  if (!ticker) {
    return res.status(404).json({ error: 'Ticker not found' });
  }
  
  const historical = marketData.generateHistoricalData(symbol.toUpperCase(), days);
  res.json(historical);
});

export { app, marketData };
