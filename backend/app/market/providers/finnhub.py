import logging
import time
import httpx
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.market.providers.base import BaseMarketDataProvider
from app.market.models import MarketData, NewsArticle
from app.schemas.schemas import StockQuoteResponse, CandlePoint, StockSearchResult
from app.config import settings

logger = logging.getLogger(__name__)

class FinnhubProvider(BaseMarketDataProvider):
    name = "Finnhub"

    def __init__(self):
        self.api_key = settings.FINNHUB_API_KEY
        self.base_url = "https://finnhub.io/api/v1"

    async def fetch_market_data(self, ticker: str) -> Optional[MarketData]:
        if not self.api_key:
            logger.debug("Finnhub API key not configured. Skipping Finnhub provider.")
            return None

        ticker_clean = ticker.upper()
        is_indian = ticker_clean.endswith(".NS") or ticker_clean.endswith(".BO")
        
        # Finnhub handles US symbols best directly (e.g. AAPL, NVDA, TSLA)
        # For Indian symbols, Finnhub uses ticker without .NS or .NS depending on tier
        finnhub_symbol = ticker_clean.replace(".NS", "") if is_indian else ticker_clean

        async with httpx.AsyncClient(timeout=6.0, limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)) as client:
            try:
                # 1. Quote
                quote_resp = await client.get(f"{self.base_url}/quote", params={"symbol": finnhub_symbol, "token": self.api_key})
                if quote_resp.status_code != 200:
                    logger.warning(f"Finnhub quote returned status {quote_resp.status_code} for {ticker_clean}")
                    return None
                qdata = quote_resp.json()
                current_price = qdata.get("c")
                if not current_price or current_price == 0:
                    return None

                # 2. Company Profile
                profile_resp = await client.get(f"{self.base_url}/stock/profile2", params={"symbol": finnhub_symbol, "token": self.api_key})
                pdata = profile_resp.json() if profile_resp.status_code == 200 else {}

                # 3. Candles (last 1 year)
                now_ts = int(time.time())
                from_ts = now_ts - (365 * 24 * 3600)
                candle_resp = await client.get(f"{self.base_url}/stock/candle", params={
                    "symbol": finnhub_symbol, "resolution": "D", "from": from_ts, "to": now_ts, "token": self.api_key
                })
                cdata = candle_resp.json() if candle_resp.status_code == 200 else {}

                # Build candles list
                candles: List[CandlePoint] = []
                df_data = []
                if cdata.get("s") == "ok" and cdata.get("t"):
                    timestamps = cdata.get("t", [])
                    opens = cdata.get("o", [])
                    highs = cdata.get("h", [])
                    lows = cdata.get("l", [])
                    closes = cdata.get("c", [])
                    volumes = cdata.get("v", [])

                    for i in range(len(timestamps)):
                        dt_str = datetime.utcfromtimestamp(timestamps[i]).strftime('%Y-%m-%d')
                        cp = CandlePoint(
                            timestamp=dt_str,
                            open=round(float(opens[i]), 2),
                            high=round(float(highs[i]), 2),
                            low=round(float(lows[i]), 2),
                            close=round(float(closes[i]), 2),
                            volume=round(float(volumes[i]), 0)
                        )
                        candles.append(cp)
                        df_data.append({
                            "Open": opens[i], "High": highs[i], "Low": lows[i], "Close": closes[i], "Volume": volumes[i]
                        })

                # 4. News
                today_str = datetime.utcnow().strftime('%Y-%m-%d')
                prev_str = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')
                news_resp = await client.get(f"{self.base_url}/company-news", params={
                    "symbol": finnhub_symbol, "from": prev_str, "to": today_str, "token": self.api_key
                })
                news_list: List[NewsArticle] = []
                if news_resp.status_code == 200:
                    for item in news_resp.json()[:5]:
                        news_list.append(NewsArticle(
                            title=item.get("headline", ""),
                            url=item.get("url", ""),
                            source=item.get("source", "Finnhub"),
                            published_at=datetime.utcfromtimestamp(item.get("datetime", now_ts)).isoformat(),
                            summary=item.get("summary", "")
                        ))

                # Assemble StockQuoteResponse
                prev_close = float(qdata.get("pc", current_price))
                change = float(qdata.get("d", current_price - prev_close))
                pct_change = float(qdata.get("dp", (change / prev_close * 100) if prev_close else 0.0))

                currency = "INR" if is_indian else pdata.get("currency", "USD")
                country = "IN" if is_indian else pdata.get("country", "US")
                exchange = "NSE" if is_indian else pdata.get("exchange", "NASDAQ")

                mcap = pdata.get("marketCapitalization")
                market_cap = float(mcap * 1000000) if mcap else None

                quote = StockQuoteResponse(
                    ticker=ticker_clean,
                    name=pdata.get("name") or ticker_clean,
                    current_price=round(float(current_price), 2),
                    change=round(change, 2),
                    percent_change=round(pct_change, 2),
                    day_high=round(float(qdata.get("h", current_price)), 2),
                    day_low=round(float(qdata.get("l", current_price)), 2),
                    open_price=round(float(qdata.get("o", current_price)), 2),
                    previous_close=round(prev_close, 2),
                    volume=int(cdata.get("v", [-1])[-1]) if cdata.get("v") else 1000000,
                    market_cap=market_cap,
                    pe_ratio=None,
                    dividend_yield=None,
                    high_52w=round(max([c.high for c in candles]), 2) if candles else None,
                    low_52w=round(min([c.low for c in candles]), 2) if candles else None,
                    sector=pdata.get("finnhubIndustry") or "Technology",
                    industry=pdata.get("finnhubIndustry") or "Software",
                    exchange=exchange,
                    country=country,
                    currency=currency,
                    last_updated=datetime.utcnow().isoformat()
                )

                market_data = MarketData(
                    ticker=ticker_clean,
                    quote=quote,
                    candles=candles,
                    news=news_list,
                    provider_name=self.name
                )

                if df_data:
                    df = pd.DataFrame(df_data)
                    market_data._dataframe = df

                logger.info(f"Successfully fetched MarketData for {ticker_clean} via Finnhub")
                return market_data

            except Exception as e:
                logger.warning(f"Finnhub provider failed for {ticker_clean}: {e}")
                return None

    async def search_stocks(self, query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        if not self.api_key:
            return []
        async with httpx.AsyncClient(timeout=4.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/search", params={"q": query, "token": self.api_key})
                if resp.status_code == 200:
                    results = []
                    for item in resp.json().get("result", [])[:10]:
                        results.append(StockSearchResult(
                            ticker=item.get("symbol"),
                            name=item.get("description"),
                            exchange=item.get("displaySymbol", "NASDAQ"),
                            country=country or "US",
                            sector="Technology"
                        ))
                    return results
            except Exception as e:
                logger.warning(f"Finnhub search failed: {e}")
        return []
