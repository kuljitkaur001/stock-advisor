from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.repositories import UserRepository, PortfolioRepository, TransactionRepository
from app.models.models import User, Portfolio, Transaction, TransactionTypeEnum, CountryEnum
from app.services.stock_service import StockService
from app.market.manager import market_data_manager
from app.schemas.schemas import PortfolioSummaryResponse, HoldingItem, TradeRequest

class PortfolioService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.portfolio_repo = PortfolioRepository(db)
        self.tx_repo = TransactionRepository(db)

    async def execute_trade(self, user: User, trade: TradeRequest) -> Transaction:
        ticker = StockService.normalize_ticker(trade.ticker, user.preferred_country.value)
        quote = await StockService.get_stock_quote(ticker)
        current_price = quote.current_price
        total_cost = current_price * trade.quantity
        is_indian = ticker.endswith(".NS") or ticker.endswith(".BO")
        currency = "INR" if is_indian else "USD"

        # Check balances
        if trade.transaction_type == TransactionTypeEnum.BUY:
            if is_indian and user.virtual_balance_inr < total_cost:
                raise HTTPException(status_code=400, detail="Insufficient INR virtual balance")
            elif not is_indian and user.virtual_balance_usd < total_cost:
                raise HTTPException(status_code=400, detail="Insufficient USD virtual balance")

            # Deduct balance
            if is_indian:
                user.virtual_balance_inr -= total_cost
            else:
                user.virtual_balance_usd -= total_cost

            # Update or create portfolio holding
            holding = await self.portfolio_repo.get_holding(user.id, ticker)
            if holding:
                new_qty = holding.quantity + trade.quantity
                new_invested = holding.total_invested + total_cost
                holding.quantity = new_qty
                holding.total_invested = new_invested
                holding.average_buy_price = round(new_invested / new_qty, 2)
            else:
                holding = Portfolio(
                    user_id=user.id,
                    ticker=ticker,
                    company_name=quote.name,
                    market=CountryEnum.IN if is_indian else CountryEnum.US,
                    quantity=trade.quantity,
                    average_buy_price=current_price,
                    total_invested=total_cost
                )
            await self.portfolio_repo.save_holding(holding)

        elif trade.transaction_type == TransactionTypeEnum.SELL:
            holding = await self.portfolio_repo.get_holding(user.id, ticker)
            if not holding or holding.quantity < trade.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock quantity to sell")

            # Credit balance
            if is_indian:
                user.virtual_balance_inr += total_cost
            else:
                user.virtual_balance_usd += total_cost

            # Reduce holding
            remaining_qty = holding.quantity - trade.quantity
            if remaining_qty <= 0:
                await self.portfolio_repo.remove_holding(holding)
            else:
                holding.quantity = remaining_qty
                holding.total_invested = round(holding.average_buy_price * remaining_qty, 2)
                await self.portfolio_repo.save_holding(holding)

        # Update user balance in DB
        await self.user_repo.update_balances(user.id, user.virtual_balance_usd, user.virtual_balance_inr)

        # Record transaction
        tx = Transaction(
            user_id=user.id,
            ticker=ticker,
            company_name=quote.name,
            transaction_type=trade.transaction_type,
            market=CountryEnum.IN if is_indian else CountryEnum.US,
            quantity=trade.quantity,
            price_per_share=current_price,
            total_amount=total_cost,
            currency=currency
        )
        return await self.tx_repo.create(tx)

    async def get_portfolio_summary(self, user: User) -> PortfolioSummaryResponse:
        holdings_raw = await self.portfolio_repo.get_user_portfolio(user.id)
        
        # Batch fetch market data for all portfolio tickers in ONE concurrent operation
        portfolio_tickers = [h.ticker for h in holdings_raw]
        mdata_map = await market_data_manager.get_market_data_batch(portfolio_tickers)

        holdings_items: List[HoldingItem] = []
        total_invested_usd = 0.0
        total_current_value_usd = 0.0
        sector_totals: Dict[str, float] = {}

        # FX rate static approximation for Indian Rupee to USD conversion in multi-currency summary
        INR_TO_USD_RATE = 0.012

        for h in holdings_raw:
            mdata = mdata_map.get(h.ticker.strip().upper())
            quote = mdata.quote if mdata else None
            cur_price = quote.current_price if quote else h.average_buy_price
            cur_val = cur_price * h.quantity
            unrealized_pnl = cur_val - h.total_invested
            pnl_percent = (unrealized_pnl / h.total_invested * 100) if h.total_invested else 0.0

            holdings_items.append(HoldingItem(
                id=h.id,
                ticker=h.ticker,
                company_name=h.company_name,
                market=h.market,
                quantity=h.quantity,
                average_buy_price=h.average_buy_price,
                total_invested=round(h.total_invested, 2),
                current_price=cur_price,
                current_value=round(cur_val, 2),
                unrealized_pnl=round(unrealized_pnl, 2),
                unrealized_pnl_percent=round(pnl_percent, 2)
            ))

            # Normalize to USD for aggregate summary calculation
            multiplier = INR_TO_USD_RATE if h.market == CountryEnum.IN else 1.0
            val_in_usd = cur_val * multiplier
            total_invested_usd += h.total_invested * multiplier
            total_current_value_usd += val_in_usd

            sector = (quote.sector if quote else None) or "Other"
            sector_totals[sector] = sector_totals.get(sector, 0.0) + val_in_usd

        total_pnl_usd = total_current_value_usd - total_invested_usd
        total_pnl_percent = (total_pnl_usd / total_invested_usd * 100) if total_invested_usd > 0 else 0.0

        # Calculate sector allocation percentages
        sector_allocation = {}
        if total_current_value_usd > 0:
            for s, val in sector_totals.items():
                sector_allocation[s] = round((val / total_current_value_usd) * 100, 2)
        else:
            sector_allocation = {"Cash": 100.0}

        return PortfolioSummaryResponse(
            virtual_balance_usd=round(user.virtual_balance_usd, 2),
            virtual_balance_inr=round(user.virtual_balance_inr, 2),
            total_invested_usd=round(total_invested_usd, 2),
            total_current_value_usd=round(total_current_value_usd, 2),
            total_pnl_usd=round(total_pnl_usd, 2),
            total_pnl_percent_usd=round(total_pnl_percent, 2),
            holdings=holdings_items,
            sector_allocation=sector_allocation
        )
