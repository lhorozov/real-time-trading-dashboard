import { Ticker, HistoricalPrice, PriceUpdate } from '../types';

export class MarketDataSimulator {
  private tickers: Map<string, Ticker>;
  private updateIntervals: Map<string, NodeJS.Timeout>;
  private subscribers: Set<(update: PriceUpdate) => void>;

  constructor() {
    this.tickers = new Map();
    this.updateIntervals = new Map();
    this.subscribers = new Set();
    this.initializeTickers();
  }

  private initializeTickers(): void {
    const initialTickers: Ticker[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 185.50,
        change: 0,
        changePercent: 0,
        volume: 52000000,
        timestamp: Date.now()
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 242.30,
        change: 0,
        changePercent: 0,
        volume: 98000000,
        timestamp: Date.now()
      },
      {
        symbol: 'BTC-USD',
        name: 'Bitcoin USD',
        price: 42150.75,
        change: 0,
        changePercent: 0,
        volume: 28000000,
        timestamp: Date.now()
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 138.25,
        change: 0,
        changePercent: 0,
        volume: 24000000,
        timestamp: Date.now()
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        price: 378.90,
        change: 0,
        changePercent: 0,
        volume: 19000000,
        timestamp: Date.now()
      }
    ];

    initialTickers.forEach(ticker => {
      this.tickers.set(ticker.symbol, ticker);
    });
  }

  public startSimulation(): void {
    this.tickers.forEach((ticker, symbol) => {
      const interval = setInterval(() => {
        this.updatePrice(symbol);
      }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds
      
      this.updateIntervals.set(symbol, interval);
    });
  }

  public stopSimulation(): void {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
  }

  private updatePrice(symbol: string): void {
    const ticker = this.tickers.get(symbol);
    if (!ticker) return;

    const oldPrice = ticker.price;
    
    // Simulate price movement with volatility
    const volatility = symbol === 'BTC-USD' ? 0.002 : 0.001;
    const change = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = ticker.price * (1 + change);

    ticker.price = parseFloat(newPrice.toFixed(2));
    ticker.change = parseFloat((ticker.price - oldPrice).toFixed(2));
    ticker.changePercent = parseFloat(((ticker.change / oldPrice) * 100).toFixed(2));
    ticker.volume += Math.floor(Math.random() * 100000);
    ticker.timestamp = Date.now();

    this.tickers.set(symbol, ticker);

    // Notify subscribers
    const update: PriceUpdate = {
      symbol,
      price: ticker.price,
      timestamp: ticker.timestamp
    };
    
    this.notifySubscribers(update);
  }

  public subscribe(callback: (update: PriceUpdate) => void): void {
    this.subscribers.add(callback);
  }

  public unsubscribe(callback: (update: PriceUpdate) => void): void {
    this.subscribers.delete(callback);
  }

  private notifySubscribers(update: PriceUpdate): void {
    this.subscribers.forEach(callback => callback(update));
  }

  public getTickers(): Ticker[] {
    return Array.from(this.tickers.values());
  }

  public getTicker(symbol: string): Ticker | undefined {
    return this.tickers.get(symbol);
  }

  public generateHistoricalData(symbol: string, days: number = 30): HistoricalPrice[] {
    const ticker = this.tickers.get(symbol);
    if (!ticker) return [];

    const historical: HistoricalPrice[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let basePrice = ticker.price * 0.9; // Start from 10% lower

    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * dayMs);
      const dailyChange = (Math.random() - 0.5) * 0.05;
      
      const open = basePrice;
      const close = basePrice * (1 + dailyChange);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      
      historical.push({
        timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 5000000
      });

      basePrice = close;
    }

    return historical;
  }
}
