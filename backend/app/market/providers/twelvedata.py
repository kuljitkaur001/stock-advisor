import logging
import httpx
import pandas as pd
from datetime import datetime
from typing import Optional, List
from app.market.providers.base import BaseMarketDataProvider
from app.market.models import MarketData
from app.schemas.schemas import StockQuoteResponse, CandlePoint, StockSearchResult
from app.config import settings

logger = logging.getLogger(__name__)

class TwelveDataProvider(BaseMarketDataProvider):
    name = "TwelveData"

    def __init__(self):
        self.api_key = settings.TWELVE_DATA_API_KEY
        self.base_url = "https://api.twelvedata.com"

    async def fetch_market_data(self, ticker: str) -> Optional[MarketData]:
        if not self.api_key:
            logger.debug("Twelve Data API key not configured. Skipping TwelveData provider.")
            return None

        ticker_clean = ticker.upper()
        async with httpx.AsyncClient(timeout=6.0, limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)) as client:
            try:
                quote_resp = await client.get(f"{self.base_url}/quote", params={"symbol": ticker_clean, "apikey": self.api_key})
                if quote_resp.status_code != 200:
                    return None
                qdata = quote_resp.json()
                if "price" not in qdata and "close" not in qdata:
                    return None

                price = float(qdata.get("price") or qdata.get("close") or 100.0)
                change = float(qdata.get("change") or 0.0)
                pct_change = float(qdata.get("percent_change") or 0.0)

                quote = StockQuoteResponse(
                    ticker=ticker_clean,
                    name=qdata.get("name") or ticker_clean,
                    current_price=round(price, 2),
                    change=round(change, 2),
                    percent_change=round(pct_change, 2),
                    day_high=round(float(qdata.get("high") or price), 2),
                    day_low=round(float(qdata.get("low") or price), 2),
                    open_price=round(float(qdata.get("open") or price), 2),
                    previous_close=round(float(qdata.get("previous_close") or price), 2),
                    volume=int(qdata.get("volume") or 1000000),
                    market_cap=None,
                    pe_ratio=None,
                    dividend_yield=None,
                    high_52w=float(qdata.get("fifty_two_week", {}).get("high")) if isinstance(qdata.get("fifty_two_week"), dict) else None,
                    low_52w=float(qdata.get("fifty_two_week", {}).get("low")) if isinstance(qdata.get("fifty_two_week"), dict) else None,
                    sector=qdata.get("sector") or "Technology",
                    industry=qdata.get("industry") or "Software",
                    exchange=qdata.get("exchange") or "NASDAQ",
                    country="US",
                    currency=qdata.get("currency") or "USD",
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
                logger.warning(f"TwelveData provider failed for {ticker_clean}: {e}")
                return None

    async def search_stocks(self, query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        return []
