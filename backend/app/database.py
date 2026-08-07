from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import logging

logger = logging.getLogger("uvicorn")

# Default engine tries PostgreSQL first
try:
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
except Exception:
    engine = create_async_engine(settings.SQLITE_FALLBACK, echo=False, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def init_db():
    global engine, AsyncSessionLocal
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully with PostgreSQL.")
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite database.")
        engine = create_async_engine(settings.SQLITE_FALLBACK, echo=False, future=True)
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite database tables initialized successfully.")

    # Seed demo user and admin accounts
    try:
        from app.seed import seed_initial_data
        async with AsyncSessionLocal() as session:
            await seed_initial_data(session)
    except Exception as seed_err:
        logger.error(f"Seeding failed: {seed_err}")

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
