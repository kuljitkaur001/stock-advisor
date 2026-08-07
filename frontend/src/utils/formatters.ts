export const formatCurrency = (val: number, currency: string = 'USD'): string => {
  if (currency === 'INR' || currency === 'IN') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatMarketCap = (val?: number, currency: string = 'USD'): string => {
  if (!val) return 'N/A';
  const prefix = currency === 'INR' || currency === 'IN' ? '₹' : '$';
  if (val >= 1e12) return `${prefix}${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `${prefix}${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${prefix}${(val / 1e6).toFixed(2)}M`;
  return `${prefix}${val.toLocaleString()}`;
};

export const formatPercent = (val: number): string => {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
};

export const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};
