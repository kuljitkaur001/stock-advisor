from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, PrivateAttr
import pandas as pd
from app.schemas.schemas import StockQuoteResponse, CandlePoint, IndicatorsResponse

class NewsArticle(BaseModel):
    title: str
    url: str
    source: str
    published_at: str
    summary: Optional[str] = None

class MarketData(BaseModel):
    """
    Unified composite MarketData object containing EVERYTHING needed for a ticker
    in ONE single operation:
      - Current Quote (Price, volume, 52w high/low, PE ratio, open, high, low, previous close)
      - Company Profile (Name, sector, industry, exchange, country, currency)
      - Historical Candles (List of OHLCV CandlePoints)
      - Financial ratios & fundamentals (market_cap, pe_ratio, dividend_yield)
      - Calculated Technical Indicators (RSI, MACD, SMA, EMA, VWAP, OBV, ATR, ADX, Bollinger Bands)
      - News Headlines
    """
    ticker: str
    quote: StockQuoteResponse
    candles: List[CandlePoint] = Field(default_factory=list)
    indicators: Optional[IndicatorsResponse] = None
    news: List[NewsArticle] = Field(default_factory=list)
    provider_name: str = "unknown"
    fetched_at: float = Field(default_factory=lambda: datetime.utcnow().timestamp())

    # Private/excluded field for internal pandas DataFrame (used for indicator calculations)
    _dataframe: Optional[Any] = PrivateAttr(default=None)

    class Config:
        arbitrary_types_allowed = True
