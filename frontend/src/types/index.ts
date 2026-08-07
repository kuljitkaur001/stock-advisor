export type RoleEnum = 'user' | 'admin';
export type CountryEnum = 'IN' | 'US';
export type TransactionTypeEnum = 'BUY' | 'SELL';
export type RecommendationEnum = 'BUY' | 'HOLD' | 'SELL';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: RoleEnum;
  preferred_country: CountryEnum;
  virtual_balance_usd: number;
  virtual_balance_inr: number;
  is_active: boolean;
  created_at: string;
}

export interface StockQuote {
  ticker: string;
  name: string;
  current_price: number;
  change: number;
  percent_change: number;
  day_high: number;
  day_low: number;
  open_price: number;
  previous_close: number;
  volume: number;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  high_52w?: number;
  low_52w?: number;
  sector?: string;
  industry?: string;
  exchange: string;
  country: string;
  currency: string;
  last_updated: string;
}

export interface StockSearchResult {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  sector?: string;
  industry?: string;
}

export interface CandlePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorsData {
  ticker: string;
  timestamps: string[];
  close_prices: number[];
  sma_20: (number | null)[];
  sma_50: (number | null)[];
  ema_20: (number | null)[];
  rsi: number[];
  macd: {
    macd: (number | null)[];
    signal: (number | null)[];
    histogram: (number | null)[];
  };
  atr: (number | null)[];
  bollinger_bands: {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
  };
  vwap: (number | null)[];
  obv: number[];
  adx: number[];
}

export interface HoldingItem {
  id: number;
  ticker: string;
  company_name: string;
  market: CountryEnum;
  quantity: number;
  average_buy_price: number;
  total_invested: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
}

export interface PortfolioSummary {
  virtual_balance_usd: number;
  virtual_balance_inr: number;
  total_invested_usd: number;
  total_current_value_usd: number;
  total_pnl_usd: number;
  total_pnl_percent_usd: number;
  holdings: HoldingItem[];
  sector_allocation: Record<string, number>;
}

export interface Transaction {
  id: number;
  ticker: string;
  company_name: string;
  transaction_type: TransactionTypeEnum;
  market: CountryEnum;
  quantity: number;
  price_per_share: number;
  total_amount: number;
  currency: string;
  timestamp: string;
}

export interface Recommendation {
  ticker: string;
  recommendation: RecommendationEnum;
  confidence: number;
  summary: string;
  technical_analysis: string;
  fundamental_analysis: string;
  risk_assessment: string;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  time_horizon: string;
  reasons: string[];
  supporting_indicators: string[];
  potential_risks: string[];
  alternative_stocks: string[];
  disclaimer: string;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  ticker: string;
  company_name: string;
  market: CountryEnum;
  notes?: string;
  target_alert_price?: number;
  current_price?: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  sources?: string[];
  timestamp: string;
}

export interface AdminStats {
  total_users: number;
  total_transactions: number;
  total_companies: number;
  active_portfolios: number;
  system_health: string;
}
