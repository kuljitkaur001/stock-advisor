from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.schemas import StockQuoteResponse, StockHistoryResponse, IndicatorsResponse, StockSearchResult
from app.services.stock_service import StockService

router = APIRouter(prefix="/stocks", tags=["Stock Data & Indicators"])

@router.get("/search", response_model=List[StockSearchResult])
async def search_stocks(query: str = Query("", description="Ticker or Company Name"), country: Optional[str] = Query(None, description="IN or US")):
    return await StockService.search_stocks(query, country)

@router.get("/{ticker}/quote", response_model=StockQuoteResponse)
async def get_stock_quote(ticker: str):
    return await StockService.get_stock_quote(ticker)

@router.get("/{ticker}/history", response_model=StockHistoryResponse)
async def get_stock_history(
    ticker: str,
    period: str = Query("1Y", description="1D, 1W, 1M, 1Y, 5Y"),
    interval: str = Query("1d", description="1m, 5m, 1d, 1wk")
):
    candles = await StockService.get_stock_history(ticker, period=period, interval=interval)
    return StockHistoryResponse(ticker=ticker.upper(), period=period, candles=candles)

@router.get("/{ticker}/indicators", response_model=IndicatorsResponse)
async def get_stock_indicators(ticker: str, period: str = Query("1Y", description="1M, 6M, 1Y, 5Y")):
    return await StockService.get_stock_indicators(ticker, period=period)
