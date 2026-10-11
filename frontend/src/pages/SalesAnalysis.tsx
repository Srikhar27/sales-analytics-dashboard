import React, { useState } from 'react';
import { useFilters } from '../hooks/useFilters';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import RevenueLineChart from '../components/charts/RevenueLineChart';
import CategoryBarChart from '../components/charts/CategoryBarChart';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { TrendingUp, FileText, Calendar } from 'lucide-react';

export const SalesAnalysis: React.FC = () => {
  const { filters, refreshKey } = useFilters();
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Revenue trends
  const {
    data: trendsData,
    loading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useApi(
    () => api.getRevenueTrends(filters, granularity),
    [filters, granularity, refreshKey]
  );

  // Categories
  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
  } = useApi(() => api.getCategories(filters), [filters, refreshKey]);

  // Subcategories
  const {
    data: subcategoryData,
    loading: subcategoryLoading,
    error: subcategoryError,
  } = useApi(() => api.getSubcategories(filters), [filters, refreshKey]);

  // Derived trend analysis summary
  const totalRevenue = trendsData?.reduce((acc, curr) => acc + curr.revenue, 0) || 0;
  const totalProfit = trendsData?.reduce((acc, curr) => acc + curr.profit, 0) || 0;
  const totalOrders = trendsData?.reduce((acc, curr) => acc + curr.orders, 0) || 0;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top summary highlight bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-xs text-slate-500 font-medium">Aggregated Revenue</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(totalRevenue)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Aggregated Profit</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(totalProfit)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Blended Margin</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{formatPercent(overallMargin)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Total Orders</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{formatNumber(totalOrders)}</p>
        </div>
      </div>

      {/* Main Revenue Trend Chart */}
      <div>
        {trendsError ? (
          <ErrorMessage message={trendsError} onRetry={refetchTrends} />
        ) : (
          <RevenueLineChart
            data={trendsData}
            loading={trendsLoading}
            granularity={granularity}
            onGranularityChange={setGranularity}
            title={`Sales & Profit Trend Analysis (${granularity.toUpperCase()})`}
          />
        )}
      </div>

      {/* Category breakdown bar chart */}
      <div>
        {categoryError ? (
          <ErrorMessage message={categoryError} />
        ) : (
          <CategoryBarChart data={categoryData} loading={categoryLoading} />
        )}
      </div>

      {/* Breakdown Table & Trend Analysis Text */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of periods */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Period Breakdown Table</h3>
              <p className="text-xs text-slate-500">Chronological performance records</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="overflow-x-auto max-h-[350px]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date / Period</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!trendsData || trendsData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No trend records to display.
                    </td>
                  </tr>
                ) : (
                  trendsData.map((row, idx) => {
                    const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 font-medium text-slate-800">{row.date}</td>
                        <td className="py-2 px-3 text-right">{formatNumber(row.orders)}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-medium ${
                            row.profit < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {formatCurrency(row.profit)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-semibold ${
                            margin < 0 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {formatPercent(margin)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trend analysis text card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Trend Assessment</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Throughout the filtered timeframe, the enterprise generated an aggregate revenue of{' '}
                <strong className="text-slate-900">{formatCurrency(totalRevenue)}</strong> across{' '}
                <strong className="text-slate-900">{formatNumber(totalOrders)}</strong> recorded sales transactions.
              </p>
              <p>
                Net operational profit reached{' '}
                <strong className={totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatCurrency(totalProfit)}
                </strong>
                , representing a blended profit margin of{' '}
                <strong className="text-slate-900">{formatPercent(overallMargin)}</strong>.
              </p>
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                💡 <strong>Key Takeaway:</strong> Periodic fluctuations in gross revenue are closely linked with
                seasonal discounting and product mix shifts. Maintaining positive unit economics across lower-margin
                categories remains a priority.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Updated in real-time from active dataset records.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalysis;
