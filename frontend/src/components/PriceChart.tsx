import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { HistoricalPrice } from '../types';
import { api } from '../services/api';
import './PriceChart.css';

interface PriceChartProps {
  symbol: string;
}

interface ChartData {
  date: string;
  price: number;
  volume: number;
}

export const PriceChart = ({ symbol }: PriceChartProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadHistoricalData();
  }, [symbol, days]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const historical = await api.getHistoricalData(symbol, days);
      
      const chartData: ChartData[] = historical.map((item: HistoricalPrice) => ({
        date: new Date(item.timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        price: item.close,
        volume: item.volume
      }));
      
      setData(chartData);
    } catch (err) {
      setError('Failed to load historical data');
      console.error('Error loading historical data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (loading) {
    return (
      <div className="price-chart">
        <div className="chart-header">
          <h3>{symbol} Price Chart</h3>
        </div>
        <div className="chart-loading">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-chart">
        <div className="chart-header">
          <h3>{symbol} Price Chart</h3>
        </div>
        <div className="chart-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="price-chart">
      <div className="chart-header">
        <h3>{symbol} Price Chart</h3>
        <div className="chart-controls">
          <button 
            className={days === 7 ? 'active' : ''} 
            onClick={() => setDays(7)}
          >
            7D
          </button>
          <button 
            className={days === 30 ? 'active' : ''} 
            onClick={() => setDays(30)}
          >
            30D
          </button>
          <button 
            className={days === 90 ? 'active' : ''} 
            onClick={() => setDays(90)}
          >
            90D
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={formatPrice}
            tick={{ fontSize: 12 }}
            label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={formatVolume}
            tick={{ fontSize: 12 }}
            label={{ value: 'Volume', angle: 90, position: 'insideRight' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'price') return [formatPrice(value), 'Price'];
              if (name === 'volume') return [formatVolume(value), 'Volume'];
              return [value, name];
            }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="price" 
            stroke="#007bff" 
            strokeWidth={2}
            dot={false}
            name="Price"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="volume" 
            stroke="#82ca9d" 
            strokeWidth={1}
            dot={false}
            name="Volume"
            opacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
