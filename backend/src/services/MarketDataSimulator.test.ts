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
      
      // Advance timers to trigger price update (intervals are 1000-3000ms random)
      jest.advanceTimersByTime(3500);

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

  describe('Caching', () => {
    it('should cache historical data', () => {
      const firstCall = simulator.generateHistoricalData('AAPL', 7);
      const secondCall = simulator.generateHistoricalData('AAPL', 7);
      
      // Should return same data (cached)
      expect(firstCall).toEqual(secondCall);
    });

    it('should use separate cache for different symbols', () => {
      const appleData = simulator.generateHistoricalData('AAPL', 7);
      const teslaData = simulator.generateHistoricalData('TSLA', 7);
      
      expect(appleData).not.toEqual(teslaData);
    });

    it('should use separate cache for different day ranges', () => {
      const data7days = simulator.generateHistoricalData('AAPL', 7);
      const data30days = simulator.generateHistoricalData('AAPL', 30);
      
      expect(data7days.length).toBe(8);
      expect(data30days.length).toBe(31);
      expect(data7days).not.toEqual(data30days);
    });

    it('should expire cache after TTL', () => {
      jest.useRealTimers(); // Use real timers for this test
      
      const firstCall = simulator.generateHistoricalData('AAPL', 7);
      
      // Mock Date.now to simulate 16 minutes passing (1 minute more than TTL)
      const originalNow = Date.now;
      const startTime = originalNow();
      Date.now = jest.fn(() => startTime + 16 * 60 * 1000);
      
      const secondCall = simulator.generateHistoricalData('AAPL', 7);
      
      // Should be different because cache expired
      expect(firstCall).not.toEqual(secondCall);
      
      // Restore
      Date.now = originalNow;
      jest.useFakeTimers();
    });

    it('should clear specific cache entry', () => {
      simulator.generateHistoricalData('AAPL', 7);
      simulator.generateHistoricalData('AAPL', 30);
      
      let stats = simulator.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toContain('AAPL-7');
      expect(stats.entries).toContain('AAPL-30');
      
      simulator.clearCache('AAPL', 7);
      
      stats = simulator.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain('AAPL-30');
      expect(stats.entries).not.toContain('AAPL-7');
    });

    it('should clear all cache entries for a symbol', () => {
      simulator.generateHistoricalData('AAPL', 7);
      simulator.generateHistoricalData('AAPL', 30);
      simulator.generateHistoricalData('TSLA', 7);
      
      let stats = simulator.getCacheStats();
      expect(stats.size).toBe(3);
      
      simulator.clearCache('AAPL');
      
      stats = simulator.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain('TSLA-7');
      expect(stats.entries).not.toContain('AAPL-7');
      expect(stats.entries).not.toContain('AAPL-30');
    });

    it('should clear entire cache', () => {
      simulator.generateHistoricalData('AAPL', 7);
      simulator.generateHistoricalData('TSLA', 7);
      simulator.generateHistoricalData('BTC-USD', 30);
      
      let stats = simulator.getCacheStats();
      expect(stats.size).toBe(3);
      
      simulator.clearCache();
      
      stats = simulator.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toEqual([]);
    });

    it('should provide cache statistics', () => {
      const stats1 = simulator.getCacheStats();
      expect(stats1.size).toBe(0);
      
      simulator.generateHistoricalData('AAPL', 7);
      simulator.generateHistoricalData('TSLA', 30);
      
      const stats2 = simulator.getCacheStats();
      expect(stats2.size).toBe(2);
      expect(stats2.entries).toEqual(['AAPL-7', 'TSLA-30']);
    });
  });
});
