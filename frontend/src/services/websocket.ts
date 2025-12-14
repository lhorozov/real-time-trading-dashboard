import type { WebSocketMessage, PriceUpdate } from '../types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscribers: Set<(update: PriceUpdate) => void> = new Set();
  private connectionStatusCallbacks: Set<(connected: boolean) => void> = new Set();
  private url: string;
  private heartbeatInterval: number | null = null;
  private heartbeatTimeout: number | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT = 5000; // 5 seconds

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
          this.startHeartbeat();
          this.notifyConnectionStatus(true);
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
          this.stopHeartbeat();
          this.notifyConnectionStatus(false);
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
      case 'pong':
        // Received pong response - connection is alive
        this.resetHeartbeatTimeout();
        break;
      case 'error':
        console.error('WebSocket error message:', message.error);
        break;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // Set timeout - if no pong received, assume disconnected
        this.heartbeatTimeout = window.setTimeout(() => {
          console.error('Heartbeat timeout - no pong received, closing connection');
          this.ws?.close();
        }, this.HEARTBEAT_TIMEOUT);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
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

  onConnectionStatus(callback: (connected: boolean) => void): void {
    this.connectionStatusCallbacks.add(callback);
  }

  offConnectionStatus(callback: (connected: boolean) => void): void {
    this.connectionStatusCallbacks.delete(callback);
  }

  private notifySubscribers(update: PriceUpdate): void {
    this.subscribers.forEach(callback => callback(update));
  }

  private notifyConnectionStatus(connected: boolean): void {
    this.connectionStatusCallbacks.forEach(callback => callback(connected));
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.connectionStatusCallbacks.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
