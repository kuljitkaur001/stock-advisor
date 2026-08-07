import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base

class RoleEnum(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class CountryEnum(str, enum.Enum):
    IN = "IN"
    US = "US"

class ExchangeEnum(str, enum.Enum):
    NSE = "NSE"
    NASDAQ = "NASDAQ"
    NYSE = "NYSE"

class TransactionTypeEnum(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class RecommendationEnum(str, enum.Enum):
    BUY = "BUY"
    HOLD = "HOLD"
    SELL = "SELL"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(SQLEnum(RoleEnum), default=RoleEnum.USER, nullable=False)
    preferred_country: Mapped[CountryEnum] = mapped_column(SQLEnum(CountryEnum), default=CountryEnum.US, nullable=False)
    virtual_balance_usd: Mapped[float] = mapped_column(Float, default=100000.0, nullable=False)
    virtual_balance_inr: Mapped[float] = mapped_column(Float, default=8000000.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    portfolios: Mapped[List["Portfolio"]] = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    watchlists: Mapped[List["Watchlist"]] = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    chat_histories: Mapped[List["ChatHistory"]] = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    exchange: Mapped[ExchangeEnum] = mapped_column(SQLEnum(ExchangeEnum), nullable=False)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[CountryEnum] = mapped_column(SQLEnum(CountryEnum), nullable=False, index=True)
    market_cap: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pe_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dividend_yield: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    high_52w: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    low_52w: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    historical_prices: Mapped[List["HistoricalPrice"]] = relationship("HistoricalPrice", back_populates="company", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="company", cascade="all, delete-orphan")
    news: Mapped[List["News"]] = relationship("News", back_populates="company", cascade="all, delete-orphan")

class StockQuote(Base):
    __tablename__ = "stock_quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, nullable=False)
    change: Mapped[float] = mapped_column(Float, default=0.0)
    percent_change: Mapped[float] = mapped_column(Float, default=0.0)
    day_high: Mapped[float] = mapped_column(Float, default=0.0)
    day_low: Mapped[float] = mapped_column(Float, default=0.0)
    open_price: Mapped[float] = mapped_column(Float, default=0.0)
    previous_close: Mapped[float] = mapped_column(Float, default=0.0)
    volume: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class HistoricalPrice(Base):
    __tablename__ = "historical_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[float] = mapped_column(Float, nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="historical_prices")

    __table_args__ = (
        Index("idx_hist_price_ticker_time", "ticker", "timestamp"),
        UniqueConstraint("ticker", "timestamp", name="uq_ticker_timestamp"),
    )

class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    market: Mapped[CountryEnum] = mapped_column(SQLEnum(CountryEnum), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_buy_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_invested: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="portfolios")

    __table_args__ = (
        UniqueConstraint("user_id", "ticker", name="uq_user_ticker_portfolio"),
    )

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_type: Mapped[TransactionTypeEnum] = mapped_column(SQLEnum(TransactionTypeEnum), nullable=False)
    market: Mapped[CountryEnum] = mapped_column(SQLEnum(CountryEnum), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_share: Mapped[float] = mapped_column(Float, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship("User", back_populates="transactions")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    recommendation: Mapped[RecommendationEnum] = mapped_column(SQLEnum(RecommendationEnum), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 to 100.0
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    technical_analysis: Mapped[str] = mapped_column(Text, nullable=False)
    fundamental_analysis: Mapped[str] = mapped_column(Text, nullable=False)
    risk_assessment: Mapped[str] = mapped_column(Text, nullable=False)
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    stop_loss: Mapped[float] = mapped_column(Float, nullable=False)
    target_price: Mapped[float] = mapped_column(Float, nullable=False)
    time_horizon: Mapped[str] = mapped_column(String(100), nullable=False)
    reasons: Mapped[str] = mapped_column(Text, nullable=False)  # JSON or newline string
    supporting_indicators: Mapped[str] = mapped_column(Text, nullable=False)
    potential_risks: Mapped[str] = mapped_column(Text, nullable=False)
    alternative_stocks: Mapped[str] = mapped_column(Text, nullable=False)
    disclaimer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="recommendations")
    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="recommendations")

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    trend: Mapped[str] = mapped_column(String(50), nullable=False)
    volatility: Mapped[str] = mapped_column(String(50), nullable=False)
    support_level: Mapped[float] = mapped_column(Float, nullable=False)
    resistance_level: Mapped[float] = mapped_column(Float, nullable=False)
    rsi_val: Mapped[float] = mapped_column(Float, nullable=False)
    macd_signal: Mapped[str] = mapped_column(String(50), nullable=False)
    adx_val: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    market: Mapped[CountryEnum] = mapped_column(SQLEnum(CountryEnum), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_alert_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="watchlists")

    __table_args__ = (
        UniqueConstraint("user_id", "ticker", name="uq_user_ticker_watchlist"),
    )

class ChatHistory(Base):
    __tablename__ = "chat_histories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_query: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[str] = mapped_column(Text, nullable=False)
    context_ticker: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship("User", back_populates="chat_histories")

class News(Base):
    __tablename__ = "news"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    ticker: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sentiment: Mapped[str] = mapped_column(String(50), default="NEUTRAL")  # POSITIVE, NEGATIVE, NEUTRAL
    published_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="news")
