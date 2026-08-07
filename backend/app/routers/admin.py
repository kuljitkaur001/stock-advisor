from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.routers.auth import get_current_admin_user
from app.models.models import User, Transaction, Company, Portfolio
from app.schemas.schemas import AdminStatsResponse, UserResponse

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    users_count = await db.scalar(select(func.count(User.id))) or 0
    tx_count = await db.scalar(select(func.count(Transaction.id))) or 0
    comp_count = await db.scalar(select(func.count(Company.id))) or 0
    portfolio_count = await db.scalar(select(func.count(Portfolio.id))) or 0

    return AdminStatsResponse(
        total_users=users_count,
        total_transactions=tx_count,
        total_companies=comp_count,
        active_portfolios=portfolio_count,
        system_health="OPTIMAL"
    )

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())
