import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { watchlistApi } from '../api';
import { WatchlistItem } from '../types';
import { Card, Button, Badge, Skeleton } from '../components/ui/UIComponents';
import { Bookmark, Trash2, ArrowRight, Bell } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const items = await watchlistApi.getWatchlist();
      setWatchlist(items);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (id: number) => {
    try {
      await watchlistApi.removeFromWatchlist(id);
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to remove watchlist item:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-emerald-400" /> Watchlist & Price Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">Track target price alerts and notes for your favorite stocks</p>
        </div>
      </div>

      {/* Watchlist Cards List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : watchlist.length === 0 ? (
        <Card className="text-center py-12 text-slate-400 text-sm space-y-3">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <p>Your watchlist is empty. Add stocks from the Explorer or Detail pages.</p>
          <Link to="/explore" className="inline-block px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs">
            Browse Stocks
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {watchlist.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-extrabold text-lg text-slate-100">{item.ticker}</span>
                  <Badge variant={item.market === 'IN' ? 'orange' : 'blue' as any}>{item.market}</Badge>
                </div>
                <h4 className="text-xs text-slate-400 font-medium mb-3">{item.company_name}</h4>

                {item.current_price && (
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold font-mono text-slate-100">
                      {formatCurrency(item.current_price, item.market === 'IN' ? 'INR' : 'USD')}
                    </span>
                  </div>
                )}

                {item.target_alert_price && (
                  <div className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <Bell className="w-3.5 h-3.5" /> Alert Target: {formatCurrency(item.target_alert_price, item.market === 'IN' ? 'INR' : 'USD')}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <Link
                  to={`/stock/${item.ticker}`}
                  className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
