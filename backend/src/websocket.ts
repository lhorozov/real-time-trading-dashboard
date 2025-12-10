import { WebSocketServer, WebSocket } from 'ws';
import { MarketDataSimulator } from './services/MarketDataSimulator';
import { PriceUpdate } from './types';

export class WebSocketService {
  private wss: WebSocketServer;
  private marketData: MarketDataSimulator;
  private clients: Map<WebSocket, Set<string>>;

  constructor(port: number, marketData: MarketDataSimulator) {
    this.wss = new WebSocketServer({ port });
    this.marketData = marketData;
    this.clients = new Map();
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');
      this.clients.set(ws, new Set());

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send initial data
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to trading dashboard'
      }));
    });

    // Subscribe to market data updates
    this.marketData.subscribe((update: PriceUpdate) => {
      this.broadcastUpdate(update);
    });

    console.log(`WebSocket server listening on port ${this.wss.options.port}`);
  }

  private handleMessage(ws: WebSocket, data: any): void {
    const { type, symbols } = data;

    switch (type) {
      case 'subscribe':
        if (Array.isArray(symbols)) {
          const clientSymbols = this.clients.get(ws);
          if (clientSymbols) {
            symbols.forEach(symbol => clientSymbols.add(symbol.toUpperCase()));
            ws.send(JSON.stringify({
              type: 'subscribed',
              symbols: Array.from(clientSymbols)
            }));
          }
        }
        break;

      case 'unsubscribe':
        if (Array.isArray(symbols)) {
          const clientSymbols = this.clients.get(ws);
          if (clientSymbols) {
            symbols.forEach(symbol => clientSymbols.delete(symbol.toUpperCase()));
            ws.send(JSON.stringify({
              type: 'unsubscribed',
              symbols: Array.from(clientSymbols)
            }));
          }
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  private broadcastUpdate(update: PriceUpdate): void {
    const message = JSON.stringify({
      type: 'price_update',
      data: update
    });

    this.clients.forEach((symbols, ws) => {
      if (ws.readyState === WebSocket.OPEN && symbols.has(update.symbol)) {
        ws.send(message);
      }
    });
  }

  public close(): void {
    this.wss.close();
  }
}
