import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', onClick, ...rest }) => (
  <div onClick={onClick} className={`glass-card rounded-xl p-5 ${className}`} {...rest}>
    {children}
  </div>
);

export const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; type?: 'button' | 'submit' | 'reset'; className?: string; disabled?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, onClick, variant = 'primary', type = 'button', className = '', disabled = false, ...rest }) => {
  let base = 'px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ';
  if (variant === 'primary') base += 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/25';
  else if (variant === 'secondary') base += 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700';
  else if (variant === 'danger') base += 'bg-rose-500 hover:rose-400 text-white shadow-lg shadow-rose-500/25';
  else if (variant === 'ghost') base += 'bg-transparent hover:bg-slate-800 text-slate-300';

  return (
    <button type={type} onClick={onClick} className={`${base} ${className}`} disabled={disabled} {...rest}>
      {children}
    </button>
  );
};

export const Input: React.FC<{
  label?: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}> = ({ label, type = 'text', placeholder, value, onChange, className = '', required = false }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`bg-slate-900/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all ${className}`}
    />
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel max-w-lg w-full rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-xl font-bold">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }> = ({
  children,
  variant = 'gray'
}) => {
  let style = 'bg-slate-800 text-slate-300 border-slate-700';
  if (variant === 'green') style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (variant === 'red') style = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  if (variant === 'yellow') style = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  if (variant === 'blue') style = 'bg-sky-500/10 text-sky-400 border-sky-500/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {children}
    </span>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => (
  <div className={`bg-slate-800/80 animate-pulse rounded-lg ${className}`} />
);
