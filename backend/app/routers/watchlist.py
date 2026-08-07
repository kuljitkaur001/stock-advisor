from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, Watchlist, CountryEnum
from app.schemas.schemas import WatchlistCreate, WatchlistResponse
from app.repositories.repositories import WatchlistRepository
from app.services.stock_service import StockService
from app.market.manager import market_data_manager

router = APIRouter(prefix="/watchlist", tags=["Watchlist Management"])

@router.get("", response_model=List[WatchlistResponse])
async def get_watchlist(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = WatchlistRepository(db)
    items = await repo.get_user_watchlist(current_user.id)
    
    # Batch fetch MarketData for all watchlist items in 1 operation
    tickers = [item.ticker for item in items]
    mdata_map = await market_data_manager.get_market_data_batch(tickers)

    response = []
    for item in items:
        mdata = mdata_map.get(item.ticker.strip().upper())
        res = WatchlistResponse.model_validate(item)
        res.current_price = mdata.quote.current_price if mdata else None
        response.append(res)
    return response

@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item_in: WatchlistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = WatchlistRepository(db)
    ticker_clean = StockService.normalize_ticker(item_in.ticker, current_user.preferred_country.value)
    quote = await StockService.get_stock_quote(ticker_clean)
    
    is_indian = ticker_clean.endswith(".NS") or ticker_clean.endswith(".BO")
    
    item = Watchlist(
        user_id=current_user.id,
        ticker=ticker_clean,
        company_name=quote.name,
        market=CountryEnum.IN if is_indian else CountryEnum.US,
        notes=item_in.notes,
        target_alert_price=item_in.target_alert_price
    )
    saved = await repo.add_item(item)
    res = WatchlistResponse.model_validate(saved)
    res.current_price = quote.current_price
    return res

@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    watchlist_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = WatchlistRepository(db)
    await repo.remove_item(current_user.id, watchlist_id)
