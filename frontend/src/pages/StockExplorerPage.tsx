import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCountry } from '../context/CountryContext';
import { StockSearch, getRecentSearches } from '../components/stock/StockSearch';
import { Card } from '../components/ui/UIComponents';
import { stocksApi, watchlistApi } from '../api';
import { StockSearchResult, WatchlistItem } from '../types';
import { Search, Compass, Filter, TrendingUp, Clock, Bookmark, ChevronRight, Building2 } from 'lucide-react';

// Static Trending Equities Index (Metadata only, ZERO live price requests)
const TRENDING_EQUITIES: Record<string, StockSearchResult[]> = {
  IN: [
    { ticker: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE', country: 'IN', sector: 'Energy', industry: 'Oil & Gas Integration' },
    { ticker: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', country: 'IN', sector: 'Technology', industry: 'IT Services' },
    { ticker: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', country: 'IN', sector: 'Technology', industry: 'IT Services' },
    { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', country: 'IN', sector: 'Financial Services', industry: 'Private Bank' },
    { ticker: 'TATAMOTORS.NS', name: 'Tata Motors Limited', exchange: 'NSE', country: 'IN', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
    { ticker: 'ICICIBANK.NS', name: 'ICICI Bank Limited', exchange: 'NSE', country: 'IN', sector: 'Financial Services', industry: 'Private Bank' }
  ],
  US: [
    { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', sector: 'Technology', industry: 'Consumer Electronics' },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', country: 'US', sector: 'Technology', industry: 'Semiconductors' },
    { ticker: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', country: 'US', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'US', sector: 'Technology', industry: 'Software' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'US', sector: 'Communication Services', industry: 'Internet Content' },
    { ticker: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', country: 'US', sector: 'Consumer Cyclical', industry: 'Internet Retail' }
  ]
};

export const StockExplorerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';

  const { country } = useCountry();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [recentSearches, setRecentSearches] = useState<StockSearchResult[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);

  // Load Recent Searches & User Watchlist on Mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
    
    const loadWatchlist = async () => {
      try {
        const items = await watchlistApi.getWatchlist();
        setWatchlistItems(items);
      } catch {
        // Watchlist fetch silent fallback if unauthenticated
      }
    };
    loadWatchlist();
  }, []);

  // Fetch Local Metadata Search Results (Zero Live Market Requests)
  const performSearch = async (queryStr: string) => {
    setSearchQuery(queryStr);
    if (!queryStr.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await stocksApi.search(queryStr, country);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search company index:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(initialQuery);
  }, [initialQuery, country]);

  const trendingList = TRENDING_EQUITIES[country] || TRENDING_EQUITIES['US'];

  // Sector Filters derived from search results or trending list
  const activeDataset = searchQuery.trim() ? searchResults : trendingList;
  const availableSectors = ['ALL', ...Array.from(new Set(activeDataset.map((s) => s.sector).filter(Boolean)))];

  const filteredResults = selectedSector === 'ALL'
    ? activeDataset
    : activeDataset.filter((s) => s.sector === selectedSector);

  const handleSelectStock = (ticker: string) => {
    navigate(`/stock/${ticker}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Search-First Hero Section */}
      <div className="relative glass-card p-8 md:p-12 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" /> Search-First Stock Explorer
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Find Equities Across {country === 'IN' ? 'Indian NSE Market' : 'US Stock Markets'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            Search our instant company metadata index. Select any equity to fetch live quotes, technical indicators, and AI analysis.
          </p>

          <div className="pt-2">
            <StockSearch
              onSearchSubmit={(q) => {
                setSearchParams({ search: q });
                performSearch(q);
              }}
              placeholder={country === 'IN' ? 'Search Reliance, TCS, Infosys, HDFC...' : 'Search Apple, Nvidia, Tesla, Microsoft...'}
              className="mx-auto"
            />
          </div>
        </div>
      </div>

      {/* Quick Shortcuts Grid: Recent Searches & Watchlist */}
      {!searchQuery.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Card className="p-6">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-emerald-400" /> Recent Searches
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {recentSearches.map((item) => (
                  <button
                    key={item.ticker}
                    onClick={() => handleSelectStock(item.ticker)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400 text-xs font-medium flex items-center gap-2 transition-all group shadow-sm"
                  >
                    <span className="font-mono font-bold text-emerald-400">{item.ticker}</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{item.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Watchlist Shortcuts */}
          {watchlistItems.length > 0 && (
            <Card className="p-6">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Bookmark className="w-4 h-4 text-sky-400" /> Watchlist Shortcuts
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {watchlistItems.slice(0, 6).map((item) => (
                  <button
                    key={item.ticker}
                    onClick={() => handleSelectStock(item.ticker)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 text-slate-200 hover:text-sky-400 text-xs font-medium flex items-center gap-2 transition-all group shadow-sm"
                  >
                    <span className="font-mono font-bold text-sky-400">{item.ticker}</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{item.company_name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Main Results / Trending Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            {searchQuery.trim() ? (
              <>
                <Search className="w-5 h-5 text-emerald-400" /> Search Results ({filteredResults.length})
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Trending Equities ({country === 'IN' ? 'NSE' : 'US'})
              </>
            )}
          </h2>

          {/* Sector Filter Chips */}
          {availableSectors.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar pb-1">
              <span className="text-slate-400 font-bold uppercase flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Sector:
              </span>
              {availableSectors.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec!)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    selectedSector === sec
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Company Metadata Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse p-5"></div>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <Card className="text-center py-12 text-slate-400 text-sm">
            No equities matched your query "{searchQuery}" or sector filter. Try searching for a ticker symbol or company name above.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResults.map((company) => (
              <Card
                key={company.ticker}
                onClick={() => handleSelectStock(company.ticker)}
                className="group cursor-pointer hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all p-5 flex flex-col justify-between"
                data-testid={`company-card-${company.ticker}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs rounded-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                      {company.ticker}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {company.exchange}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {company.name}
                  </h3>

                  {company.industry && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 line-clamp-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {company.industry}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-slate-400">{company.sector || 'General'}</span>
                  <span className="text-emerald-400 font-bold text-[11px] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
