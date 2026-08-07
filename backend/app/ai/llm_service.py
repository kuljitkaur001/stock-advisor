import logging
import json
from typing import Dict, Any, Optional, List
from app.config import settings

logger = logging.getLogger(__name__)

try:
    from google import genai
    HAS_GENAI = True
    SDK_MODE = "google-genai"
except ImportError:
    try:
        import google.generativeai as genai
        HAS_GENAI = True
        SDK_MODE = "google-generativeai"
    except ImportError:
        genai = None
        HAS_GENAI = False
        SDK_MODE = None

class LLMService:
    """Service abstraction for Gemini 3.6 Flash LLM reasoning & response generation using official Gemini SDKs"""

    @classmethod
    def is_available(cls) -> bool:
        """Returns True if Gemini SDK is installed and GEMINI_API_KEY is configured and enabled"""
        return bool(HAS_GENAI and settings.ENABLE_GEMINI and settings.GEMINI_API_KEY.strip())

    @classmethod
    def _call_gemini_api(cls, prompt: str) -> Optional[str]:
        """
        Executes prompt call to Gemini API using google.genai or google.generativeai.
        Prints and logs exact runtime diagnostics for verification.
        """
        if not cls.is_available():
            logger.warning("[Gemini Service] Gemini API unavailable or disabled.")
            return None

        api_key = settings.GEMINI_API_KEY.strip()
        model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"
        sdk_used = SDK_MODE or "google-generativeai"

        print("====================================================")
        print("[GEMINI RUNTIME DIAGNOSTIC]")
        print(f"  - SDK Being Used      : {sdk_used}")
        print(f"  - Model Name          : {model_name}")
        print(f"  - API Key Verified    : {api_key[:6]}...{api_key[-4:]}")
        print(f"  - Request Sent        : {prompt[:120]}...")

        try:
            res_text = None
            if SDK_MODE == "google-generativeai":
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    res_text = response.text.strip()
            else:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response and response.text:
                    res_text = response.text.strip()

            if res_text:
                print(f"  - Response Received   : {res_text[:120]}...")
                print(f"  - Fallback Executed   : NO")
                print("====================================================")
                logger.info(f"[Gemini Service] Successfully generated response using SDK '{sdk_used}' with model '{model_name}'.")
                return res_text
            else:
                print(f"  - Response Received   : EMPTY")
                print(f"  - Fallback Executed   : YES")
                print("====================================================")
                logger.warning(f"[Gemini Service] Model '{model_name}' returned empty response.")
                return None
        except Exception as err:
            print(f"  - Request Failed Error: {err}")
            print(f"  - Fallback Executed   : YES")
            print("====================================================")
            logger.error(f"[Gemini Service] Call failed with model '{model_name}': {err}")
            return None

    @classmethod
    def generate_narrative_recommendation(
        cls,
        ticker: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any],
        trend: str,
        momentum: str,
        recommendation: str,
        confidence: float,
        target_price: float,
        stop_loss: float,
        support_price: float,
        resistance_price: float
    ) -> Optional[Dict[str, str]]:
        """
        Uses Gemini 3.6 Flash to generate a natural language narrative explanation for stock recommendations.
        DOES NOT perform mathematical calculations. Strictly grounded in provided quantitative metrics.
        Returns a dictionary with summary, technical_analysis, fundamental_analysis, and risk_assessment.
        """
        if not cls.is_available():
            return None

        prompt = f"""You are an expert financial analyst writing a concise, professional stock analysis narrative.

CRITICAL INSTRUCTIONS:
- You must stay strictly grounded in the quantitative numbers and signals provided below.
- DO NOT invent, alter, or hallucinate prices, P/E ratios, indicators, target prices, or recommendations.
- Keep output concise, professional, clear, and action-oriented.

Provided Ground-Truth Financial Data for {ticker}:
- Ticker: {ticker}
- Company Name: {quote.get('name', ticker)}
- Current Price: {quote.get('currency', 'USD')} {quote.get('current_price')}
- Price Change: {quote.get('change')} ({quote.get('percent_change')}%)
- Market Cap: {quote.get('market_cap')}
- P/E Ratio: {quote.get('pe_ratio')}
- 52-Week Range: {quote.get('low_52w')} - {quote.get('high_52w')}
- Trend: {trend}
- Momentum Signal: {momentum}
- Deterministic Recommendation: {recommendation} (Confidence: {confidence}%)
- Target Price: {quote.get('currency', 'USD')} {target_price}
- Stop Loss: {quote.get('currency', 'USD')} {stop_loss}
- Key Support: {support_price} | Key Resistance: {resistance_price}

Task: Respond in JSON format with exactly 4 keys:
1. "summary": A 1-2 sentence executive summary of the stock's stance.
2. "technical_analysis": A paragraph explaining the price action, support/resistance, and moving average trend based on the data.
3. "fundamental_analysis": A paragraph evaluating valuation (P/E ratio, market cap, 52w bounds).
4. "risk_assessment": A paragraph discussing market/volatility risk, stop loss placement, and macro factors.

JSON Response:"""

        raw_text = cls._call_gemini_api(prompt)
        if not raw_text:
            return None

        try:
            text = raw_text
            if text.startswith("```json"):
                text = text.split("```json")[1].split("```")[0].strip()
            elif text.startswith("```"):
                text = text.split("```")[1].split("```")[0].strip()

            parsed = json.loads(text)
            if all(k in parsed for k in ["summary", "technical_analysis", "fundamental_analysis", "risk_assessment"]):
                return {
                    "summary": str(parsed["summary"]),
                    "technical_analysis": str(parsed["technical_analysis"]),
                    "fundamental_analysis": str(parsed["fundamental_analysis"]),
                    "risk_assessment": str(parsed["risk_assessment"])
                }
        except Exception as err:
            logger.error(f"Failed to parse Gemini recommendation JSON: {err}")

        return None

    @classmethod
    def answer_chat_query(
        cls,
        user_query: str,
        ticker_context: Optional[str] = None,
        stock_data: Optional[Dict[str, Any]] = None,
        portfolio_context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[str]:
        """
        Uses Gemini 3.6 Flash to generate dynamic, conversational answers.
        Grounded in quantitative stock metrics (SMA, EMA, RSI, MACD, ATR, ADX, Bollinger Bands, VWAP, OBV, trend, recommendation, confidence),
        portfolio context, and session chat history.
        """
        if not cls.is_available():
            return None

        context_blocks = []
        if ticker_context:
            context_blocks.append(f"Ticker Focus: {ticker_context}")
        if stock_data:
            context_blocks.append(f"Calculated Technical Indicators & Stock Data:\n{json.dumps(stock_data, indent=2, default=str)}")
        if portfolio_context:
            context_blocks.append(f"User Portfolio Context:\n{json.dumps(portfolio_context, indent=2, default=str)}")

        history_str = ""
        if chat_history and len(chat_history) > 0:
            history_lines = []
            for item in chat_history[-6:]:  # include up to 6 recent messages
                role = "User" if item.get("sender") in ("user", "human") or item.get("role") in ("user", "human") else "Advisor"
                msg_text = item.get("message") or item.get("content") or ""
                if msg_text:
                    history_lines.append(f"{role}: {msg_text}")
            if history_lines:
                history_str = "Recent Chat Session History:\n" + "\n".join(history_lines)

        context_str = "\n\n".join(context_blocks) if context_blocks else "No specific stock data provided."

        prompt = f"""You are AlphaAdvisor AI, an intelligent, objective, dynamic financial advisor chatbot powered by Gemini 3.6 Flash.

YOUR TASK:
Answer the user's question directly, naturally, and conversationally based on their query type and the provided quantitative indicators.

GUIDELINES FOR DIFFERENT QUESTION TYPES:
1. Stock Recommendation / Purchase Queries (e.g. "Should I buy AAPL?"):
   - Explain WHY based on the calculated quantitative recommendation and indicators.
   - Highlight supporting technical indicators (RSI, MACD, Moving Averages, etc.).
   - Explicitly mention confidence score, target price, stop loss, and key risks.

2. Indicator Educational Queries (e.g. "Explain RSI", "What is MACD?"):
   - Teach the technical indicator naturally and intuitively.
   - Explain overbought/oversold levels or signal crossovers.
   - If stock data is present, reference the current stock's actual calculated value for context.

3. Risk Analysis Queries (e.g. "What risks exist?", "What if RSI drops below 30?"):
   - Address downside risks, volatility, market headwinds, and support/stop-loss boundaries directly instead of repeating a generic template.

4. Follow-up Questions (e.g. "Explain why.", "What if..."):
   - Refer back to the previous context in the chat history session smoothly.

FORMATTING REQUIREMENTS:
- Use clean Markdown headers (e.g. ### Header), bold text, and bullet lists.
- Keep responses concise, engaging, highly structured, and conversational.
- Include a brief educational disclaimer at the end when giving stock outlooks.

{context_str}

{history_str}

User Query: "{user_query}"

Response:"""

        return cls._call_gemini_api(prompt)
