from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, ChatHistory
from app.schemas.schemas import ChatRequest, ChatResponse
from app.ai.chatbot import FinancialAdvisorChatbot
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/chat", tags=["AI Financial Chatbot"])

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    portfolio_ctx = None
    if any(w in payload.message.lower() for w in ["portfolio", "holding", "balance", "asset", "invested", "pnl", "diversification"]):
        try:
            ps = PortfolioService(db)
            summary = await ps.get_portfolio_summary(current_user)
            portfolio_ctx = summary.model_dump()
        except Exception:
            pass

    answer = await FinancialAdvisorChatbot.answer_query(
        user_query=payload.message,
        ticker_context=payload.ticker_context,
        portfolio_context=portfolio_ctx,
        chat_history=payload.chat_history
    )
    
    # Save conversation log
    chat_log = ChatHistory(
        user_id=current_user.id,
        user_query=payload.message,
        ai_response=answer["message"],
        context_ticker=payload.ticker_context
    )
    db.add(chat_log)
    await db.commit()
    
    return ChatResponse(**answer)
