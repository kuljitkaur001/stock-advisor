import asyncio
import logging
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from app.market.manager import market_data_manager, POPULAR_STOCKS_DATA
from app.market.cache import market_cache, MultiTierCache as MarketDataCache
from app.schemas.schemas import StockQuoteResponse, CandlePoint, IndicatorsResponse, StockSearchResult

logger = logging.getLogger(__name__)

POPULAR_STOCKS = POPULAR_STOCKS_DATA

class StockService:
    """
    Backward-compatible StockService facade routing all requests through MarketDataManager.
    Guarantees ONE FETCH PER TICKER and zero duplicate API requests.
    """
    @staticmethod
    def normalize_ticker(ticker: str, country: str = "US") -> str:
        ticker_clean = ticker.strip().upper()
        if country.upper() == "IN" and not ticker_clean.endswith(".NS") and not ticker_clean.endswith(".BO"):
            return f"{ticker_clean}.NS"
        return ticker_clean

    @staticmethod
    async def search_stocks(query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        return await market_data_manager.search_stocks(query, country)

    @staticmethod
    async def get_stock_quote(ticker: str) -> StockQuoteResponse:
        from fastapi import HTTPException
        mdata = await market_data_manager.get_market_data(ticker)
        if mdata is None:
            raise HTTPException(
                status_code=404,
                detail=f"Market data not found for ticker: {ticker}"
            )
        return mdata.quote

    @staticmethod
    async def get_stock_history_data(ticker: str, period: str = "1Y", interval: str = "1d") -> Tuple[pd.DataFrame, List[CandlePoint]]:
        mdata = await market_data_manager.get_market_data(ticker)
        from fastapi import HTTPException
        if mdata is None:
            raise HTTPException(
                status_code=404,
                detail=f"Market data not found for ticker: {ticker}"
            )
        df = getattr(mdata, '_dataframe', None)
        if df is None or df.empty:
            if mdata.candles:
                records = [c.model_dump() for c in mdata.candles]
                df = pd.DataFrame(records)
                df.rename(columns={"open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume"}, inplace=True)
            else:
                df = pd.DataFrame()
        return df, mdata.candles

    @staticmethod
    async def get_stock_history(ticker: str, period: str = "1Y", interval: str = "1d") -> List[CandlePoint]:
        mdata = await market_data_manager.get_market_data(ticker)
        from fastapi import HTTPException
        if mdata is None:
            raise HTTPException(
                status_code=404,
                detail=f"Market data not found for ticker: {ticker}"
            )
        return mdata.candles

    @staticmethod
    async def get_stock_indicators(ticker: str, period: str = "1Y") -> IndicatorsResponse:
        mdata = await market_data_manager.get_market_data(ticker)
        from fastapi import HTTPException
        if mdata is None:
            raise HTTPException(
                status_code=404,
                detail=f"Market data not found for ticker: {ticker}"
            )
        if mdata.indicators:
            return mdata.indicators
        
        # Fallback if indicators not attached
        _, candles = await StockService.get_stock_history_data(ticker, period=period)
        timestamps = [c.timestamp for c in candles]
        closes = [c.close for c in candles]
        return IndicatorsResponse(
            ticker=mdata.ticker,
            timestamps=timestamps,
            close_prices=closes,
            sma_20=[None]*len(closes),
            sma_50=[None]*len(closes),
            ema_20=[None]*len(closes),
            rsi=[50.0]*len(closes),
            macd={"macd": [], "signal": [], "histogram": []},
            atr=[None]*len(closes),
            bollinger_bands={"upper": [], "middle": [], "lower": []},
            vwap=[None]*len(closes),
            obv=[0.0]*len(closes),
            adx=[0.0]*len(closes)
        )
