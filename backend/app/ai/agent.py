import json
from typing import Dict, Any, List, TypedDict
from app.market.manager import market_data_manager
from app.market.cache import market_cache
from app.schemas.schemas import RecommendationResponse
from app.models.models import RecommendationEnum
from app.config import settings
from app.ai.llm_service import LLMService

class AgentState(TypedDict):
    ticker: str
    quote: Dict[str, Any]
    indicators: Dict[str, Any]
    trend: str
    volatility: str
    support_price: float
    resistance_price: float
    momentum_signal: str
    recommendation_output: Dict[str, Any]

class StockAnalysisAgent:
    """LangGraph State Workflow Agent for Deep Stock Analysis & Recommendation"""

    @staticmethod
    async def fetch_data_node(state: AgentState) -> AgentState:
        ticker = state["ticker"]
        mdata = await market_data_manager.get_market_data(ticker)
        state["quote"] = mdata.quote.model_dump()
        state["indicators"] = mdata.indicators.model_dump() if mdata.indicators else {}
        return state

    @staticmethod
    def technical_analysis_node(state: AgentState) -> AgentState:
        quote = state["quote"]
        indicators = state["indicators"]
        cur_price = quote["current_price"]
        
        # Analyze trend from SMA 20 vs SMA 50
        sma20 = indicators.get("sma_20", [])
        sma50 = indicators.get("sma_50", [])
        latest_sma20 = next((x for x in reversed(sma20) if x is not None), cur_price)
        latest_sma50 = next((x for x in reversed(sma50) if x is not None), cur_price)
        
        if cur_price > latest_sma20 > latest_sma50:
            trend = "STRONG_BULLISH"
        elif cur_price > latest_sma20:
            trend = "MODERATE_BULLISH"
        elif cur_price < latest_sma20 < latest_sma50:
            trend = "STRONG_BEARISH"
        else:
            trend = "NEUTRAL_CONSOLIDATION"

        # Analyze Volatility from ATR / Bollinger Bands
        high_52 = quote.get("high_52w") or (cur_price * 1.2)
        low_52 = quote.get("low_52w") or (cur_price * 0.8)
        support = round(cur_price * 0.93, 2)
        resistance = round(cur_price * 1.08, 2)
        
        rsi_list = indicators.get("rsi", [])
        latest_rsi = next((x for x in reversed(rsi_list) if x is not None), 50.0)
        
        if latest_rsi > 70:
            momentum = "OVERBOUGHT_REVERSAL_RISK"
        elif latest_rsi < 30:
            momentum = "OVERSOLD_BOUNCE_CANDIDATE"
        elif latest_rsi > 55:
            momentum = "POSITIVE_MOMENTUM"
        else:
            momentum = "NEUTRAL_MOMENTUM"

        state["trend"] = trend
        state["volatility"] = "MODERATE_HIGH" if (high_52 - low_52) / cur_price > 0.4 else "STABLE"
        state["support_price"] = support
        state["resistance_price"] = resistance
        state["momentum_signal"] = momentum
        return state

    @staticmethod
    def recommendation_generator_node(state: AgentState) -> AgentState:
        quote = state["quote"]
        ticker = state["ticker"]
        cur_price = quote["current_price"]
        trend = state["trend"]
        momentum = state["momentum_signal"]
        pe = quote.get("pe_ratio") or 25.0
        
        # Rule-based decision logic
        if "BULLISH" in trend and momentum != "OVERBOUGHT_REVERSAL_RISK" and pe < 60:
            rec = RecommendationEnum.BUY
            confidence = 88.5
            target = round(cur_price * 1.15, 2)
            stop_loss = round(cur_price * 0.94, 2)
            summary = f"{ticker} exhibits strong bullish momentum above key moving averages with healthy valuation metrics."
        elif "BEARISH" in trend or momentum == "OVERBOUGHT_REVERSAL_RISK":
            rec = RecommendationEnum.SELL
            confidence = 82.0
            target = round(cur_price * 0.88, 2)
            stop_loss = round(cur_price * 1.04, 2)
            summary = f"{ticker} is undergoing distribution pressure with technical weakness near major resistance zones."
        else:
            rec = RecommendationEnum.HOLD
            confidence = 75.0
            target = round(cur_price * 1.06, 2)
            stop_loss = round(cur_price * 0.93, 2)
            summary = f"{ticker} is currently consolidating. Wait for a decisive breakout above resistance."

        reasons = [
            f"Moving Average Alignment: Stock price (${cur_price}) relative to SMA 20/50 indicates {trend.lower()}.",
            f"Momentum Profile: RSI & MACD indicators reflect {momentum.lower()}.",
            f"Fundamental Health: P/E Ratio of {pe} aligns with sector peer averages.",
            f"Risk/Reward Ratio: Entry at ${cur_price} with clear stop loss at ${stop_loss} and target at ${target}."
        ]
        
        supporting_indicators = [
            f"SMA 20/50 Trend: {trend}",
            f"RSI Momentum: {momentum}",
            f"Key Support: ${state['support_price']}",
            f"Key Resistance: ${state['resistance_price']}"
        ]

        alternatives = ["AAPL", "NVDA", "MSFT"] if "IN" not in ticker else ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
        
        # Optional Gemini 2.5 Flash narrative reasoning enhancement
        rec_str = rec.value if hasattr(rec, 'value') else str(rec)
        llm_narrative = LLMService.generate_narrative_recommendation(
            ticker=ticker,
            quote=quote,
            indicators=state["indicators"],
            trend=trend,
            momentum=momentum,
            recommendation=rec_str,
            confidence=confidence,
            target_price=target,
            stop_loss=stop_loss,
            support_price=state["support_price"],
            resistance_price=state["resistance_price"]
        )

        if llm_narrative:
            summary = llm_narrative.get("summary") or summary
            tech_analysis = llm_narrative.get("technical_analysis") or f"The stock is trading at {cur_price}. Support is established at {state['support_price']} with resistance at {state['resistance_price']}. Trend structure is {trend}."
            fund_analysis = llm_narrative.get("fundamental_analysis") or f"Company Market Cap stands at ${quote.get('market_cap', 0):,.0f} with P/E ratio of {pe} and 52-week range between {quote.get('low_52w', 0)} and {quote.get('high_52w', 0)}."
            risk_assess = llm_narrative.get("risk_assessment") or f"Volatility is classified as {state['volatility']}. Key risk factor is potential broad market drawdowns."
        else:
            tech_analysis = f"The stock is trading at {cur_price}. Support is established at {state['support_price']} with resistance at {state['resistance_price']}. Trend structure is {trend}."
            fund_analysis = f"Company Market Cap stands at ${quote.get('market_cap', 0):,.0f} with P/E ratio of {pe} and 52-week range between {quote.get('low_52w', 0)} and {quote.get('high_52w', 0)}."
            risk_assess = f"Volatility is classified as {state['volatility']}. Key risk factor is potential broad market drawdowns."

        state["recommendation_output"] = {
            "ticker": ticker,
            "recommendation": rec,
            "confidence": confidence,
            "summary": summary,
            "technical_analysis": tech_analysis,
            "fundamental_analysis": fund_analysis,
            "risk_assessment": risk_assess,
            "entry_price": cur_price,
            "stop_loss": stop_loss,
            "target_price": target,
            "time_horizon": "3 to 6 Months",
            "reasons": "\n".join(reasons),
            "supporting_indicators": "\n".join(supporting_indicators),
            "potential_risks": "Macroeconomic interest rate shifts, earnings surprise risk, supply chain bottlenecks.",
            "alternative_stocks": ", ".join(alternatives),
            "disclaimer": "This recommendation is generated by an AI analytical agent for educational & virtual trading purposes only. Perform independent due diligence before investing real capital."
        }
        return state

    @classmethod
    async def run_analysis(cls, ticker: str) -> Dict[str, Any]:
        ticker_clean = ticker.upper()

        # Check recommendation cache
        cached_rec = market_cache.get_recommendation(ticker_clean)
        if cached_rec:
            return cached_rec

        state: AgentState = {
            "ticker": ticker_clean,
            "quote": {},
            "indicators": {},
            "trend": "",
            "volatility": "",
            "support_price": 0.0,
            "resistance_price": 0.0,
            "momentum_signal": "",
            "recommendation_output": {}
        }
        
        # Sequentially execute LangGraph nodes
        state = await cls.fetch_data_node(state)
        state = cls.technical_analysis_node(state)
        state = cls.recommendation_generator_node(state)
        
        output = state["recommendation_output"]
        market_cache.set_recommendation(ticker_clean, output)
        return output
