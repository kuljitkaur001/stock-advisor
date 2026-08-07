import logging
import httpx
from datetime import datetime
from typing import Optional, List
from app.market.providers.base import BaseMarketDataProvider
from app.market.models import MarketData
from app.schemas.schemas import StockQuoteResponse, StockSearchResult
from app.config import settings

logger = logging.getLogger(__name__)

class AlphaVantageProvider(BaseMarketDataProvider):
    name = "AlphaVantage"

    def __init__(self):
        self.api_key = settings.ALPHA_VANTAGE_API_KEY
        self.base_url = "https://www.alphavantage.co/query"

    async def fetch_market_data(self, ticker: str) -> Optional[MarketData]:
        if not self.api_key:
            logger.debug("Alpha Vantage API key not configured. Skipping AlphaVantage provider.")
            return None

        ticker_clean = ticker.upper()
        async with httpx.AsyncClient(timeout=6.0) as client:
            try:
                resp = await client.get(self.base_url, params={
                    "function": "GLOBAL_QUOTE",
                    "symbol": ticker_clean,
                    "apikey": self.api_key
                })
                if resp.status_code != 200:
                    return None
                data = resp.json().get("Global Quote", {})
                if not data or "05. price" not in data:
                    return None

                price = float(data["05. price"])
                change = float(data.get("09. change", "0"))
                pct_str = data.get("10. change percent", "0%").replace("%", "")
                pct_change = float(pct_str)

                quote = StockQuoteResponse(
                    ticker=ticker_clean,
                    name=ticker_clean,
                    current_price=round(price, 2),
                    change=round(change, 2),
                    percent_change=round(pct_change, 2),
                    day_high=round(float(data.get("03. high", price)), 2),
                    day_low=round(float(data.get("04. low", price)), 2),
                    open_price=round(float(data.get("02. open", price)), 2),
                    previous_close=round(float(data.get("08. previous close", price)), 2),
                    volume=int(data.get("06. volume", 1000000)),
                    market_cap=None,
                    pe_ratio=None,
                    dividend_yield=None,
                    high_52w=None,
                    low_52w=None,
                    sector="Technology",
                    industry="Software",
                    exchange="NASDAQ",
                    country="US",
                    currency="USD",
                    last_updated=datetime.utcnow().isoformat()
                )

                return MarketData(
                    ticker=ticker_clean,
                    quote=quote,
                    candles=[],
                    news=[],
                    provider_name=self.name
                )
            except Exception as e:
                logger.warning(f"AlphaVantage provider failed for {ticker_clean}: {e}")
                return None

    async def search_stocks(self, query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        return []
