import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User, RoleEnum, CountryEnum
from app.utils.security import get_password_hash

logger = logging.getLogger("uvicorn")

async def seed_initial_data(db: AsyncSession):
    """Seed initial demo user and admin user if they don't exist."""
    
    # 1. Seed Demo User
    user_res = await db.execute(select(User).where(User.email == "user@example.com"))
    demo_user = user_res.scalars().first()
    if not demo_user:
        demo_user = User(
            email="user@example.com",
            password_hash=get_password_hash("password123"),
            full_name="Test User",
            role=RoleEnum.USER,
            preferred_country=CountryEnum.US,
            virtual_balance_usd=100000.0,
            virtual_balance_inr=8000000.0
        )
        db.add(demo_user)
        logger.info("Seeded default test user: user@example.com / password123")

    # 2. Seed Demo Admin
    admin_res = await db.execute(select(User).where(User.email == "admin@example.com"))
    demo_admin = admin_res.scalars().first()
    if not demo_admin:
        demo_admin = User(
            email="admin@example.com",
            password_hash=get_password_hash("adminpassword123"),
            full_name="Test Admin",
            role=RoleEnum.ADMIN,
            preferred_country=CountryEnum.US,
            virtual_balance_usd=250000.0,
            virtual_balance_inr=20000000.0
        )
        db.add(demo_admin)
        logger.info("Seeded default test admin: admin@example.com / adminpassword123")

    await db.commit()
