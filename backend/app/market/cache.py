import time
import threading
import logging
from typing import Dict, Any, Optional, Tuple, List
from app.config import settings

logger = logging.getLogger(__name__)

class CacheEntry:
    def __init__(self, data: Any, ttl: int):
        self.data = data
        self.timestamp = time.time()
        self.ttl = ttl

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.timestamp) > self.ttl

class MultiTierCache:
    """
    Thread-safe multi-tier cache store supporting:
      - Separate TTLs per data category (MarketData, History, Indicators, News, Recommendations, Search)
      - Stale-while-revalidate fallback for zero-latency responses
      - Cache statistics & hit ratio monitoring
    """
    def __init__(self):
        self._market_data: Dict[str, CacheEntry] = {}
        self._history: Dict[str, CacheEntry] = {}
        self._indicators: Dict[str, CacheEntry] = {}
        self._news: Dict[str, CacheEntry] = {}
        self._recommendations: Dict[str, CacheEntry] = {}
        self._search: Dict[str, CacheEntry] = {}
        
        self._stale_market_data: Dict[str, Any] = {}
        self._stale_history: Dict[str, Any] = {}

        self._lock = threading.Lock()

        # Metrics
        self.hits = 0
        self.misses = 0
        self.stale_hits = 0
        self.dedup_saved = 0

    # --- MARKET DATA OBJECT ---
    def get_market_data(self, ticker: str) -> Optional[Any]:
        key = ticker.upper()
        with self._lock:
            entry = self._market_data.get(key)
            if entry:
                if not entry.is_expired:
                    self.hits += 1
                    return entry.data
                else:
                    self.stale_hits += 1
            else:
                self.misses += 1
        return None

    def get_stale_market_data(self, ticker: str) -> Optional[Any]:
        key = ticker.upper()
        with self._lock:
            entry = self._market_data.get(key)
            if entry:
                return entry.data
            return self._stale_market_data.get(key)

    def set_market_data(self, ticker: str, data: Any, ttl: Optional[int] = None):
        key = ticker.upper()
        ttl_val = ttl if ttl is not None else settings.CACHE_TTL_MARKET_DATA
        with self._lock:
            self._market_data[key] = CacheEntry(data, ttl_val)
            self._stale_market_data[key] = data

    # --- HISTORY / CANDLES ---
    def get_history(self, ticker: str, period: str, interval: str) -> Optional[Any]:
        key = f"{ticker.upper()}_{period}_{interval}"
        with self._lock:
            entry = self._history.get(key)
            if entry and not entry.is_expired:
                self.hits += 1
                return entry.data
            if entry:
                self.stale_hits += 1
            else:
                self.misses += 1
        return None

    def set_history(self, ticker: str, period: str, interval: str, data: Any, ttl: Optional[int] = None):
        key = f"{ticker.upper()}_{period}_{interval}"
        ttl_val = ttl if ttl is not None else settings.CACHE_TTL_HISTORY
        with self._lock:
            self._history[key] = CacheEntry(data, ttl_val)
            self._stale_history[key] = data

    # --- INDICATORS ---
    def get_indicators(self, ticker: str, period: str) -> Optional[Any]:
        key = f"{ticker.upper()}_{period}"
        with self._lock:
            entry = self._indicators.get(key)
            if entry and not entry.is_expired:
                self.hits += 1
                return entry.data
        return None

    def set_indicators(self, ticker: str, period: str, data: Any, ttl: Optional[int] = None):
        key = f"{ticker.upper()}_{period}"
        ttl_val = ttl if ttl is not None else settings.CACHE_TTL_INDICATORS
        with self._lock:
            self._indicators[key] = CacheEntry(data, ttl_val)

    # --- RECOMMENDATIONS ---
    def get_recommendation(self, ticker: str) -> Optional[Any]:
        key = ticker.upper()
        with self._lock:
            entry = self._recommendations.get(key)
            if entry and not entry.is_expired:
                self.hits += 1
                return entry.data
        return None

    def set_recommendation(self, ticker: str, data: Any, ttl: Optional[int] = None):
        key = ticker.upper()
        ttl_val = ttl if ttl is not None else settings.CACHE_TTL_RECOMMENDATIONS
        with self._lock:
            self._recommendations[key] = CacheEntry(data, ttl_val)

    # --- SEARCH ---
    def get_search(self, query_key: str) -> Optional[Any]:
        key = query_key.strip().upper()
        with self._lock:
            entry = self._search.get(key)
            if entry and not entry.is_expired:
                self.hits += 1
                return entry.data
        return None

    def set_search(self, query_key: str, data: Any, ttl: Optional[int] = None):
        key = query_key.strip().upper()
        ttl_val = ttl if ttl is not None else settings.CACHE_TTL_SEARCH
        with self._lock:
            self._search[key] = CacheEntry(data, ttl_val)

    # --- METRICS & UTILS ---
    def record_dedup(self):
        with self._lock:
            self.dedup_saved += 1

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            total_queries = self.hits + self.misses
            hit_ratio = round((self.hits / total_queries * 100), 2) if total_queries > 0 else 0.0
            return {
                "hits": self.hits,
                "misses": self.misses,
                "stale_hits": self.stale_hits,
                "dedup_saved_requests": self.dedup_saved,
                "hit_ratio_percent": hit_ratio,
                "cached_tickers_count": len(self._market_data)
            }

    def clear(self):
        with self._lock:
            self._market_data.clear()
            self._history.clear()
            self._indicators.clear()
            self._news.clear()
            self._recommendations.clear()
            self._search.clear()
            self._stale_market_data.clear()
            self._stale_history.clear()
            self.hits = 0
            self.misses = 0
            self.stale_hits = 0
            self.dedup_saved = 0

# Global multi-tier cache instance
market_cache = MultiTierCache()
