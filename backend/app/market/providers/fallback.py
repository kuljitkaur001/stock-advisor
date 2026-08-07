import logging
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Optional, List
from app.market.providers.base import BaseMarketDataProvider
from app.market.models import MarketData
from app.schemas.schemas import StockQuoteResponse, CandlePoint, StockSearchResult

logger = logging.getLogger(__name__)

class SyntheticFallbackProvider(BaseMarketDataProvider):
    name = "SyntheticFallback"

    async def fetch_market_data(self, ticker: str) -> Optional[MarketData]:
        ticker_clean = ticker.upper()
        is_indian = ticker_clean.endswith(".NS") or ticker_clean.endswith(".BO")
        currency = "INR" if is_indian else "USD"
        country = "IN" if is_indian else "US"
        exchange = "NSE" if is_indian else "NASDAQ"
        fallback_price = 2450.00 if is_indian else 185.50

        # Generate 100 historical candles deterministically
        np.random.seed(abs(hash(ticker_clean)) % (2**32))
        dates = pd.date_range(end=datetime.today(), periods=100, freq='D')
        returns = np.random.normal(0.001, 0.015, size=100)
        prices = fallback_price * np.exp(np.cumsum(returns))

        highs = prices * (1 + np.random.uniform(0.005, 0.015, size=100))
        lows = prices * (1 - np.random.uniform(0.005, 0.015, size=100))
        opens = prices * (1 + np.random.uniform(-0.008, 0.008, size=100))
        volumes = np.random.randint(500000, 5000000, size=100)

        df = pd.DataFrame({
            'Open': opens, 'High': highs, 'Low': lows, 'Close': prices, 'Volume': volumes
        }, index=dates)

        candles: List[CandlePoint] = []
        for index, row in df.iterrows():
            ts_str = index.strftime('%Y-%m-%d')
            candles.append(CandlePoint(
                timestamp=ts_str,
                open=round(float(row['Open']), 2),
                high=round(float(row['High']), 2),
                low=round(float(row['Low']), 2),
                close=round(float(row['Close']), 2),
                volume=round(float(row['Volume']), 0)
            ))

        cur_price = round(float(prices[-1]), 2)
        prev_close = round(float(prices[-2]), 2)
        change = round(cur_price - prev_close, 2)
        pct_change = round((change / prev_close * 100), 2) if prev_close else 0.0

        quote = StockQuoteResponse(
            ticker=ticker_clean,
            name=f"{ticker_clean} Corp",
            current_price=cur_price,
            change=change,
            percent_change=pct_change,
            day_high=round(cur_price * 1.02, 2),
            day_low=round(cur_price * 0.98, 2),
            open_price=round(cur_price * 0.99, 2),
            previous_close=prev_close,
            volume=int(volumes[-1]),
            market_cap=2500000000000.0,
            pe_ratio=28.5,
            dividend_yield=0.65,
            high_52w=round(max(prices), 2),
            low_52w=round(min(prices), 2),
            sector="Technology",
            industry="Software",
            exchange=exchange,
            country=country,
            currency=currency,
            last_updated=datetime.utcnow().isoformat()
        )

        mdata = MarketData(
            ticker=ticker_clean,
            quote=quote,
            candles=candles,
            news=[],
            provider_name=self.name
        )
        mdata._dataframe = df
        return mdata

    async def search_stocks(self, query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        return []
