import numpy as np
import pandas as pd
from typing import Dict, Any, List

def calculate_sma(series: pd.Series, period: int = 20) -> List[float]:
    """Simple Moving Average"""
    sma = series.rolling(window=period).mean()
    return np.where(np.isnan(sma), None, np.round(sma, 2)).tolist()

def calculate_ema(series: pd.Series, period: int = 20) -> List[float]:
    """Exponential Moving Average"""
    ema = series.ewm(span=period, adjust=False).mean()
    return np.where(np.isnan(ema), None, np.round(ema, 2)).tolist()

def calculate_rsi(series: pd.Series, period: int = 14) -> List[float]:
    """Relative Strength Index (RSI)"""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    rsi = rsi.fillna(50.0)
    return np.where(np.isnan(rsi), 50.0, np.round(rsi, 2)).tolist()

def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[float]]:
    """Moving Average Convergence Divergence (MACD)"""
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    
    return {
        "macd": np.where(np.isnan(macd_line), None, np.round(macd_line, 2)).tolist(),
        "signal": np.where(np.isnan(signal_line), None, np.round(signal_line, 2)).tolist(),
        "histogram": np.where(np.isnan(histogram), None, np.round(histogram, 2)).tolist()
    }

def calculate_atr(df: pd.DataFrame, period: int = 14) -> List[float]:
    """Average True Range (ATR)"""
    high = df['high']
    low = df['low']
    close = df['close']
    
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    atr = tr.rolling(window=period).mean()
    return np.where(np.isnan(atr), None, np.round(atr, 2)).tolist()

def calculate_bollinger_bands(series: pd.Series, period: int = 20, std_dev: float = 2.0) -> Dict[str, List[float]]:
    """Bollinger Bands (Upper, Middle, Lower)"""
    sma = series.rolling(window=period).mean()
    rolling_std = series.rolling(window=period).std()
    
    upper = sma + (rolling_std * std_dev)
    lower = sma - (rolling_std * std_dev)
    
    return {
        "upper": np.where(np.isnan(upper), None, np.round(upper, 2)).tolist(),
        "middle": np.where(np.isnan(sma), None, np.round(sma, 2)).tolist(),
        "lower": np.where(np.isnan(lower), None, np.round(lower, 2)).tolist()
    }

def calculate_vwap(df: pd.DataFrame) -> List[float]:
    """Volume Weighted Average Price (VWAP)"""
    typical_price = (df['high'] + df['low'] + df['close']) / 3.0
    vwap = (typical_price * df['volume']).cumsum() / df['volume'].cumsum().replace(0, np.nan)
    vwap = vwap.ffill()
    return np.where(np.isnan(vwap), None, np.round(vwap, 2)).tolist()

def calculate_obv(df: pd.DataFrame) -> List[float]:
    """On-Balance Volume (OBV)"""
    close = df['close']
    volume = df['volume']
    
    direction = np.where(close > close.shift(1), 1, np.where(close < close.shift(1), -1, 0))
    obv = (volume * direction).cumsum()
    return np.where(np.isnan(obv), 0, np.round(obv, 0)).tolist()

def calculate_adx(df: pd.DataFrame, period: int = 14) -> List[float]:
    """Average Directional Index (ADX)"""
    high = df['high']
    low = df['low']
    close = df['close']
    
    up_move = high - high.shift(1)
    down_move = low.shift(1) - low
    
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
    
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    tr_smooth = tr.rolling(window=period).mean()
    plus_di = 100 * (pd.Series(plus_dm).rolling(window=period).mean() / tr_smooth.replace(0, np.nan))
    minus_di = 100 * (pd.Series(minus_dm).rolling(window=period).mean() / tr_smooth.replace(0, np.nan))
    
    dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan))
    adx = dx.rolling(window=period).mean()
    adx = adx.fillna(25.0)
    return np.where(np.isnan(adx), 25.0, np.round(adx, 2)).tolist()

def compute_all_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculates all 9 mathematical indicators from an OHLCV dataframe."""
    if df.empty or len(df) < 5:
        return {}
    
    close = df['close']
    
    sma_20 = calculate_sma(close, 20)
    sma_50 = calculate_sma(close, 50)
    ema_20 = calculate_ema(close, 20)
    rsi = calculate_rsi(close, 14)
    macd = calculate_macd(close, 12, 26, 9)
    atr = calculate_atr(df, 14)
    bb = calculate_bollinger_bands(close, 20, 2.0)
    vwap = calculate_vwap(df)
    obv = calculate_obv(df)
    adx = calculate_adx(df, 14)
    
    return {
        "sma_20": sma_20,
        "sma_50": sma_50,
        "ema_20": ema_20,
        "rsi": rsi,
        "macd": macd,
        "atr": atr,
        "bollinger_bands": bb,
        "vwap": vwap,
        "obv": obv,
        "adx": adx
    }
