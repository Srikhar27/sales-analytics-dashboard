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
} from 'recharts';
import { CategoryMetric } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { Package } from 'lucide-react';

interface CategoryBarChartProps {
  data: CategoryMetric[] | null;
  loading: boolean;
  title?: string;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data,
  loading,
  title = 'Revenue & Profit by Category',
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const itemData = payload[0].payload as CategoryMetric;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs space-y-1.5 z-50">
          <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-primary-600 font-medium">Revenue:</span>
            <span className="font-bold text-slate-900">{formatCurrency(itemData.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-600 font-medium">Profit:</span>
            <span className="font-bold text-slate-900">{formatCurrency(itemData.profit)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Profit Margin:</span>
            <span
              className={`font-bold ${
                itemData.profit_margin < 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatPercent(itemData.profit_margin)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500">Sales volume and net returns across product categories</p>
      </div>

      <div className="flex-1 min-h-[280px] w-full flex items-center justify-center">
        {loading ? (
          <LoadingSpinner message="Loading categories..." />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No Category Data"
            description="No category sales found for the selected filters."
            icon={Package}
          />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="category"
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
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CategoryBarChart;
