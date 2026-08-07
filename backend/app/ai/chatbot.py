from datetime import datetime
from typing import Dict, Any, List, Optional
from app.market.manager import market_data_manager
from app.ai.agent import StockAnalysisAgent
from app.ai.llm_service import LLMService

class FinancialAdvisorChatbot:
    """Conversational Financial Advisor Chatbot Engine powered by Gemini 3.6 Flash & Centralized Market Data Layer"""

    @staticmethod
    async def answer_query(
        user_query: str,
        ticker_context: Optional[str] = None,
        portfolio_context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        query_lower = user_query.lower()
        sources = ["AI Quantitative Math Engine", "Centralized Market Data Layer"]

        # Determine target ticker from context or query keywords
        target_ticker = ticker_context.upper() if ticker_context else None
        if not target_ticker:
            known_map = {
                "apple": "AAPL", "aapl": "AAPL",
                "nvidia": "NVDA", "nvda": "NVDA",
                "tesla": "TSLA", "tsla": "TSLA",
                "microsoft": "MSFT", "msft": "MSFT",
                "google": "GOOGL", "googl": "GOOGL", "alphabet": "GOOGL",
                "amazon": "AMZN", "amzn": "AMZN",
                "meta": "META", "facebook": "META",
                "amd": "AMD",
                "reliance": "RELIANCE.NS",
                "tcs": "TCS.NS",
                "infosys": "INFY.NS", "infy": "INFY.NS",
                "hdfc": "HDFCBANK.NS", "hdfcbank": "HDFCBANK.NS",
                "icici": "ICICIBANK.NS", "icicibank": "ICICIBANK.NS",
                "tata motors": "TATAMOTORS.NS", "tatamotors": "TATAMOTORS.NS",
                "airtel": "BHARTIARTL.NS", "bharti": "BHARTIARTL.NS",
                "wipro": "WIPRO.NS",
                "netflix": "NFLX", "nflx": "NFLX",
                "walmart": "WMT", "wmt": "WMT",
            }
            for kw, t in known_map.items():
                if kw in query_lower:
                    target_ticker = t
                    break

            if not target_ticker:
                import re
                matches = re.findall(r'\b[A-Z]{2,5}(?:\.[A-Z]{2})?\b', user_query)
                if matches:
                    target_ticker = matches[0]
                else:
                    words = [w for w in query_lower.split() if len(w) >= 3 and w not in ("what", "how", "should", "buy", "sell", "stock", "price", "about", "tell", "show", "give", "share")]
                    for word in words:
                        search_res = await market_data_manager.search_stocks(word)
                        if search_res:
                            target_ticker = search_res[0].ticker
                            break

        # Fetch unified MarketData object & quantitative indicators
        stock_data = None
        if target_ticker:
            try:
                mdata = await market_data_manager.get_market_data(target_ticker)
                quote = mdata.quote.model_dump()
                indicators = mdata.indicators.model_dump() if mdata.indicators else {}
                rec = await StockAnalysisAgent.run_analysis(target_ticker)

                # Extract latest indicator values cleanly
                def get_latest(key, default=None):
                    vals = indicators.get(key)
                    if isinstance(vals, list) and len(vals) > 0:
                        return vals[-1]
                    return default

                latest_sma20 = get_latest("sma_20")
                latest_sma50 = get_latest("sma_50")
                latest_ema20 = get_latest("ema_20")
                latest_rsi = get_latest("rsi", 50.0)
                latest_atr = get_latest("atr")
                latest_vwap = get_latest("vwap")
                latest_obv = get_latest("obv")
                latest_adx = get_latest("adx")
                macd_dict = indicators.get("macd", {})
                latest_macd_line = macd_dict.get("macd", [None])[-1] if macd_dict.get("macd") else None
                latest_macd_signal = macd_dict.get("signal", [None])[-1] if macd_dict.get("signal") else None
                bb_dict = indicators.get("bollinger_bands", {})
                latest_bb_upper = bb_dict.get("upper", [None])[-1] if bb_dict.get("upper") else None
                latest_bb_lower = bb_dict.get("lower", [None])[-1] if bb_dict.get("lower") else None

                stock_data = {
                    "ticker": target_ticker,
                    "quote": quote,
                    "quantitative_indicators": {
                        "sma_20": latest_sma20,
                        "sma_50": latest_sma50,
                        "ema_20": latest_ema20,
                        "rsi": latest_rsi,
                        "macd_line": latest_macd_line,
                        "macd_signal": latest_macd_signal,
                        "atr": latest_atr,
                        "adx": latest_adx,
                        "bollinger_upper": latest_bb_upper,
                        "bollinger_lower": latest_bb_lower,
                        "vwap": latest_vwap,
                        "obv": latest_obv,
                    },
                    "recommendation": rec.get("recommendation"),
                    "confidence": rec.get("confidence"),
                    "target_price": rec.get("target_price"),
                    "stop_loss": rec.get("stop_loss"),
                    "reasons": rec.get("reasons"),
                    "disclaimer": rec.get("disclaimer")
                }
                sources.append(f"{target_ticker} Quote & Quantitative Indicators (Cached)")
            except Exception as err:
                print(f"Warning: Failed to fetch market data for {target_ticker}: {err}")

        # Try Gemini 3.6 Flash conversational narrative reasoning
        if LLMService.is_available():
            llm_response = LLMService.answer_chat_query(
                user_query=user_query,
                ticker_context=target_ticker or ticker_context,
                stock_data=stock_data,
                portfolio_context=portfolio_context,
                chat_history=chat_history
            )
            if llm_response:
                sources.append("Gemini 3.6 Flash Reasoning Engine")
                return {
                    "message": llm_response,
                    "sources": sources,
                    "timestamp": datetime.utcnow()
                }

        # --- FALLBACK: Deterministic Rule-Based Response Path (Only if Gemini fails) ---
        if "rsi" in query_lower:
            response = (
                "**Relative Strength Index (RSI)** is a momentum oscillator that measures the speed and change of price movements on a scale of 0 to 100.\n\n"
                "• **RSI > 70**: Indicates the stock is **Overbought** and may be due for a consolidation or pullback.\n"
                "• **RSI < 30**: Indicates the stock is **Oversold** and may present a bullish buying opportunity.\n"
                "• **RSI ~ 50**: Indicates a neutral momentum state."
            )
            sources.append("Investopedia Technical Analysis Knowledge Base")
        elif "macd" in query_lower:
            response = (
                "**MACD (Moving Average Convergence Divergence)** tracks the relationship between two exponential moving averages (typically 12-period and 26-period EMAs).\n\n"
                "• **Bearish MACD**: Occurs when the MACD Line crosses **below** the Signal Line or the Histogram turns negative.\n"
                "• **Bullish MACD**: Occurs when the MACD Line crosses **above** the Signal Line."
            )
            sources.append("Quantitative Momentum Framework")
        elif "buy" in query_lower or target_ticker:
            active_ticker = target_ticker or "AAPL"
            rec_data = await StockAnalysisAgent.run_analysis(active_ticker)
            response = (
                f"### 🤖 AI Evaluation for {active_ticker}\n\n"
                f"**Recommendation**: **{rec_data['recommendation']}** (Confidence: {rec_data['confidence']}%)\n\n"
                f"• **Target Price**: ${rec_data['target_price']} | **Stop Loss**: ${rec_data['stop_loss']}\n"
                f"• **Summary**: {rec_data['summary']}\n\n"
                f"**Key Reasons**:\n{rec_data['reasons']}\n\n"
                f"_*Educational Disclaimer*: {rec_data['disclaimer']}_"
            )
            sources.append(f"LangGraph Agent Analysis ({active_ticker})")
        else:
            response = (
                f"I am your AI Financial Advisor. I can analyze stocks across the **US (NASDAQ/NYSE)** and **Indian (NSE)** markets, compute 9 technical indicators (RSI, MACD, SMA, EMA, VWAP, Bollinger Bands, ATR, OBV, ADX), assist with virtual portfolio risk management, and explain finance concepts.\n\n"
                "Try asking: *'Should I buy Apple?'*, *'Compare Tesla and Nvidia'*, or *'Explain RSI'*."
            )

        return {
            "message": response,
            "sources": sources,
            "timestamp": datetime.utcnow()
        }
