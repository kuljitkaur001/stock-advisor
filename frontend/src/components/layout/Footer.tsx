import React from 'react';
import { TrendingUp, ShieldCheck, Zap, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-slate-950 stroke-[3]" />
              </div>
              <span className="font-bold text-slate-100">AlphaAdvisor AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Production-grade AI Powered Stock Analysis & Virtual Portfolio Advisor supporting both Indian (NSE) and US (NASDAQ/NYSE) capital markets.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Supported Markets</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">🇺🇸 US Stock Market (NASDAQ, NYSE)</li>
              <li className="flex items-center gap-2">🇮🇳 Indian Stock Market (NSE)</li>
              <li>OHLCV Candles & Realtime Quotes</li>
              <li>9 Mathematical Technical Indicators</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">AI Intelligence</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>LangGraph Multi-Node Workflow Agent</li>
              <li>Technical Momentum & Trend Analysis</li>
              <li>Fundamental Metric Evaluation</li>
              <li>Conversational Advisor Chatbot</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Compliance & Disclaimer</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All financial predictions, buy/sell recommendations, and virtual balances are generated for educational and simulated investment evaluation only. Not financial advice.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AlphaAdvisor AI. Engineered with FastAPI, React 19 & LangGraph.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">API Docs (/docs)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
