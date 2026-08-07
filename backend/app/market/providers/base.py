from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from app.market.models import MarketData
from app.schemas.schemas import StockSearchResult

class BaseMarketDataProvider(ABC):
    """
    Abstract Base Market Data Provider interface.
    Every provider (Finnhub, Twelve Data, Alpha Vantage, yfinance, Synthetic Fallback)
    must implement this interface to fetch EVERYTHING needed for a ticker in one operation.
    """
    name: str = "base_provider"

    @abstractmethod
    async def fetch_market_data(self, ticker: str) -> Optional[MarketData]:
        """Fetch composite MarketData object for given ticker in 1 single operation."""
        pass

    @abstractmethod
    async def search_stocks(self, query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        """Search stocks by query string."""
        pass
