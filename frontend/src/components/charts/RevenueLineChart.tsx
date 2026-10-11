import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { RevenueTrendPoint } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { TrendingUp } from 'lucide-react';

interface RevenueLineChartProps {
  data: RevenueTrendPoint[] | null;
  loading: boolean;
  granularity?: 'daily' | 'weekly' | 'monthly';
  onGranularityChange?: (g: 'daily' | 'weekly' | 'monthly') => void;
  title?: string;
}

export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({
  data,
  loading,
  granularity = 'monthly',
  onGranularityChange,
  title = 'Revenue & Profit Trends',
}) => {
  const [activeGranularity, setActiveGranularity] = useState<'daily' | 'weekly' | 'monthly'>(
    granularity
  );

  const handleToggle = (g: 'daily' | 'weekly' | 'monthly') => {
    setActiveGranularity(g);
    if (onGranularityChange) {
      onGranularityChange(g);
    }
  };

  const currentGranularity = onGranularityChange ? granularity : activeGranularity;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs space-y-1 z-50">
          <p className="font-semibold text-slate-800 pb-1 border-b border-slate-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="capitalize">{entry.name}:</span>
              </span>
              <span className="font-semibold text-slate-900">
                {entry.dataKey === 'orders' ? formatNumber(entry.value) : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500">Historical performance over selected timeframe</p>
        </div>

        {/* Granularity toggles */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => handleToggle(period)}
              className={`px-3 py-1 font-medium capitalize rounded-md transition ${
                currentGranularity === period
                  ? 'bg-white text-primary-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
        {loading ? (
          <LoadingSpinner message="Loading revenue trends..." />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No Trend Data"
            description="No sales recorded in the specified date range."
            icon={TrendingUp}
          />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
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
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981', strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RevenueLineChart;
