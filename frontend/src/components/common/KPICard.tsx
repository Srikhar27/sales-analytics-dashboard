import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

interface KPICardProps {
  title: string;
  value: number | null | undefined;
  format: 'currency' | 'number' | 'percent';
  icon: LucideIcon;
  change_pct?: number | null;
  subtitle?: string;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  format,
  icon: Icon,
  change_pct,
  subtitle,
  loading = false,
}) => {
  const getFormattedValue = () => {
    if (value === null || value === undefined) return '--';
    if (format === 'currency') return formatCurrency(value);
    if (format === 'percent') return formatPercent(value);
    return formatNumber(value);
  };

  const renderBadge = () => {
    if (change_pct === undefined || change_pct === null) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
          <Minus className="w-3 h-3" />
          <span>0.0%</span>
        </span>
      );
    }

    const isPositive = change_pct > 0;
    const isNegative = change_pct < 0;

    if (isPositive) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+{change_pct.toFixed(1)}%</span>
        </span>
      );
    }

    if (isNegative) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>{change_pct.toFixed(1)}%</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
        <Minus className="w-3 h-3" />
        <span>0.0%</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        {loading ? (
          <div className="h-8 w-28 bg-slate-100 animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold tracking-tight text-slate-900">{getFormattedValue()}</div>
        )}
        {!loading && renderBadge()}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default KPICard;
