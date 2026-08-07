import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock

from app.utils.indicators import compute_all_indicators, calculate_rsi, calculate_sma
from app.utils.security import get_password_hash, verify_password, create_access_token, decode_token
from app.services.stock_service import StockService, market_cache, MarketDataCache
from app.ai.llm_service import LLMService
from app.ai.chatbot import FinancialAdvisorChatbot
from app.ai.agent import StockAnalysisAgent
from app.config import settings

def test_password_hashing():
    raw = "SecurePass123!"
    hashed = get_password_hash(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPass", hashed) is False

def test_jwt_token_creation_and_decoding():
    user_id = 42
    token = create_access_token(user_id)
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == str(user_id)
    assert payload.get("type") == "access"

def test_indicator_calculations():
    prices = pd.Series([100.0, 102.0, 101.0, 105.0, 107.0, 106.0, 110.0, 112.0, 111.0, 115.0] * 3)
    sma20 = calculate_sma(prices, 20)
    rsi14 = calculate_rsi(prices, 14)
    
    assert len(sma20) == len(prices)
    assert len(rsi14) == len(prices)
    assert 0 <= rsi14[-1] <= 100

@pytest.mark.asyncio
async def test_stock_service_quote():
    market_cache.clear()
    quote = await StockService.get_stock_quote("AAPL")
    assert quote.ticker == "AAPL"
    assert quote.current_price > 0
    assert quote.currency == "USD"

@pytest.mark.asyncio
async def test_stock_service_indian_quote():
    quote = await StockService.get_stock_quote("RELIANCE.NS")
    assert quote.ticker == "RELIANCE.NS"
    assert quote.currency == "INR"
    assert quote.country == "IN"

@pytest.mark.asyncio
async def test_market_data_cache_hit_and_stale_fallback():
    market_cache.clear()
    # Fetch first quote (fills cache)
    q1 = await StockService.get_stock_quote("MSFT")
    
    # Second fetch should hit cache
    cached_mdata = market_cache.get_market_data("MSFT")
    assert cached_mdata is not None
    assert cached_mdata.quote.ticker == "MSFT"

    # Test stale fallback
    stale_mdata = market_cache.get_stale_market_data("MSFT")
    assert stale_mdata is not None
    assert stale_mdata.quote.ticker == "MSFT"
    
    res_quote = await StockService.get_stock_quote("MSFT")
    assert res_quote.ticker == "MSFT"

def test_llm_service_fallback_when_unconfigured():
    # Force empty GEMINI_API_KEY
    with patch.object(settings, "GEMINI_API_KEY", ""):
        assert LLMService.is_available() is False
        res = LLMService.generate_narrative_recommendation(
            ticker="AAPL",
            quote={"current_price": 180.0, "change": 1.0, "percent_change": 0.5},
            indicators={},
            trend="STRONG_BULLISH",
            momentum="POSITIVE_MOMENTUM",
            recommendation="BUY",
            confidence=85.0,
            target_price=200.0,
            stop_loss=170.0,
            support_price=175.0,
            resistance_price=190.0
        )
        assert res is None
        chat_res = LLMService.answer_chat_query("Should I buy Apple?")
        assert chat_res is None

def test_llm_service_mock_call():
    mock_json = '{"summary": "Bullish view", "technical_analysis": "Above SMA20", "fundamental_analysis": "Fair PE", "risk_assessment": "Low risk"}'
    with patch.object(settings, "GEMINI_API_KEY", "dummy_test_key_123"), \
         patch.object(LLMService, "_call_gemini_api", return_value=mock_json):
        
        res = LLMService.generate_narrative_recommendation(
            ticker="AAPL",
            quote={"current_price": 180.0, "change": 1.0, "percent_change": 0.5},
            indicators={},
            trend="STRONG_BULLISH",
            momentum="POSITIVE_MOMENTUM",
            recommendation="BUY",
            confidence=85.0,
            target_price=200.0,
            stop_loss=170.0,
            support_price=175.0,
            resistance_price=190.0
        )
        assert res is not None
        assert res["summary"] == "Bullish view"

@pytest.mark.asyncio
async def test_financial_advisor_chatbot_fallback():
    # Chatbot should answer query using rule-based tree when Gemini is unconfigured or returns None
    with patch.object(LLMService, "is_available", return_value=False):
        rsi_ans = await FinancialAdvisorChatbot.answer_query("Explain RSI indicator")
        assert "Relative Strength Index" in rsi_ans["message"]

        buy_ans = await FinancialAdvisorChatbot.answer_query("Should I buy Apple?", ticker_context="AAPL")
        assert "AI Evaluation for AAPL" in buy_ans["message"]

@pytest.mark.asyncio
async def test_stock_analysis_agent_recommendation_flow():
    rec = await StockAnalysisAgent.run_analysis("NVDA")
    assert rec["ticker"] == "NVDA"
    assert rec["recommendation"] in ["BUY", "HOLD", "SELL"]
    assert rec["target_price"] > 0
    assert rec["stop_loss"] > 0
