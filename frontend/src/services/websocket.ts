import type { WebSocketMessage, PriceUpdate } from '../types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscribers: Set<(update: PriceUpdate) => void> = new Set();
  private url: string;

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed:', message.message);
        break;
      case 'price_update':
        if (message.data) {
          this.notifySubscribers(message.data);
        }
        break;
      case 'subscribed':
        console.log('Subscribed to symbols:', message.symbols);
        break;
      case 'unsubscribed':
        console.log('Unsubscribed from symbols:', message.symbols);
        break;
      case 'error':
        console.error('WebSocket error message:', message.error);
        break;
    }
  }

  subscribe(symbols: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));
    }
  }

  unsubscribe(symbols: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbols
      }));
    }
  }

  onPriceUpdate(callback: (update: PriceUpdate) => void): void {
    this.subscribers.add(callback);
  }

  offPriceUpdate(callback: (update: PriceUpdate) => void): void {
    this.subscribers.delete(callback);
  }

  private notifySubscribers(update: PriceUpdate): void {
    this.subscribers.forEach(callback => callback(update));
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
