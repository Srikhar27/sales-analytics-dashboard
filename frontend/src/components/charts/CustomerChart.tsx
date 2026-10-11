import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { CustomerMetric } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { Users } from 'lucide-react';

interface CustomerChartProps {
  data: CustomerMetric[] | null;
  loading: boolean;
  title?: string;
}

export const CustomerChart: React.FC<CustomerChartProps> = ({
  data,
  loading,
  title = 'Top Customers by Spend',
}) => {
  const chartData = (data || []).slice(0, 10).map((c) => ({
    ...c,
    displayName:
      c.customer_name.length > 20 ? `${c.customer_name.slice(0, 20)}...` : c.customer_name,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CustomerMetric;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs space-y-1.5 z-50">
          <p className="font-semibold text-slate-900 border-b border-slate-100 pb-1">{item.customer_name}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 font-medium">Segment:</span>
            <span className="font-semibold text-slate-700">{item.segment}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-primary-600 font-medium">Revenue:</span>
            <span className="font-bold text-slate-900">{formatCurrency(item.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 font-medium">Orders:</span>
            <span className="font-bold text-slate-900">{formatNumber(item.orders)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Avg Order Value:</span>
            <span className="font-bold text-emerald-600">{formatCurrency(item.avg_order_value)}</span>
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
        <p className="text-xs text-slate-500">Highest gross revenue account holders</p>
      </div>

      <div className="flex-1 min-h-[340px] w-full flex items-center justify-center">
        {loading ? (
          <LoadingSpinner message="Loading customers..." />
        ) : !chartData || chartData.length === 0 ? (
          <EmptyState
            title="No Customer Data"
            description="No customer records available for the selected filters."
            icon={Users}
          />
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CustomerChart;
