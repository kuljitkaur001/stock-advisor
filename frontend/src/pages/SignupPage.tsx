import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input } from '../components/ui/UIComponents';
import { CountryEnum } from '../types';
import { TrendingUp } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<CountryEnum>('US');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(email, password, fullName, country);
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => `${d.loc?.[d.loc?.length - 1] || 'Field'}: ${d.msg}`).join(' | '));
      } else {
        setError(detail || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="glass-panel p-8 rounded-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-slate-950 stroke-[3]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100">Create Account</h2>
          <p className="text-xs text-slate-400">Get $100,000 USD + ₹8,000,000 INR virtual cash</p>
        </div>

        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Market Preference</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryEnum)}
              className="bg-slate-900/80 border border-slate-700/80 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
            >
              <option value="US">🇺🇸 US Stock Market (NASDAQ, NYSE)</option>
              <option value="IN">🇮🇳 Indian Stock Market (NSE)</option>
            </select>
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Creating Account...' : 'Register Account'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-400 font-bold hover:underline">
            Log In
          </Link>
        </div>
      </Card>
    </div>
  );
};
