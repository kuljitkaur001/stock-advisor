from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.models.models import User, Company, Portfolio, Transaction, Recommendation, Watchlist, ChatHistory, News

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_balances(self, user_id: int, balance_usd: float, balance_inr: float):
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(virtual_balance_usd=balance_usd, virtual_balance_inr=balance_inr)
        )
        await self.db.commit()

class PortfolioRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_portfolio(self, user_id: int) -> List[Portfolio]:
        result = await self.db.execute(select(Portfolio).where(Portfolio.user_id == user_id))
        return list(result.scalars().all())

    async def get_holding(self, user_id: int, ticker: str) -> Optional[Portfolio]:
        result = await self.db.execute(
            select(Portfolio).where(Portfolio.user_id == user_id, Portfolio.ticker == ticker)
        )
        return result.scalars().first()

    async def save_holding(self, holding: Portfolio) -> Portfolio:
        self.db.add(holding)
        await self.db.commit()
        await self.db.refresh(holding)
        return holding

    async def remove_holding(self, holding: Portfolio):
        await self.db.delete(holding)
        await self.db.commit()

class TransactionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, tx: Transaction) -> Transaction:
        self.db.add(tx)
        await self.db.commit()
        await self.db.refresh(tx)
        return tx

    async def get_user_transactions(self, user_id: int, limit: int = 50) -> List[Transaction]:
        result = await self.db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

class WatchlistRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_watchlist(self, user_id: int) -> List[Watchlist]:
        result = await self.db.execute(
            select(Watchlist).where(Watchlist.user_id == user_id).order_by(Watchlist.created_at.desc())
        )
        return list(result.scalars().all())

    async def add_item(self, item: Watchlist) -> Watchlist:
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def remove_item(self, user_id: int, watchlist_id: int):
        await self.db.execute(
            delete(Watchlist).where(Watchlist.user_id == user_id, Watchlist.id == watchlist_id)
        )
        await self.db.commit()
