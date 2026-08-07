from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User
from app.schemas.schemas import PortfolioSummaryResponse, TradeRequest, TransactionResponse
from app.services.portfolio_service import PortfolioService
from app.repositories.repositories import TransactionRepository

router = APIRouter(prefix="/portfolio", tags=["Virtual Portfolio & Trading"])

@router.get("", response_model=PortfolioSummaryResponse)
async def get_portfolio(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = PortfolioService(db)
    return await service.get_portfolio_summary(current_user)

@router.post("/trade", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def execute_trade(trade: TradeRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = PortfolioService(db)
    return await service.execute_trade(current_user, trade)

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transaction_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tx_repo = TransactionRepository(db)
    return await tx_repo.get_user_transactions(current_user.id)
