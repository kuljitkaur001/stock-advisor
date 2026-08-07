import React, { useState } from 'react';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types';
import { aiApi } from '../../api';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

export const ChatWindow: React.FC<{ tickerContext?: string }> = ({ tickerContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      message: `Hello! I am your AI Financial Advisor. ${tickerContext ? `Currently analyzing ${tickerContext}.` : 'Ask me anything about stocks, technical indicators (RSI, MACD), or portfolio strategy!'}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = newHistory.map((m) => ({
        sender: m.sender,
        message: m.message
      }));

      const res = await aiApi.sendMessage(userMsg.message, tickerContext, historyPayload);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: res.message,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          message: 'Sorry, I encountered an issue communicating with the AI service. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePillClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-[550px] w-full glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">AI Financial Advisor</h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online • Gemini 3.6 Flash Engine
            </span>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        {['Should I buy Apple?', 'Compare Tesla and Nvidia', 'Explain RSI', 'What is diversification?'].map((pill, i) => (
          <button
            key={i}
            onClick={() => handlePillClick(pill)}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-400 border border-slate-700/60 whitespace-nowrap transition-colors"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-[90%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.sender === 'user' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}
            >
              {m.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-lg'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-md'
              }`}
            >
              {m.sender === 'user' ? (
                <div className="whitespace-pre-wrap font-medium">{m.message}</div>
              ) : (
                <MarkdownRenderer content={m.message} />
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <strong className="text-slate-300">Data Sources:</strong> {m.sources.join(' • ')}
                </div>
              )}
              <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">{m.timestamp}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse p-2">
            <Sparkles className="w-4 h-4" /> Gemini 3.6 Flash reasoning...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900/90 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a financial question..."
          className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
