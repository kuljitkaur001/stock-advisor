import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button } from '../components/ui/UIComponents';
import { User, Wallet, Globe, Shield, LogOut } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">{user.full_name}</h1>
            <p className="text-xs text-slate-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="green">{user.role.toUpperCase()}</Badge>
              <Badge variant="blue">Primary Market: {user.preferred_country}</Badge>
            </div>
          </div>
        </div>

        <Button onClick={handleLogout} variant="danger">
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {/* Account Balances Card */}
      <Card className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" /> Account Virtual Cash Balances
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase">US Market Virtual Cash</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 block">
              {formatCurrency(user.virtual_balance_usd, 'USD')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase">Indian NSE Virtual Cash</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 block">
              {formatCurrency(user.virtual_balance_inr, 'INR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
