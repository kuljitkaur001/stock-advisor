import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Target, ShieldAlert, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Pre-process content to replace raw enum strings like RecommendationEnum.BUY with clean formatted markers if any
  const cleanedContent = content
    .replace(/RecommendationEnum\.BUY/g, 'BUY')
    .replace(/RecommendationEnum\.SELL/g, 'SELL')
    .replace(/RecommendationEnum\.HOLD/g, 'HOLD');

  return (
    <div className="markdown-body text-slate-200 text-xs leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-extrabold text-slate-100 mt-3 mb-1.5 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-slate-100 mt-2.5 mb-1 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mt-2 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-slate-300 mt-1.5 mb-0.5">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-300">{children}</p>,

          // Strong / Bold Text with Badge logic for BUY / SELL / HOLD
          strong: ({ children }) => {
            const textStr = String(children).trim();

            if (textStr === 'BUY' || textStr === 'STRONG BUY') {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm mx-1">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> BUY
                </span>
              );
            }
            if (textStr === 'SELL' || textStr === 'STRONG SELL') {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm mx-1">
                  <AlertCircle className="w-3 h-3 mr-1" /> SELL
                </span>
              );
            }
            if (textStr === 'HOLD' || textStr === 'NEUTRAL') {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm mx-1">
                  HOLD
                </span>
              );
            }

            return <strong className="font-bold text-slate-100">{children}</strong>;
          },

          // Lists
          ul: ({ children }) => <ul className="space-y-1 my-2 pl-2 text-slate-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 my-2 pl-4 text-slate-300">{children}</ol>,
          li: ({ children }) => (
            <li className="flex items-start gap-1.5 text-slate-300">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Blockquotes / Alert Boxes
          blockquote: ({ children }) => (
            <div className="my-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2 shadow-inner">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 italic">{children}</div>
            </div>
          ),

          // Code blocks & Inline code
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;
            if (isInline) {
              return (
                <code className="bg-slate-800 text-emerald-400 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-700/60" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="my-2 rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-emerald-300 text-[11px] overflow-x-auto shadow-md">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-800 shadow-md">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-800/90 text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-700">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-800/40 transition-colors">{children}</tr>
          ),
          th: ({ children }) => <th className="px-3 py-2 font-bold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-slate-300 font-mono">{children}</td>,
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
};
