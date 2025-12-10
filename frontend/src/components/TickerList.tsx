import { useEffect, useState } from 'react';
import type { Ticker } from '../types';
import './TickerList.css';

interface TickerListProps {
  tickers: Ticker[];
  selectedSymbol: string | null;
  onSelectTicker: (symbol: string) => void;
}

export const TickerList = ({ tickers, selectedSymbol, onSelectTicker }: TickerListProps) => {
  const [sortedTickers, setSortedTickers] = useState<Ticker[]>([]);

  useEffect(() => {
    setSortedTickers([...tickers].sort((a, b) => a.symbol.localeCompare(b.symbol)));
  }, [tickers]);

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatChange = (change: number): string => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <div className="ticker-list">
      <h2>Live Tickers</h2>
      <div className="ticker-grid">
        {sortedTickers.map((ticker) => (
          <div
            key={ticker.symbol}
            className={`ticker-card ${selectedSymbol === ticker.symbol ? 'selected' : ''} ${
              ticker.changePercent >= 0 ? 'positive' : 'negative'
            }`}
            onClick={() => onSelectTicker(ticker.symbol)}
          >
            <div className="ticker-header">
              <div className="ticker-symbol">{ticker.symbol}</div>
              <div className="ticker-name">{ticker.name}</div>
            </div>
            <div className="ticker-price">${formatPrice(ticker.price)}</div>
            <div className="ticker-change">
              <span className="change-value">{formatChange(ticker.change)}</span>
              <span className="change-percent">{formatPercent(ticker.changePercent)}</span>
            </div>
            <div className="ticker-volume">Vol: {formatVolume(ticker.volume)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
