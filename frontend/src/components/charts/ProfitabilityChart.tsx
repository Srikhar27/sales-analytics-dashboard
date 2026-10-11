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
  ReferenceLine,
  Cell,
} from 'recharts';
import { ProfitabilityItem } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { DollarSign } from 'lucide-react';

interface ProfitabilityChartProps {
  data: ProfitabilityItem[] | null;
  loading: boolean;
  title?: string;
}

export const ProfitabilityChart: React.FC<ProfitabilityChartProps> = ({
  data,
  loading,
  title = 'Profitability Analysis (Revenue vs Net Profit)',
}) => {
  const chartData = (data || []).slice(0, 15).map((item) => ({
    ...item,
    displayName: item.name.length > 18 ? `${item.name.slice(0, 18)}...` : item.name,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ProfitabilityItem;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs space-y-1.5 z-50">
          <p className="font-semibold text-slate-900 border-b border-slate-100 pb-1">{item.name}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-primary-600 font-medium">Revenue:</span>
            <span className="font-bold text-slate-900">{formatCurrency(item.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 font-medium">Net Profit:</span>
            <span className={`font-bold ${item.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(item.profit)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Margin:</span>
            <span className={`font-bold ${item.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatPercent(item.profit_margin)}
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
        <p className="text-xs text-slate-500">
          Highlighting revenue generation alongside profit contributions and negative margins
        </p>
      </div>

      <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
        {loading ? (
          <LoadingSpinner message="Calculating profitability..." />
        ) : !chartData || chartData.length === 0 ? (
          <EmptyState
            title="No Profitability Data"
            description="No profitability records available for current filters."
            icon={DollarSign}
          />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="displayName"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                angle={-30}
                textAnchor="end"
                interval={0}
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
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-prof-${index}`}
                    fill={entry.profit < 0 ? '#ef4444' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ProfitabilityChart;
