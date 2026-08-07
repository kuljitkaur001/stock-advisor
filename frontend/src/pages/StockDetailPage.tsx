import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { stocksApi, aiApi, watchlistApi } from '../api';
import { StockQuote, CandlePoint, IndicatorsData, Recommendation } from '../types';
import { StockCandlestickChart } from '../components/charts/StockCandlestickChart';
import { RecommendationCard } from '../components/ai/RecommendationCard';
import { TradeModal } from '../components/portfolio/TradeModal';
import { ChatWindow } from '../components/ai/ChatWindow';
import { Card, Button, Badge, Skeleton } from '../components/ui/UIComponents';
import { TrendingUp, TrendingDown, Bookmark, Sparkles, ShoppingBag, Activity } from 'lucide-react';
import { formatCurrency, formatMarketCap, formatPercent } from '../utils/formatters';

export const StockDetailPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const tickerClean = (ticker || 'AAPL').toUpperCase();

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [indicators, setIndicators] = useState<IndicatorsData | undefined>(undefined);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      try {
        const [q, h, ind] = await Promise.all([
          stocksApi.getQuote(tickerClean),
          stocksApi.getHistory(tickerClean, '1Y'),
          stocksApi.getIndicators(tickerClean, '1Y')
        ]);
        setQuote(q);
        setCandles(h.candles);
        setIndicators(ind);
      } catch (err) {
        console.error('Failed to load stock detail data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStockData();
  }, [tickerClean]);

  const handleGenerateAI = async () => {
    setRecLoading(true);
    try {
      const rec = await aiApi.getRecommendation(tickerClean);
      setRecommendation(rec);
    } catch (err) {
      console.error('Failed to generate recommendation:', err);
    } finally {
      setRecLoading(false);
    }
  };

  const handleToggleWatchlist = async () => {
    try {
      if (!inWatchlist) {
        await watchlistApi.addToWatchlist({ ticker: tickerClean });
        setInWatchlist(true);
      }
    } catch {
      // Ignored
    }
  };

  if (loading || !quote) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-100">{quote.ticker}</h1>
            <Badge variant={quote.country === 'IN' ? 'orange' : 'blue' as any}>{quote.exchange}</Badge>
            <span className="text-xs text-slate-400 font-semibold">{quote.sector} • {quote.industry}</span>
          </div>
          <h2 className="text-sm text-slate-400 font-medium mt-1">{quote.name}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-slate-100 block">
              {formatCurrency(quote.current_price, quote.currency)}
            </span>
            <span className={`text-xs font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {formatCurrency(quote.change, quote.currency)} ({formatPercent(quote.percent_change)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setTradeModalOpen(true)} variant="primary">
              <ShoppingBag className="w-4 h-4" /> Trade Stock
            </Button>
            <Button onClick={handleToggleWatchlist} variant="secondary" data-testid="bookmark-button">
              <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-emerald-400 text-emerald-400' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Fundamentals Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Market Cap</span>
          <span className="text-sm font-bold font-mono text-slate-200">{formatMarketCap(quote.market_cap, quote.currency)}</span>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">P/E Ratio</span>
          <span className="text-sm font-bold font-mono text-slate-200">{quote.pe_ratio ? quote.pe_ratio : 'N/A'}</span>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">52W High</span>
          <span className="text-sm font-bold font-mono text-emerald-400">{formatCurrency(quote.high_52w || 0, quote.currency)}</span>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">52W Low</span>
          <span className="text-sm font-bold font-mono text-rose-400">{formatCurrency(quote.low_52w || 0, quote.currency)}</span>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Day Range</span>
          <span className="text-xs font-bold font-mono text-slate-200">{quote.day_low} - {quote.day_high}</span>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Volume</span>
          <span className="text-sm font-bold font-mono text-slate-200">{quote.volume.toLocaleString()}</span>
        </Card>
      </div>

      {/* Main Chart Section */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" /> Technical Trading Chart
        </h3>
        <StockCandlestickChart candles={candles} indicators={indicators} currency={quote.currency} />
      </Card>

      {/* AI Recommendation & AI Advisor Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: AI Recommendation Engine */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> LangGraph AI Analysis
            </h3>
            {!recommendation && (
              <Button onClick={handleGenerateAI} disabled={recLoading} variant="primary">
                {recLoading ? 'Running LangGraph Agent...' : 'Generate Rating'}
              </Button>
            )}
          </div>

          {recommendation ? (
            <RecommendationCard rec={recommendation} currency={quote.currency} />
          ) : (
            <Card className="text-center py-12 space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
              <h4 className="text-sm font-bold text-slate-200">Run LangGraph Multi-Node Analysis</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Evaluates RSI momentum, MACD signals, support/resistance levels, and generates structured Buy/Hold/Sell target prices.
              </p>
              <Button onClick={handleGenerateAI} disabled={recLoading} variant="primary">
                {recLoading ? 'Analyzing...' : 'Generate AI Recommendation'}
              </Button>
            </Card>
          )}
        </div>

        {/* Right: Embedded Stock Financial Chatbot */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-100">Ask AI Advisor About {quote.ticker}</h3>
          <ChatWindow tickerContext={quote.ticker} />
        </div>
      </div>

      {/* Trade Modal Trigger */}
      <TradeModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        quote={quote}
      />
    </div>
  );
};
