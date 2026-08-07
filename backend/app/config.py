import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file explicitly
load_dotenv()
backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)
root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(root_env):
    load_dotenv(root_env, override=False)

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Stock Advisor & Virtual Portfolio"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:postgres@localhost:5432/stock_advisor_db"
    )
    SQLITE_FALLBACK: str = "sqlite+aiosqlite:///./stock_advisor.db"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_JWT_KEY_PROD_GRADE_STOCK_ADVISOR_2026_SECURITY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # AI Keys & Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    ENABLE_GEMINI: bool = os.getenv("ENABLE_GEMINI", "true").lower() in ("true", "1", "yes")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Provider API Keys
    FINNHUB_API_KEY: str = os.getenv("FINNHUB_API_KEY", "")
    TWELVE_DATA_API_KEY: str = os.getenv("TWELVE_DATA_API_KEY", "")
    ALPHA_VANTAGE_API_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY", "")

    # Multi-Tier Cache TTL (Seconds)
    CACHE_TTL_MARKET_DATA: int = int(os.getenv("CACHE_TTL_MARKET_DATA", "60"))
    CACHE_TTL_QUOTE: int = int(os.getenv("CACHE_TTL_QUOTE", "60"))
    CACHE_TTL_HISTORY: int = int(os.getenv("CACHE_TTL_HISTORY", "300"))
    CACHE_TTL_INDICATORS: int = int(os.getenv("CACHE_TTL_INDICATORS", "300"))
    CACHE_TTL_NEWS: int = int(os.getenv("CACHE_TTL_NEWS", "600"))
    CACHE_TTL_RECOMMENDATIONS: int = int(os.getenv("CACHE_TTL_RECOMMENDATIONS", "300"))
    CACHE_TTL_SEARCH: int = int(os.getenv("CACHE_TTL_SEARCH", "3600"))
    
    # Default Cash Balances
    DEFAULT_CASH_USD: float = 100000.0  # $100,000 USD
    DEFAULT_CASH_INR: float = 8000000.0  # ₹8,000,000 INR
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
