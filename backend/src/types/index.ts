export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface HistoricalPrice {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface TickerSubscription {
  symbols: string[];
}
