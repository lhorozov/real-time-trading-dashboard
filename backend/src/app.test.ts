import request from 'supertest';
import { app, marketData } from './app';

describe('API Endpoints', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    // Start market data simulation for tests
    marketData.startSimulation();
  });

  afterAll(() => {
    // Stop simulation after tests
    marketData.stopSimulation();
    // Clear all timers and restore real timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });
  });

  describe('GET /api/tickers', () => {
    it('should return all tickers', async () => {
      const response = await request(app).get('/api/tickers');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return tickers with correct structure', async () => {
      const response = await request(app).get('/api/tickers');
      
      const ticker = response.body[0];
      expect(ticker).toHaveProperty('symbol');
      expect(ticker).toHaveProperty('name');
      expect(ticker).toHaveProperty('price');
      expect(ticker).toHaveProperty('change');
      expect(ticker).toHaveProperty('changePercent');
      expect(ticker).toHaveProperty('timestamp');
    });

    it('should include known ticker symbols', async () => {
      const response = await request(app).get('/api/tickers');
      
      const symbols = response.body.map((t: any) => t.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('TSLA');
      expect(symbols).toContain('BTC-USD');
    });
  });

  describe('GET /api/tickers/:symbol', () => {
    it('should return specific ticker', async () => {
      const response = await request(app).get('/api/tickers/AAPL');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('symbol', 'AAPL');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
    });

    it('should handle lowercase symbol', async () => {
      const response = await request(app).get('/api/tickers/aapl');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('symbol', 'AAPL');
    });

    it('should return 404 for invalid ticker', async () => {
      const response = await request(app).get('/api/tickers/INVALID');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ticker not found');
    });
  });

  describe('GET /api/history/:symbol', () => {
    it('should return historical data', async () => {
      const response = await request(app).get('/api/history/AAPL');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return correct number of data points', async () => {
      const days = 7;
      const response = await request(app).get(`/api/history/AAPL?days=${days}`);
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(days + 1); // days + today
    });

    it('should return data with correct structure', async () => {
      const response = await request(app).get('/api/history/AAPL');
      
      const dataPoint = response.body[0];
      expect(dataPoint).toHaveProperty('timestamp');
      expect(dataPoint).toHaveProperty('open');
      expect(dataPoint).toHaveProperty('high');
      expect(dataPoint).toHaveProperty('low');
      expect(dataPoint).toHaveProperty('close');
      expect(dataPoint).toHaveProperty('volume');
    });

    it('should default to 30 days if not specified', async () => {
      const response = await request(app).get('/api/history/AAPL');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(31); // 30 days + today
    });

    it('should return 404 for invalid ticker', async () => {
      const response = await request(app).get('/api/history/INVALID');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ticker not found');
    });

    it('should have valid OHLC data', async () => {
      const response = await request(app).get('/api/history/AAPL');
      
      response.body.forEach((data: any) => {
        expect(data.high).toBeGreaterThanOrEqual(data.open);
        expect(data.high).toBeGreaterThanOrEqual(data.close);
        expect(data.low).toBeLessThanOrEqual(data.open);
        expect(data.low).toBeLessThanOrEqual(data.close);
      });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/api/tickers');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
