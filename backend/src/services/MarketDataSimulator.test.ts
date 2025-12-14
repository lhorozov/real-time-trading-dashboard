import { MarketDataSimulator } from '../services/MarketDataSimulator';
import { PriceUpdate } from '../types';

describe('MarketDataSimulator', () => {
  let simulator: MarketDataSimulator;

  beforeEach(() => {
    jest.useFakeTimers();
    simulator = new MarketDataSimulator();
  });

  afterEach(() => {
    simulator.stopSimulation();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default tickers', () => {
      const tickers = simulator.getTickers();
      expect(tickers.length).toBeGreaterThan(0);
      expect(tickers[0]).toHaveProperty('symbol');
      expect(tickers[0]).toHaveProperty('price');
    });

    it('should have specific tickers available', () => {
      const symbols = ['AAPL', 'TSLA', 'BTC-USD', 'GOOGL', 'MSFT'];
      const tickers = simulator.getTickers();
      const tickerSymbols = tickers.map(t => t.symbol);
      
      symbols.forEach(symbol => {
        expect(tickerSymbols).toContain(symbol);
      });
    });
  });

  describe('getTicker', () => {
    it('should return ticker for valid symbol', () => {
      const ticker = simulator.getTicker('AAPL');
      expect(ticker).toBeDefined();
      expect(ticker?.symbol).toBe('AAPL');
    });

    it('should return undefined for invalid symbol', () => {
      const ticker = simulator.getTicker('INVALID');
      expect(ticker).toBeUndefined();
    });
  });

  describe('Price updates', () => {
    it('should notify subscribers of price updates', () => {
      let updateReceived = false;
      let receivedUpdate: PriceUpdate | null = null;
      
      const callback = (update: PriceUpdate) => {
        updateReceived = true;
        receivedUpdate = update;
      };

      simulator.subscribe(callback);
      simulator.startSimulation();
      
      // Advance timers to trigger price update
      jest.advanceTimersByTime(1100);

      expect(updateReceived).toBe(true);
      expect(receivedUpdate).toHaveProperty('symbol');
      expect(receivedUpdate).toHaveProperty('price');
      expect(receivedUpdate).toHaveProperty('timestamp');
    });

    it('should allow unsubscribing from updates', () => {
      let callCount = 0;
      
      const callback = () => {
        callCount++;
      };

      simulator.subscribe(callback);
      simulator.unsubscribe(callback);
      simulator.startSimulation();

      // Advance timers to check no callbacks triggered
      jest.advanceTimersByTime(2000);
      expect(callCount).toBe(0);
    });
  });

  describe('Historical data', () => {
    it('should generate historical data for valid symbol', () => {
      const historical = simulator.generateHistoricalData('AAPL', 7);
      expect(historical.length).toBe(8); // 7 days + today
      expect(historical[0]).toHaveProperty('timestamp');
      expect(historical[0]).toHaveProperty('open');
      expect(historical[0]).toHaveProperty('high');
      expect(historical[0]).toHaveProperty('low');
      expect(historical[0]).toHaveProperty('close');
      expect(historical[0]).toHaveProperty('volume');
    });

    it('should return empty array for invalid symbol', () => {
      const historical = simulator.generateHistoricalData('INVALID', 7);
      expect(historical).toEqual([]);
    });

    it('should have high >= max(open, close)', () => {
      const historical = simulator.generateHistoricalData('AAPL', 5);
      historical.forEach(data => {
        expect(data.high).toBeGreaterThanOrEqual(data.open);
        expect(data.high).toBeGreaterThanOrEqual(data.close);
      });
    });

    it('should have low <= min(open, close)', () => {
      const historical = simulator.generateHistoricalData('AAPL', 5);
      historical.forEach(data => {
        expect(data.low).toBeLessThanOrEqual(data.open);
        expect(data.low).toBeLessThanOrEqual(data.close);
      });
    });
  });
});
