import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCountry } from '../../context/CountryContext';
import { TrendingUp, LayoutDashboard, Compass, Briefcase, Bookmark, Bot, User as UserIcon, Shield, LogOut, Globe, Sun, Moon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { country, setCountry } = useCountry();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AlphaAdvisor
            </span>
            <span className="block text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">
              AI Virtual Portfolio
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isActive('/dashboard') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link
              to="/explore"
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isActive('/explore') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <Compass className="w-4 h-4" /> Stock Explorer
            </Link>
            <Link
              to="/portfolio"
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isActive('/portfolio') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <Briefcase className="w-4 h-4" /> Portfolio
            </Link>
            <Link
              to="/watchlist"
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isActive('/watchlist') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <Bookmark className="w-4 h-4" /> Watchlist
            </Link>
            <Link
              to="/ai-chat"
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isActive('/ai-chat') ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <Bot className="w-4 h-4" /> AI Advisor
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isActive('/admin') ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>
        )}

        {/* Right Section: Country Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Country Market Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setCountry('US')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${country === 'US' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              data-testid="market-switch-us"
            >
              🇺🇸 US
            </button>
            <button
              onClick={() => setCountry('IN')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${country === 'IN' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              data-testid="market-switch-in"
            >
              🇮🇳 IN (NSE)
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:block text-right">
                <span className="block text-xs font-medium text-slate-200">{user.full_name}</span>
                <span className="block text-[10px] text-emerald-400 font-mono">
                  {country === 'IN' ? formatCurrency(user.virtual_balance_inr, 'INR') : formatCurrency(user.virtual_balance_usd, 'USD')}
                </span>
              </div>
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-emerald-500 transition-colors text-slate-200 font-bold text-sm"
              >
                {user.full_name.charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
