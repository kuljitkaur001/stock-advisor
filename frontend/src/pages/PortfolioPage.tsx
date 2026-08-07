import React, { useEffect, useState } from 'react';
import { portfolioApi, reportsApi } from '../api';
import { PortfolioSummary, Transaction } from '../types';
import { Card, Button, Badge, Skeleton } from '../components/ui/UIComponents';
import { AllocationPieChart } from '../components/charts/AllocationPieChart';
import { Briefcase, Download, TrendingUp, TrendingDown, History, DollarSign } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

export const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadPortfolioData = async () => {
    setLoading(true);
    try {
      const [summary, txs] = await Promise.all([
        portfolioApi.getSummary(),
        portfolioApi.getTransactions()
      ]);
      setPortfolio(summary);
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await reportsApi.downloadPortfolioPdf();
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading || !portfolio) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isPnlPositive = portfolio.total_pnl_usd >= 0;

  return (
    <div className="space-y-8">
      {/* Portfolio Header Bar */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" /> Virtual Portfolio Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time valuation, unrealized PnL, and sector diversification analytics</p>
        </div>

        <Button onClick={handleDownloadPdf} disabled={pdfLoading} variant="primary">
          <Download className="w-4 h-4" /> {pdfLoading ? 'Generating Report...' : 'Download PDF Summary'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Available USD Cash</span>
          <span className="text-xl font-bold font-mono text-emerald-400 block">
            {formatCurrency(portfolio.virtual_balance_usd, 'USD')}
          </span>
        </Card>

        <Card className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Available INR Cash</span>
          <span className="text-xl font-bold font-mono text-emerald-400 block">
            {formatCurrency(portfolio.virtual_balance_inr, 'INR')}
          </span>
        </Card>

        <Card className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Holdings Value</span>
          <span className="text-xl font-bold font-mono text-slate-100 block">
            {formatCurrency(portfolio.total_current_value_usd, 'USD')}
          </span>
        </Card>

        <Card className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Unrealized PnL (USD)</span>
          <span className={`text-xl font-bold font-mono block ${isPnlPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(portfolio.total_pnl_usd, 'USD')} ({formatPercent(portfolio.total_pnl_percent_usd)})
          </span>
        </Card>
      </div>

      {/* Main Grid: Holdings Table & Sector Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Current Stock Holdings</h2>

          <Card className="overflow-x-auto p-0 border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Ticker</th>
                  <th className="p-3.5">Market</th>
                  <th className="p-3.5">Qty</th>
                  <th className="p-3.5">Avg Buy</th>
                  <th className="p-3.5">Cur Price</th>
                  <th className="p-3.5">Cur Value</th>
                  <th className="p-3.5">PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio.holdings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No active holdings. Explore stocks and place virtual trades.
                    </td>
                  </tr>
                ) : (
                  portfolio.holdings.map((h) => {
                    const isPos = h.unrealized_pnl >= 0;
                    return (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-100">{h.ticker}</td>
                        <td className="p-3.5">
                          <Badge variant={h.market === 'IN' ? 'orange' : 'blue' as any}>{h.market}</Badge>
                        </td>
                        <td className="p-3.5 font-mono">{h.quantity}</td>
                        <td className="p-3.5 font-mono">{formatCurrency(h.average_buy_price, h.market)}</td>
                        <td className="p-3.5 font-mono">{formatCurrency(h.current_price, h.market)}</td>
                        <td className="p-3.5 font-mono text-slate-100">{formatCurrency(h.current_value, h.market)}</td>
                        <td className={`p-3.5 font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatPercent(h.unrealized_pnl_percent)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Sector Allocation Pie Chart */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Sector Breakdown</h2>
          <Card>
            <AllocationPieChart sectorAllocation={portfolio.sector_allocation} />
          </Card>
        </div>
      </div>

      {/* Transaction History Log Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" /> Recent Execution History
        </h2>

        <Card className="overflow-x-auto p-0 border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Ticker</th>
                <th className="p-3.5">Qty</th>
                <th className="p-3.5">Execution Price</th>
                <th className="p-3.5">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    No transactions executed yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge variant={tx.transaction_type === 'BUY' ? 'green' : 'red'}>{tx.transaction_type}</Badge>
                    </td>
                    <td className="p-3.5 font-bold text-slate-100">{tx.ticker}</td>
                    <td className="p-3.5 font-mono">{tx.quantity}</td>
                    <td className="p-3.5 font-mono">{formatCurrency(tx.price_per_share, tx.currency)}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-100">{formatCurrency(tx.total_amount, tx.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};
