import axios from 'axios';
import type { Ticker, HistoricalPrice } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  async getTickers(): Promise<Ticker[]> {
    const response = await axios.get(`${API_BASE_URL}/api/tickers`);
    return response.data;
  },

  async getTicker(symbol: string): Promise<Ticker> {
    const response = await axios.get(`${API_BASE_URL}/api/tickers/${symbol}`);
    return response.data;
  },

  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalPrice[]> {
    const response = await axios.get(`${API_BASE_URL}/api/history/${symbol}`, {
      params: { days }
    });
    return response.data;
  }
};
