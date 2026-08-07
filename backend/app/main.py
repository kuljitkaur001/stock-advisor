import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, Base
from app.routers import auth, stocks, portfolio, analysis, chat, watchlist, admin, reports

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(stocks.router, prefix=settings.API_V1_STR)
app.include_router(portfolio.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(watchlist.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

import logging
from app.ai.llm_service import LLMService

logger = logging.getLogger("app.main")

@app.on_event("startup")
async def startup_event():
    # Initialize database tables asynchronously with fallback
    await init_db()
    if LLMService.is_available():
        logger.info(f"✨ Gemini 2.5 Flash LLM Integration ENABLED (Model: '{settings.GEMINI_MODEL}') - API Key configured.")
        print(f"[STARTUP] Gemini 2.5 Flash LLM Integration ENABLED (Model: '{settings.GEMINI_MODEL}') - API Key configured.")
    else:
        logger.warning("⚠️ Gemini LLM Integration DISABLED or API key missing - falling back to rule-based analysis engine.")
        print("[STARTUP] Gemini LLM Integration DISABLED or API key missing - falling back to rule-based analysis engine.")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "version": settings.VERSION,
        "status": "ONLINE"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
