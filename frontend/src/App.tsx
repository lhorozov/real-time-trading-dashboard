import { useState, useEffect, useRef, useCallback } from 'react';
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

  const handleConnectionChange = useCallback((isConnected: boolean) => {
    setConnected(isConnected);
    
    if (isConnected) {
      setError(null);
      
      // Subscribe to all symbols and refresh tickers
      api.getTickers()
        .then(tickerList => {
          const symbols = tickerList.map(t => t.symbol);
          wsServiceRef.current?.subscribe(symbols);
          setTickers(prevTickers => prevTickers.length === 0 ? tickerList : prevTickers);
        })
        .catch(err => console.error('Failed to load tickers after reconnect:', err));
    }
  }, []);

  useEffect(() => {
    // Create WebSocket service only once
    if (!wsServiceRef.current) {
      wsServiceRef.current = new WebSocketService(import.meta.env.VITE_WS_URL);
    }

    // Listen for connection status changes
    wsServiceRef.current.onConnectionStatus(handleConnectionChange);

    initializeApp();

    return () => {
      wsServiceRef.current?.disconnect();
    };
  }, [handleConnectionChange]);

  const initializeApp = async () => {
    setLoading(true);
    setError(null);

    // Try to load initial tickers (but don't fail if unavailable)
    try {
      const initialTickers = await api.getTickers();
      setTickers(initialTickers);

      if (initialTickers.length > 0) {
        setSelectedSymbol(initialTickers[0].symbol);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Backend unavailable - WebSocket will keep trying to reconnect...');
    }

    // Always attempt WebSocket connection (independent of REST API)
    // Note: subscription happens in handleConnectionChange when connected
    try {
      await wsServiceRef.current?.connect();
    } catch (err) {
      console.error('Initial WebSocket connection failed, will retry automatically');
    }

    // Listen for price updates
    wsServiceRef.current?.onPriceUpdate(handlePriceUpdate);

    setLoading(false);
  };

  const handlePriceUpdate = (update: PriceUpdate) => {
    setTickers(prevTickers => 
      prevTickers.map(ticker => {
        if (ticker.symbol === update.symbol) {
          const oldPrice = ticker.price;
          const newPrice = update.price;
          const change = newPrice - oldPrice;
          const changePercent = oldPrice !== 0 ? (change / oldPrice) * 100 : 0;

          return {
            ...ticker,
            price: newPrice,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
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
