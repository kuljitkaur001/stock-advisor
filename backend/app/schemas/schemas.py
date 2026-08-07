from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from app.models.models import RoleEnum, CountryEnum, ExchangeEnum, TransactionTypeEnum, RecommendationEnum

# --- AUTH SCHEMAS ---
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    preferred_country: CountryEnum = CountryEnum.US

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: RoleEnum
    preferred_country: CountryEnum
    virtual_balance_usd: float
    virtual_balance_inr: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- STOCK SCHEMAS ---
class StockSearchResult(BaseModel):
    ticker: str
    name: str
    exchange: str
    country: str
    sector: Optional[str] = None
    industry: Optional[str] = None

class StockQuoteResponse(BaseModel):
    ticker: str
    name: str
    current_price: float
    change: float
    percent_change: float
    day_high: float
    day_low: float
    open_price: float
    previous_close: float
    volume: int
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    exchange: str
    country: str
    currency: str
    last_updated: str

class CandlePoint(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class StockHistoryResponse(BaseModel):
    ticker: str
    period: str
    candles: List[CandlePoint]

class IndicatorsResponse(BaseModel):
    ticker: str
    timestamps: List[str]
    close_prices: List[float]
    sma_20: List[Optional[float]]
    sma_50: List[Optional[float]]
    ema_20: List[Optional[float]]
    rsi: List[float]
    macd: Dict[str, List[Optional[float]]]
    atr: List[Optional[float]]
    bollinger_bands: Dict[str, List[Optional[float]]]
    vwap: List[Optional[float]]
    obv: List[float]
    adx: List[float]

# --- PORTFOLIO & TRADING SCHEMAS ---
class TradeRequest(BaseModel):
    ticker: str
    transaction_type: TransactionTypeEnum  # BUY or SELL
    quantity: float = Field(..., gt=0)

class HoldingItem(BaseModel):
    id: int
    ticker: str
    company_name: str
    market: CountryEnum
    quantity: float
    average_buy_price: float
    total_invested: float
    current_price: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float

class TransactionResponse(BaseModel):
    id: int
    ticker: str
    company_name: str
    transaction_type: TransactionTypeEnum
    market: CountryEnum
    quantity: float
    price_per_share: float
    total_amount: float
    currency: str
    timestamp: datetime

    class Config:
        from_attributes = True

class PortfolioSummaryResponse(BaseModel):
    virtual_balance_usd: float
    virtual_balance_inr: float
    total_invested_usd: float
    total_current_value_usd: float
    total_pnl_usd: float
    total_pnl_percent_usd: float
    holdings: List[HoldingItem]
    sector_allocation: Dict[str, float]

# --- AI RECOMMENDATION & CHAT SCHEMAS ---
class RecommendationResponse(BaseModel):
    ticker: str
    recommendation: RecommendationEnum
    confidence: float
    summary: str
    technical_analysis: str
    fundamental_analysis: str
    risk_assessment: str
    entry_price: float
    stop_loss: float
    target_price: float
    time_horizon: str
    reasons: List[str]
    supporting_indicators: List[str]
    potential_risks: List[str]
    alternative_stocks: List[str]
    disclaimer: str
    created_at: datetime

class ChatRequest(BaseModel):
    message: str
    ticker_context: Optional[str] = None
    chat_history: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    message: str
    sources: List[str] = []
    timestamp: datetime

# --- WATCHLIST SCHEMAS ---
class WatchlistCreate(BaseModel):
    ticker: str
    notes: Optional[str] = None
    target_alert_price: Optional[float] = None

class WatchlistResponse(BaseModel):
    id: int
    ticker: str
    company_name: str
    market: CountryEnum
    notes: Optional[str]
    target_alert_price: Optional[float]
    current_price: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- ADMIN SCHEMAS ---
class AdminStatsResponse(BaseModel):
    total_users: int
    total_transactions: int
    total_companies: int
    active_portfolios: int
    system_health: str = "OPTIMAL"
