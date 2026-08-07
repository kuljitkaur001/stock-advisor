import React from 'react';
import { Link } from 'react-router-dom';
import { StockQuote } from '../../types';
import { Card, Badge } from '../ui/UIComponents';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { formatCurrency, formatMarketCap, formatPercent } from '../../utils/formatters';

export const StockCard: React.FC<{ quote: StockQuote }> = ({ quote }) => {
  const isPositive = quote.change >= 0;

  return (
    <Card className="flex flex-col justify-between h-full group hover:border-emerald-500/50 transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-extrabold text-lg text-slate-100 tracking-tight group-hover:text-emerald-400 transition-colors">
            {quote.ticker}
          </span>
          <Badge variant={quote.country === 'IN' ? 'orange' : 'blue' as any}>
            {quote.exchange}
          </Badge>
        </div>

        <h4 className="text-xs text-slate-400 line-clamp-1 font-medium mb-3">{quote.name}</h4>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-slate-100 font-mono">
            {formatCurrency(quote.current_price, quote.currency)}
          </span>
          <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(quote.percent_change)}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Market Cap</span>
          <span className="font-semibold text-slate-300">{formatMarketCap(quote.market_cap, quote.currency)}</span>
        </div>
        <Link
          to={`/stock/${quote.ticker}`}
          className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
};
