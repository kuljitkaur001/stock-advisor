import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto text-center py-20 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
        <TrendingUp className="w-8 h-8" />
      </div>

      <h1 className="text-6xl font-black text-slate-100 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-200">Page Not Found</h2>
      <p className="text-xs text-slate-400">
        The financial analysis page or ticker route you requested does not exist.
      </p>

      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
      >
        <Home className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
};
