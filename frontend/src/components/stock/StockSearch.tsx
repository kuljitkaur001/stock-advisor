import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stocksApi } from '../../api';
import { StockSearchResult } from '../../types';
import { useCountry } from '../../context/CountryContext';

interface StockSearchProps {
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const RECENT_SEARCHES_KEY = 'alphaadvisor_recent_searches';

export const getRecentSearches = (): StockSearchResult[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRecentSearch = (item: StockSearchResult) => {
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter((s) => s.ticker !== item.ticker);
    const updated = [item, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent search:', e);
  }
};

export const StockSearch: React.FC<StockSearchProps> = ({
  onSearchSubmit,
  placeholder,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<StockSearchResult[]>([]);
  
  const { country } = useCountry();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounced search logic (300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const searchResults = await stocksApi.search(trimmed, country);
        setResults(searchResults);
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, country]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: StockSearchResult) => {
    saveRecentSearch(item);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    setQuery('');
    navigate(`/stock/${item.ticker}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
      setIsOpen(false);
    } else if (results.length > 0) {
      handleSelect(results[0]);
    } else {
      navigate(`/explore?search=${encodeURIComponent(trimmed)}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative w-full max-w-xl ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={
            placeholder ||
            (country === 'IN'
              ? 'Search Indian stocks (e.g. RELIANCE, TCS, INFY)...'
              : 'Search US stocks (e.g. AAPL, NVDA, TSLA)...')
          }
          className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-100 placeholder-slate-500 rounded-xl pl-11 pr-24 py-3 text-sm outline-none shadow-xl transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-20 text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-md shadow-emerald-500/20"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
          {/* Active Search Results */}
          {query.trim().length >= 2 && (
            <div>
              <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40 flex items-center justify-between">
                <span>Matching Equities ({results.length})</span>
                <span className="text-emerald-400 text-[10px]">Instant Local Search</span>
              </div>
              {isLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Searching company index...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No equities matching "{query}" found in company index.
                </div>
              ) : (
                results.map((item) => (
                  <button
                    key={item.ticker}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800/80 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded border border-emerald-500/20 group-hover:bg-emerald-500/20">
                        {item.ticker}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{item.exchange}</span>
                          {item.sector && <span>• {item.sector}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Prompt to type at least 2 chars */}
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className="p-4 text-center text-xs text-slate-400">
              Type at least 2 characters to search...
            </div>
          )}

          {/* Recent Searches Header & Items */}
          {recentSearches.length > 0 && query.trim().length === 0 && (
            <div>
              <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Recent Searches
              </div>
              {recentSearches.map((item) => (
                <button
                  key={item.ticker}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-emerald-400">
                      {item.ticker}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-xs">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">{item.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
