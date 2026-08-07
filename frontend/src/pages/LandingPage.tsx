import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShieldCheck, Zap, Bot, BarChart3, Globe, Sparkles, ArrowRight } from 'lucide-react';
import { StockCard } from '../components/stock/StockCard';

export const LandingPage: React.FC = () => {
  const sampleStocks = [
    { ticker: 'AAPL', name: 'Apple Inc.', current_price: 189.45, change: 2.35, percent_change: 1.25, day_high: 190.10, day_low: 187.50, open_price: 188.00, previous_close: 187.10, volume: 45000000, market_cap: 2900000000000, pe_ratio: 29.5, exchange: 'NASDAQ', country: 'US', currency: 'USD', last_updated: '' },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', current_price: 880.20, change: 24.50, percent_change: 2.86, day_high: 885.00, day_low: 860.00, open_price: 865.00, previous_close: 855.70, volume: 55000000, market_cap: 2200000000000, pe_ratio: 65.2, exchange: 'NASDAQ', country: 'US', currency: 'USD', last_updated: '' },
    { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', current_price: 2980.50, change: 45.00, percent_change: 1.53, day_high: 2995.00, day_low: 2940.00, open_price: 2950.00, previous_close: 2935.50, volume: 8900000, market_cap: 20100000000000, pe_ratio: 28.1, exchange: 'NSE', country: 'IN', currency: 'INR', last_updated: '' },
    { ticker: 'TCS.NS', name: 'Tata Consultancy Services', current_price: 3950.00, change: -12.40, percent_change: -0.31, day_high: 3980.00, day_low: 3930.00, open_price: 3970.00, previous_close: 3962.40, volume: 3200000, market_cap: 14300000000000, pe_ratio: 31.4, exchange: 'NSE', country: 'IN', currency: 'INR', last_updated: '' },
  ];

  return (
    <div className="space-y-24 py-12">
      {/* Hero Banner */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Stock Intelligence Engine
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          AI Stock Analysis & <br />
          <span className="text-emerald-400">Virtual Portfolio Advisor</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Master equity trading across both <strong className="text-slate-200">US (NASDAQ, NYSE)</strong> and <strong className="text-slate-200">Indian (NSE)</strong> markets with real-time technical indicators, virtual cash portfolios, and LangGraph multi-node AI recommendations.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/signup"
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2"
          >
            Start Virtual Trading ($100k Cash) <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/explore"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all"
          >
            Explore Live Stocks
          </Link>
        </div>
      </section>

      {/* Featured Market Stock Cards Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Live Market Overview</h2>
            <p className="text-xs text-slate-400">Indian NSE & US Equities quotes preview</p>
          </div>
          <Link to="/explore" className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1">
            View All Stocks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sampleStocks.map((quote) => (
            <StockCard key={quote.ticker} quote={quote as any} />
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">9 Math Technical Indicators</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vectorized SMA, EMA, RSI, MACD, ATR, Bollinger Bands, VWAP, OBV, and ADX computed live across dynamic timeframes.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">LangGraph AI Advisor</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-node state machine workflow evaluating trend, momentum, support/resistance, and generating structured Buy/Hold/Sell target prices.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Dual Market Virtual Account</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Practice virtual trading with $100,000 USD and ₹8,000,000 INR balances, zero financial risk, and instant PnL analytics.
          </p>
        </div>
      </section>
    </div>
  );
};
