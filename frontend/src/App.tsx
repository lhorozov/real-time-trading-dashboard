import { useState, useEffect, useRef } from 'react';
import type { Ticker, PriceUpdate } from './types';
import { api } from './services/api';
import { WebSocketService } from './services/websocket';
import { TickerList } from './components/TickerList';
import { PriceChart } from './components/PriceChart';
import './App.css';

function App() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // Create WebSocket service only once
    if (!wsServiceRef.current) {
      wsServiceRef.current = new WebSocketService();
    }

    initializeApp();

    return () => {
      wsServiceRef.current?.disconnect();
    };
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load initial tickers
      const initialTickers = await api.getTickers();
      setTickers(initialTickers);

      if (initialTickers.length > 0) {
        setSelectedSymbol(initialTickers[0].symbol);
      }

      // Connect to WebSocket
      await wsServiceRef.current?.connect();
      setConnected(true);

      // Subscribe to price updates
      const symbols = initialTickers.map(t => t.symbol);
      wsServiceRef.current?.subscribe(symbols);

      // Listen for price updates
      wsServiceRef.current?.onPriceUpdate(handlePriceUpdate);

    } catch (err) {
      setError('Failed to initialize application');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = (update: PriceUpdate) => {
    setTickers(prevTickers => 
      prevTickers.map(ticker => {
        if (ticker.symbol === update.symbol) {
          const oldPrice = ticker.price;
          const change = update.price - oldPrice;
          const changePercent = (change / oldPrice) * 100;

          return {
            ...ticker,
            price: update.price,
            change,
            changePercent,
            timestamp: update.timestamp
          };
        }
        return ticker;
      })
    );
  };

  const handleSelectTicker = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>📈 Real-Time Trading Dashboard</h1>
        </header>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>📈 Real-Time Trading Dashboard</h1>
        </header>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📈 Real-Time Trading Dashboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <main className="app-main">
        <TickerList 
          tickers={tickers}
          selectedSymbol={selectedSymbol}
          onSelectTicker={handleSelectTicker}
        />

        {selectedSymbol && (
          <PriceChart symbol={selectedSymbol} />
        )}
      </main>

      <footer className="app-footer">
        <p>Real-time market data simulation • Updates every 1-3 seconds</p>
      </footer>
    </div>
  );
}

export default App;
