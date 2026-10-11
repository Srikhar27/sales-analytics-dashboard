import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useFilters } from '../hooks/useFilters';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import CustomerChart from '../components/charts/CustomerChart';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { PieChart as PieIcon, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const CustomerAnalysis: React.FC = () => {
  const { filters, refreshKey } = useFilters();

  // Top Customers
  const {
    data: topCustomers,
    loading: customersLoading,
    error: customersError,
    refetch: refetchCustomers,
  } = useApi(() => api.getTopCustomers(filters, 10), [filters, refreshKey]);

  // Customer Segments
  const {
    data: segmentsData,
    loading: segmentsLoading,
    error: segmentsError,
    refetch: refetchSegments,
  } = useApi(() => api.getCustomerSegments(filters), [filters, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Top row: Top Customers Horizontal Chart & Customer Segment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {customersError ? (
            <ErrorMessage message={customersError} onRetry={refetchCustomers} />
          ) : (
            <CustomerChart data={topCustomers} loading={customersLoading} />
          )}
        </div>

        {/* Customer Segments Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col h-full">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Customer Segment Distribution
            </h3>
            <p className="text-xs text-slate-500">Revenue split across consumer and corporate segments</p>
          </div>

          <div className="flex-1 min-h-[340px] w-full flex items-center justify-center">
            {segmentsLoading ? (
              <LoadingSpinner message="Loading segment data..." />
            ) : segmentsError ? (
              <ErrorMessage message={segmentsError} onRetry={refetchSegments} />
            ) : !segmentsData || segmentsData.length === 0 ? (
              <EmptyState
                title="No Segments Available"
                description="No segment data found for selected dates."
                icon={PieIcon}
              />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={segmentsData}
                    dataKey="revenue"
                    nameKey="segment"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={55}
                    paddingAngle={4}
                    label={(entry: any) => `${entry.name || entry.segment}: ${formatCurrency(entry.value || entry.revenue)}`}
                  >
                    {segmentsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Segment Metrics & Average Order Value (AOV) Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Segment Performance Metrics & Average Order Value (AOV)
            </h3>
            <p className="text-xs text-slate-500">
              Customer base sizing, profitability, and purchasing intensity
            </p>
          </div>
        </div>

        {segmentsLoading ? (
          <LoadingSpinner />
        ) : !segmentsData || segmentsData.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
            No segment records available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Avg Order Value (AOV)</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-right">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {segmentsData.map((seg, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span>{seg.segment}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-900">
                      {formatCurrency(seg.revenue)}
                    </td>
                    <td className="py-3 px-3 text-right">{formatNumber(seg.orders)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-primary-700">
                      {formatCurrency(seg.avg_order_value)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-medium ${
                        seg.profit < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(seg.profit)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        seg.profit_margin < 0 ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {formatPercent(seg.profit_margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerAnalysis;
