import asyncio
import logging
import yfinance as yf
import pandas as pd
from datetime import datetime
from typing import Optional, List
from app.market.providers.base import BaseMarketDataProvider
from app.market.models import MarketData
from app.schemas.schemas import StockQuoteResponse, CandlePoint, StockSearchResult

logger = logging.getLogger(__name__)

class YFinanceProvider(BaseMarketDataProvider):
    name = "yfinance"

    def _sync_fetch(self, ticker_clean: str) -> Optional[MarketData]:
        is_indian = ticker_clean.endswith(".NS") or ticker_clean.endswith(".BO")
        currency = "INR" if is_indian else "USD"
        country = "IN" if is_indian else "US"
        exchange = "NSE" if is_indian else "NASDAQ"

        try:
            yt = yf.Ticker(ticker_clean)
            info = {}
            try:
                info = getattr(yt, 'info', None) or {}
            except Exception:
                pass

            fast_info = {}
            try:
                if hasattr(yt, 'fast_info'):
                    fast_info = dict(yt.fast_info)
            except Exception:
                pass

            # Fetch candles (1 year)
            df = yt.history(period="1y", interval="1d")
            candles: List[CandlePoint] = []
            if df is not None and not df.empty:
                # Drop rows where OHLC contain NaN values
                df_clean = df.dropna(subset=['Open', 'High', 'Low', 'Close'])
                for index, row in df_clean.iterrows():
                    ts_str = index.strftime('%Y-%m-%d') if hasattr(index, 'strftime') else str(index)
                    candles.append(CandlePoint(
                        timestamp=ts_str,
                        open=round(float(row['Open']), 2),
                        high=round(float(row['High']), 2),
                        low=round(float(row['Low']), 2),
                        close=round(float(row['Close']), 2),
                        volume=round(float(row['Volume']), 0)
                    ))

            current_price = (
                fast_info.get('last_price') or
                fast_info.get('lastPrice') or
                info.get('regularMarketPrice') or
                info.get('currentPrice') or
                (candles[-1].close if candles else None)
            )
            logger.info(f"fast_info = {fast_info}")
            logger.info(f"info regularMarketPrice = {info.get('regularMarketPrice')}")
            logger.info(f"info currentPrice = {info.get('currentPrice')}")
            logger.info(f"candles count = {len(candles)}")

            if candles:
                logger.info(f"last candle close = {candles[-1].close}")
                logger.info(f"last candle open = {candles[-1].open}")
                logger.info(f"last candle high = {candles[-1].high}")
                logger.info(f"last candle low = {candles[-1].low}")
                logger.info(f"last candle timestamp = {candles[-1].timestamp}")
            


            if not current_price:
                logger.warning(f"yfinance could not extract current price for {ticker_clean}")
                return None

            prev_close = (
                fast_info.get('previous_close') or
                fast_info.get('previousClose') or
                info.get('regularMarketPreviousClose') or
                info.get('previousClose') or
                (candles[-2].close if len(candles) > 1 else current_price)
            )

            change = current_price - prev_close
            percent_change = (change / prev_close * 100) if prev_close else 0.0

            high_52 = (
                fast_info.get('year_high') or
                info.get('fiftyTwoWeekHigh') or
                (max([c.high for c in candles]) if candles else current_price)
            )
            low_52 = (
                fast_info.get('year_low') or
                info.get('fiftyTwoWeekLow') or
                (min([c.low for c in candles]) if candles else current_price)
            )

            quote = StockQuoteResponse(
                ticker=ticker_clean,
                name=info.get('longName') or info.get('shortName') or ticker_clean,
                current_price=round(float(current_price), 2),
                change=round(float(change), 2),
                percent_change=round(float(percent_change), 2),
                day_high=round(float(fast_info.get('day_high') or info.get('dayHigh') or current_price * 1.01), 2),
                day_low=round(float(fast_info.get('day_low') or info.get('dayLow') or current_price * 0.99), 2),
                open_price=round(float(fast_info.get('open') or info.get('open') or current_price), 2),
                previous_close=round(float(prev_close), 2),
                volume=int(fast_info.get('last_volume') or info.get('volume') or info.get('regularMarketVolume') or (candles[-1].volume if candles else 1000000)),
                market_cap=float(fast_info.get('market_cap') or info.get('marketCap')) if (fast_info.get('market_cap') or info.get('marketCap')) else None,
                pe_ratio=round(float(info.get('trailingPE')), 2) if info.get('trailingPE') else None,
                dividend_yield=round(float(info.get('dividendYield') * 100), 2) if info.get('dividendYield') else None,
                high_52w=round(float(high_52), 2) if high_52 else None,
                low_52w=round(float(low_52), 2) if low_52 else None,
                sector=info.get('sector') or "Technology",
                industry=info.get('industry') or "Software",
                exchange=exchange,
                country=country,
                currency=currency,
                last_updated=datetime.utcnow().isoformat()
            )

            mdata = MarketData(
                ticker=ticker_clean,
                quote=quote,
                candles=candles,
                news=[],
                provider_name=self.name
            )
            if df is not None and not df.empty:
                mdata._dataframe = df.dropna(subset=['Open', 'High', 'Low', 'Close'])
            return mdata

        except Exception as e:
            logger.warning(f"yfinance sync fetch failed for {ticker_clean}: {e}")
            return None

    async def fetch_market_data(self, ticker: str) -> Optional[MarketData]:
        ticker_clean = ticker.upper()
        try:
            return await asyncio.to_thread(self._sync_fetch, ticker_clean)
        except Exception as e:
            logger.warning(f"yfinance provider async call failed for {ticker_clean}: {e}")
            return None

    async def search_stocks(self, query: str, country: Optional[str] = None) -> List[StockSearchResult]:
        return []
