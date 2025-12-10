import { app, marketData } from './app';
import { WebSocketService } from './websocket';
import dotenv from 'dotenv';

dotenv.config();

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Start market data simulation
marketData.startSimulation();

// Start HTTP server
const server = app.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT}`);
});

// Start WebSocket server
const wsService = new WebSocketService(Number(WS_PORT), marketData);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  wsService.close();
  marketData.stopSimulation();
  
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  wsService.close();
  marketData.stopSimulation();
  
  process.exit(0);
});
