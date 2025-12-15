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
      wsServiceRef.current = new WebSocketService(import.meta.env.VITE_WS_URL);
    }

    // Listen for connection status changes
    wsServiceRef.current.onConnectionStatus((isConnected) => {
      setConnected(isConnected);
      // Clear error and reload data when successfully connected
      if (isConnected) {
        setError(null);
        
        // Subscribe to all symbols on reconnect
        api.getTickers()
          .then(tickerList => {
            const symbols = tickerList.map(t => t.symbol);
            wsServiceRef.current?.subscribe(symbols);
            
            // Update tickers if we don't have any
            if (tickers.length === 0) {
              setTickers(tickerList);
            }
          })
          .catch(err => console.error('Failed to load tickers after reconnect:', err));
      }
    });

    initializeApp();

    return () => {
      wsServiceRef.current?.disconnect();
    };
  }, []);

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
    try {
      await wsServiceRef.current?.connect();
      
      // Subscribe to all ticker symbols after connecting
      const symbols = tickers.length > 0 
        ? tickers.map(t => t.symbol) 
        : ['AAPL', 'TSLA', 'BTC-USD', 'GOOGL', 'MSFT'];
      
      wsServiceRef.current?.subscribe(symbols);
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
