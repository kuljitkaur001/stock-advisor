import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCountry } from '../context/CountryContext';
import { Card, Badge, Skeleton } from '../components/ui/UIComponents';
import { StockSearch } from '../components/stock/StockSearch';
import { StockCard } from '../components/stock/StockCard';
import { portfolioApi, stocksApi, aiApi } from '../api';
import { PortfolioSummary, StockQuote, Recommendation } from '../types';
import { Wallet, TrendingUp, TrendingDown, Sparkles, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { country, currency } = useCountry();

  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [trendingStocks, setTrendingStocks] = useState<StockQuote[]>([]);
  const [topPickRec, setTopPickRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [portData, stocksData, recData] = await Promise.all([
          portfolioApi.getSummary(),
          stocksApi.search('', country),
          aiApi.getRecommendation(country === 'IN' ? 'RELIANCE.NS' : 'AAPL')
        ]);
        setPortfolio(portData);

        // Fetch detailed quotes for trending stocks
        const quotes = await Promise.all(
          stocksData.slice(0, 4).map((s) => stocksApi.getQuote(s.ticker))
        );
        setTrendingStocks(quotes);
        setTopPickRec(recData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [country]);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            Welcome, {user?.full_name} <span className="text-emerald-400">👋</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time market insights & virtual portfolio performance overview ({country === 'IN' ? 'Indian NSE' : 'US Markets'})
          </p>
        </div>

        <StockSearch />
      </div>

      {/* Account Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase">Virtual Cash ({currency})</span>
            <span className="text-xl font-bold font-mono text-slate-100">
              {country === 'IN'
                ? formatCurrency(portfolio?.virtual_balance_inr || 8000000, 'INR')
                : formatCurrency(portfolio?.virtual_balance_usd || 100000, 'USD')}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase">Total Portfolio Value</span>
            <span className="text-xl font-bold font-mono text-slate-100">
              {formatCurrency(portfolio?.total_current_value_usd || 0, 'USD')}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase">Total Invested</span>
            <span className="text-xl font-bold font-mono text-slate-100">
              {formatCurrency(portfolio?.total_invested_usd || 0, 'USD')}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${(portfolio?.total_pnl_usd || 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            {(portfolio?.total_pnl_usd || 0) >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase">Unrealized PnL</span>
            <span className={`text-xl font-bold font-mono ${(portfolio?.total_pnl_usd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(portfolio?.total_pnl_usd || 0, 'USD')} ({formatPercent(portfolio?.total_pnl_percent_usd || 0)})
            </span>
          </div>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trending Market Stocks */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Trending {country === 'IN' ? 'NSE' : 'US'} Equities</h2>
            <Link to="/explore" className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1">
              Explore All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trendingStocks.map((quote) => (
                <StockCard key={quote.ticker} quote={quote} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Top Pick Widget & Quick Chat Trigger */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-slate-100">Featured AI Spotlight</h2>

          {topPickRec && (
            <Card className="neon-border-green space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-slate-100">{topPickRec.ticker} AI Rating</span>
                </div>
                <Badge variant={topPickRec.recommendation === 'BUY' ? 'green' : 'yellow'}>
                  {topPickRec.recommendation} ({topPickRec.confidence}%)
                </Badge>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                {topPickRec.summary}
              </p>

              <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-3">
                <span className="text-slate-400">Target: <strong className="text-emerald-400">{formatCurrency(topPickRec.target_price, currency)}</strong></span>
                <Link
                  to={`/stock/${topPickRec.ticker}`}
                  className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  Full Analysis <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          )}

          <Card className="glass-card p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-100">Ask AI Financial Advisor</h4>
            <p className="text-xs text-slate-400">Have questions about stock trends or portfolio diversification?</p>
            <Link
              to="/ai-chat"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              Open AI Chatbot <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
