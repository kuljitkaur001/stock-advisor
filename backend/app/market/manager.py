import asyncio
import logging
import time
import traceback
from typing import Dict, Any, List, Optional
import pandas as pd
from app.market.models import MarketData
from app.market.cache import market_cache
from app.market.providers.base import BaseMarketDataProvider
from app.market.providers.finnhub import FinnhubProvider
from app.market.providers.twelvedata import TwelveDataProvider
from app.market.providers.alphavantage import AlphaVantageProvider
from app.market.providers.yfinance import YFinanceProvider
from app.market.providers.fallback import SyntheticFallbackProvider
from app.utils.indicators import compute_all_indicators

from app.schemas.schemas import StockQuoteResponse, CandlePoint, IndicatorsResponse, StockSearchResult

logger = logging.getLogger(__name__)

# Popular pre-seeded stocks list for instant search & dashboard
POPULAR_STOCKS_DATA = [
    {"ticker": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "country": "US", "sector": "Technology", "industry": "Consumer Electronics"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "country": "US", "sector": "Technology", "industry": "Semiconductors"},
    {"ticker": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ", "country": "US", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "country": "US", "sector": "Technology", "industry": "Software"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "country": "US", "sector": "Communication Services", "industry": "Internet Content"},
    {"ticker": "AMZN", "name": "Amazon.com, Inc.", "exchange": "NASDAQ", "country": "US", "sector": "Consumer Cyclical", "industry": "Internet Retail"},
    {"ticker": "META", "name": "Meta Platforms, Inc.", "exchange": "NASDAQ", "country": "US", "sector": "Communication Services", "industry": "Internet Content"},
    {"ticker": "AMD", "name": "Advanced Micro Devices, Inc.", "exchange": "NASDAQ", "country": "US", "sector": "Technology", "industry": "Semiconductors"},
    {"ticker": "RELIANCE.NS", "name": "Reliance Industries Limited", "exchange": "NSE", "country": "IN", "sector": "Energy", "industry": "Oil & Gas Integration"},
    {"ticker": "TCS.NS", "name": "Tata Consultancy Services Limited", "exchange": "NSE", "country": "IN", "sector": "Technology", "industry": "IT Services"},
    {"ticker": "INFY.NS", "name": "Infosys Limited", "exchange": "NSE", "country": "IN", "sector": "Technology", "industry": "IT Services"},
    {"ticker": "HDFCBANK.NS", "name": "HDFC Bank Limited", "exchange": "NSE", "country": "IN", "sector": "Financial Services", "industry": "Private Bank"},
    {"ticker": "ICICIBANK.NS", "name": "ICICI Bank Limited", "exchange": "NSE", "country": "IN", "sector": "Financial Services", "industry": "Private Bank"},
    {"ticker": "TATAMOTORS.NS", "name": "Tata Motors Limited", "exchange": "NSE", "country": "IN", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers"},
    {"ticker": "BHARTIARTL.NS", "name": "Bharti Airtel Limited", "exchange": "NSE", "country": "IN", "sector": "Communication Services", "industry": "Telecom Services"},
    {"ticker": "WIPRO.NS", "name": "Wipro Limited", "exchange": "NSE", "country": "IN", "sector": "Technology", "industry": "IT Services"},
]

class MarketDataManager:
    """
    Centralized Singleton Market Data Orchestrator.
    Guarantees ONE FETCH PER TICKER across the entire backend ecosystem.
    
    Architecture Flow:
      Router/Service -> MarketDataManager -> Cache -> Single-Flight Deduplication -> Provider Chain -> Return MarketData
    """
    def __init__(self):
        # Ordered Provider Pipeline (YFinance -> Finnhub -> Twelve Data -> Alpha Vantage)
        self.providers: List[BaseMarketDataProvider] = [
            YFinanceProvider(),
            FinnhubProvider(),
            TwelveDataProvider(),
            AlphaVantageProvider()
        ]
        
        # Async Single-Flight Lock Map for Request Deduplication
        self._in_flight: Dict[str, asyncio.Event] = {}
        self._in_flight_results: Dict[str, MarketData] = {}
        self._in_flight_lock = asyncio.Lock()

    async def get_market_data(self, ticker: str, force_refresh: bool = False) -> MarketData:
        ticker_clean = ticker.strip().upper()

        # 1. Check Active Cache
        if not force_refresh:
            cached_data = market_cache.get_market_data(ticker_clean)
            if cached_data:
                return cached_data

            # Check Stale Cache (return stale immediately & background refresh)
            stale_data = market_cache.get_stale_market_data(ticker_clean)
            if stale_data:
                logger.info(f"Returning stale cache for {ticker_clean} & scheduling background refresh")
                asyncio.create_task(self._background_refresh(ticker_clean))
                return stale_data

        # 2. Request Deduplication (Single-Flight Pattern)
        event_to_wait = None
        async with self._in_flight_lock:
            if ticker_clean in self._in_flight:
                # Concurrent request for same ticker detected!
                market_cache.record_dedup()
                logger.info(f"⚡ Request deduplication: Wait for existing in-flight fetch for {ticker_clean}")
                event_to_wait = self._in_flight[ticker_clean]
            else:
                event = asyncio.Event()
                self._in_flight[ticker_clean] = event

        if event_to_wait:
            await event_to_wait.wait()
            async with self._in_flight_lock:
                return self._in_flight_results.get(ticker_clean) or market_cache.get_stale_market_data(ticker_clean)

        # 3. Execute Fetch via Provider Chain
        market_data: Optional[MarketData] = None
        try:
            for provider in self.providers:
                try:
                    logger.debug(f"Attempting fetch for {ticker_clean} via provider: {provider.name}")
                    market_data = await provider.fetch_market_data(ticker_clean)
                    if market_data and market_data.quote:
                        logger.info(f"✨ Successfully fetched {ticker_clean} via {provider.name}")
                        break
                
                    
                except Exception as ex:
                    logger.error(f"Provider {provider.name} failed for {ticker_clean}")
                    traceback.print_exc()

            if not market_data or not market_data.quote:
                logger.warning(f"Could not retrieve market data for {ticker_clean}")
                return None

                

            # 4. Attach Technical Indicators Calculation
            self._compute_and_attach_indicators(market_data)

            # 5. Save to Cache
            market_cache.set_market_data(ticker_clean, market_data)

        finally:
            # Release single-flight waiters
            async with self._in_flight_lock:
                if market_data:
                    self._in_flight_results[ticker_clean] = market_data
                if ticker_clean in self._in_flight:
                    evt = self._in_flight.pop(ticker_clean)
                    evt.set()

        return market_data

    async def get_market_data_batch(self, tickers: List[str]) -> Dict[str, MarketData]:
        """Fetch MarketData for multiple tickers concurrently in 1 operation."""
        unique_tickers = list(set(t.strip().upper() for t in tickers if t))
        if not unique_tickers:
            return {}
        tasks = [self.get_market_data(t) for t in unique_tickers]
        results = await asyncio.gather(*tasks)
        return {t: res for t, res in zip(unique_tickers, results)}

    async def search_stocks(self, query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        query_clean = query.strip().upper()
        cache_key = f"SEARCH_{query_clean}_{country or 'ALL'}"
        
        cached = market_cache.get_search(cache_key)
        if cached is not None:
            return cached

        results: List[StockSearchResult] = []
        for stock in POPULAR_STOCKS_DATA:
            if country and stock["country"].upper() != country.upper():
                continue
            ticker_match = query_clean in stock["ticker"].upper()
            name_match = query_clean in stock["name"].upper()
            sector_match = query_clean in stock.get("sector", "").upper()
            industry_match = query_clean in stock.get("industry", "").upper()
            if not query_clean or ticker_match or name_match or sector_match or industry_match:
                results.append(StockSearchResult(**stock))

        market_cache.set_search(cache_key, results)
        return results

    def _compute_and_attach_indicators(self, market_data: MarketData):
        """Calculate local technical indicators on MarketData candles."""
        if market_data.indicators is not None:
            return

        df = getattr(market_data, '_dataframe', None)
        if df is None or df.empty:
            if market_data.candles:
                records = [c.model_dump() for c in market_data.candles]
                df = pd.DataFrame(records)
                df.rename(columns={
                    "open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume"
                }, inplace=True)
            else:
                return

        df_calc = df.copy()
        df_calc.columns = [c.lower() for c in df_calc.columns]
        indicator_data = compute_all_indicators(df_calc)

        timestamps = [str(t) for t in df_calc.index]
        if "timestamp" in df_calc.columns:
            timestamps = [str(t) for t in df_calc["timestamp"].values]

        close_prices = [round(float(val), 2) for val in df_calc['close'].values]

        ind_response = IndicatorsResponse(
            ticker=market_data.ticker,
            timestamps=timestamps,
            close_prices=close_prices,
            sma_20=indicator_data.get("sma_20", []),
            sma_50=indicator_data.get("sma_50", []),
            ema_20=indicator_data.get("ema_20", []),
            rsi=indicator_data.get("rsi", []),
            macd=indicator_data.get("macd", {"macd": [], "signal": [], "histogram": []}),
            atr=indicator_data.get("atr", []),
            bollinger_bands=indicator_data.get("bollinger_bands", {"upper": [], "middle": [], "lower": []}),
            vwap=indicator_data.get("vwap", []),
            obv=indicator_data.get("obv", []),
            adx=indicator_data.get("adx", [])
        )
        market_data.indicators = ind_response

    async def _background_refresh(self, ticker: str):
        try:
            logger.info(f"Executing background refresh for {ticker}")
            await self.get_market_data(ticker, force_refresh=True)
        except Exception as e:
            logger.warning(f"Background refresh failed for {ticker}: {e}")

# Global singleton MarketDataManager instance
market_data_manager = MarketDataManager()
