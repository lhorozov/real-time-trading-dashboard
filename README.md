# 📈 Real-Time Trading Dashboard

A full-stack real-time trading dashboard that displays live ticker prices and interactive charts for selected financial instruments.

## 🚀 Features

- **Real-time Price Updates** - WebSocket-based live price streaming
- **Interactive Dashboard** - Clean, responsive UI with live ticker cards
- **Historical Charts** - Multi-timeframe price charts (7D, 30D, 90D)
- **Multiple Tickers** - Supports AAPL, TSLA, BTC-USD, GOOGL, MSFT
- **Market Data Simulation** - Realistic price movement simulation
- **Docker Support** - Full containerization with docker-compose
- **TypeScript** - Type-safe codebase for both frontend and backend
- **Unit Tests** - Comprehensive test coverage

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Express.js** - RESTful API server
- **WebSocket (ws)** - Real-time price streaming
- **Market Data Simulator** - Simulates realistic price movements
- **Clean Architecture** - Separation of concerns with services layer

### Frontend (React + TypeScript)
- **React 18** - Modern component-based UI
- **Vite** - Fast build tool and dev server
- **Recharts** - Beautiful, responsive charts
- **WebSocket Client** - Real-time data subscription
- **Responsive Design** - Mobile-friendly interface

### API Endpoints

#### REST API (Port 3001)
- `GET /health` - Health check
- `GET /api/tickers` - Get all available tickers
- `GET /api/tickers/:symbol` - Get specific ticker data
- `GET /api/history/:symbol?days=30` - Get historical price data

#### WebSocket (Port 3002)
- **Subscribe** - Subscribe to ticker updates
```json
{ "type": "subscribe", "symbols": ["AAPL", "TSLA"] }
```
- **Unsubscribe** - Unsubscribe from ticker updates
```json
{ "type": "unsubscribe", "symbols": ["AAPL"] }
```
- **Price Updates** - Receive real-time price updates
```json
{ "type": "price_update", "data": { "symbol": "AAPL", "price": 185.50, "timestamp": 1702234567890 } }
```

## 📦 Installation

### Prerequisites
- Node.js 20+ 
- pnpm (recommended) or npm
- Docker & Docker Compose (optional)

### Option 1: Local Development

#### Backend Setup
```bash
cd backend
pnpm install
pnpm dev
```

Backend will run on:
- HTTP API: http://localhost:3001
- WebSocket: ws://localhost:3002

#### Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```

Frontend will run on: http://localhost:5173

### Option 2: Docker

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

Access the application at: http://localhost

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
pnpm test
```

### Test Coverage
```bash
cd backend
pnpm test --coverage
```

## 🛠️ Development

### Project Structure
```
real-time-trading-dashboard/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── MarketDataSimulator.ts    # Market data simulation
│   │   ├── types/
│   │   │   └── index.ts                   # TypeScript types
│   │   ├── app.ts                         # Express app setup
│   │   ├── websocket.ts                   # WebSocket server
│   │   └── server.ts                      # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TickerList.tsx            # Ticker cards grid
│   │   │   └── PriceChart.tsx            # Historical chart
│   │   ├── services/
│   │   │   ├── api.ts                    # REST API client
│   │   │   └── websocket.ts              # WebSocket client
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript types
│   │   ├── App.tsx                       # Main component
│   │   └── main.tsx                      # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── docker-compose.yml
```

### Environment Variables

#### Backend (.env)
```env
HTTP_PORT=3001
WS_PORT=3002
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
```

## 🎯 Design Decisions & Trade-offs

### Market Data Simulation
- **Decision**: Implemented custom simulator instead of using real market data APIs
- **Rationale**: Eliminates external dependencies, API rate limits, and costs
- **Trade-off**: Not real market data, but realistic enough for demonstration

### WebSocket Architecture
- **Decision**: Separate WebSocket server from HTTP server
- **Rationale**: Better scalability and separation of concerns
- **Trade-off**: Requires managing two ports

### Frontend State Management
- **Decision**: Used React hooks without external state management library
- **Rationale**: Simpler setup, sufficient for current scope
- **Trade-off**: May need Redux/Zustand for larger applications

### TypeScript
- **Decision**: Strict TypeScript for both frontend and backend
- **Rationale**: Type safety, better developer experience, fewer bugs
- **Trade-off**: Slightly longer development time

### Docker Multi-stage Builds
- **Decision**: Used multi-stage builds for both services
- **Rationale**: Smaller production images, faster deployments
- **Trade-off**: Longer initial build time

## 🚧 Future Enhancements

- [ ] User authentication and authorization
- [ ] Redis caching for historical data
- [ ] Price threshold alerts
- [ ] More technical indicators
- [ ] Database persistence
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline
- [ ] End-to-end tests

## 📝 License

MIT

## 👨‍💻 Author

Built with ❤️ for the Real-Time Trading Dashboard challenge
