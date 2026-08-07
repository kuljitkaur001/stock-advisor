import api from './client';
import {
  User,
  StockQuote,
  StockSearchResult,
  CandlePoint,
  IndicatorsData,
  PortfolioSummary,
  Transaction,
  Recommendation,
  WatchlistItem,
  AdminStats
} from '../types';

export const authApi = {
  signup: async (data: any) => (await api.post<User>('/auth/signup', data)).data,
  login: async (data: any) => (await api.post<{ access_token: string; refresh_token: string }>('/auth/login', data)).data,
  getMe: async () => (await api.get<User>('/auth/me')).data,
};

export const stocksApi = {
  search: async (query: string, country?: string) =>
    (await api.get<StockSearchResult[]>('/stocks/search', { params: { query, country } })).data,
  getQuote: async (ticker: string) =>
    (await api.get<StockQuote>(`/stocks/${ticker}/quote`)).data,
  getHistory: async (ticker: string, period = '1Y') =>
    (await api.get<{ candles: CandlePoint[] }>(`/stocks/${ticker}/history`, { params: { period } })).data,
  getIndicators: async (ticker: string, period = '1Y') =>
    (await api.get<IndicatorsData>(`/stocks/${ticker}/indicators`, { params: { period } })).data,
};

export const portfolioApi = {
  getSummary: async () => (await api.get<PortfolioSummary>('/portfolio')).data,
  trade: async (data: { ticker: string; transaction_type: 'BUY' | 'SELL'; quantity: number }) =>
    (await api.post<Transaction>('/portfolio/trade', data)).data,
  getTransactions: async () => (await api.get<Transaction[]>('/portfolio/transactions')).data,
};

export const aiApi = {
  getRecommendation: async (ticker: string) =>
    (await api.get<Recommendation>(`/analysis/recommendation/${ticker}`)).data,
  sendMessage: async (message: string, ticker_context?: string, chat_history?: any[]) =>
    (await api.post<{ message: string; sources: string[]; timestamp: string }>('/chat/message', { message, ticker_context, chat_history })).data,
};

export const watchlistApi = {
  getWatchlist: async () => (await api.get<WatchlistItem[]>('/watchlist')).data,
  addToWatchlist: async (data: { ticker: string; notes?: string; target_alert_price?: number }) =>
    (await api.post<WatchlistItem>('/watchlist', data)).data,
  removeFromWatchlist: async (id: number) => await api.delete(`/watchlist/${id}`),
};

export const adminApi = {
  getStats: async () => (await api.get<AdminStats>('/admin/stats')).data,
  getUsers: async () => (await api.get<User[]>('/admin/users')).data,
};

export const reportsApi = {
  downloadPortfolioPdf: async () => {
    const response = await api.get('/reports/portfolio-pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Portfolio_Report.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
