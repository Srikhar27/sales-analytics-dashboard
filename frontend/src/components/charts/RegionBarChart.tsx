import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { RegionMetric } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { MapPin, Award } from 'lucide-react';

interface RegionBarChartProps {
  data: RegionMetric[] | null;
  loading: boolean;
  title?: string;
}

export const RegionBarChart: React.FC<RegionBarChartProps> = ({
  data,
  loading,
  title = 'Regional Revenue & Profit',
}) => {
  const topRegion =
    data && data.length > 0
      ? [...data].sort((a, b) => b.revenue - a.revenue)[0]?.region
      : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const itemData = payload[0].payload as RegionMetric;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 gap-2">
            <span className="font-semibold text-slate-800">{label}</span>
            {itemData.region === topRegion && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                <Award className="w-3 h-3" /> Top Region
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-primary-600 font-medium">Revenue:</span>
            <span className="font-bold text-slate-900">{formatCurrency(itemData.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-600 font-medium">Profit:</span>
            <span className="font-bold text-slate-900">{formatCurrency(itemData.profit)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Margin:</span>
            <span className="font-bold text-slate-700">{formatPercent(itemData.profit_margin)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500">Geographic sales performance</p>
        </div>
        {topRegion && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Leader: <strong>{topRegion}</strong></span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[280px] w-full flex items-center justify-center">
        {loading ? (
          <LoadingSpinner message="Loading regional metrics..." />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No Regional Data"
            description="No sales data found for any region under current filters."
            icon={MapPin}
          />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="region"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-rev-${index}`}
                    fill={entry.region === topRegion ? '#1d4ed8' : '#3b82f6'}
                  />
                ))}
              </Bar>
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RegionBarChart;
