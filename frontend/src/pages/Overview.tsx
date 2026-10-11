import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Layers,
  Percent,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useFilters } from '../hooks/useFilters';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import KPICard from '../components/common/KPICard';
import RevenueLineChart from '../components/charts/RevenueLineChart';
import CategoryBarChart from '../components/charts/CategoryBarChart';
import RegionBarChart from '../components/charts/RegionBarChart';
import ErrorMessage from '../components/common/ErrorMessage';
import { BusinessInsight } from '../types';

export const Overview: React.FC = () => {
  const { filters, refreshKey } = useFilters();
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // KPI summary
  const {
    data: kpiData,
    loading: kpiLoading,
    error: kpiError,
    refetch: refetchKPI,
  } = useApi(() => api.getDashboardSummary(filters), [filters, refreshKey]);

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

  // Regions
  const {
    data: regionData,
    loading: regionLoading,
    error: regionError,
  } = useApi(() => api.getRegions(filters), [filters, refreshKey]);

  // Business insights
  const {
    data: insightsData,
    loading: insightsLoading,
    error: insightsError,
  } = useApi(() => api.getInsights(filters), [filters, refreshKey]);

  const renderInsightIcon = (severity: BusinessInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
    }
  };

  const getSeverityBadgeClass = (severity: BusinessInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  return (
    <div className="space-y-6">
      {kpiError && <ErrorMessage message={kpiError} onRetry={refetchKPI} />}

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Revenue"
          value={kpiData?.total_revenue}
          format="currency"
          icon={DollarSign}
          change_pct={kpiData?.revenue_change_pct}
          subtitle="Gross sales generated"
          loading={kpiLoading}
        />
        <KPICard
          title="Total Profit"
          value={kpiData?.total_profit}
          format="currency"
          icon={TrendingUp}
          change_pct={kpiData?.profit_change_pct}
          subtitle="Net return on sales"
          loading={kpiLoading}
        />
        <KPICard
          title="Profit Margin"
          value={kpiData?.profit_margin}
          format="percent"
          icon={Percent}
          subtitle="Net earnings efficiency"
          loading={kpiLoading}
        />
        <KPICard
          title="Total Orders"
          value={kpiData?.total_orders}
          format="number"
          icon={ShoppingCart}
          subtitle="Transactions executed"
          loading={kpiLoading}
        />
        <KPICard
          title="Avg Order Value"
          value={kpiData?.avg_order_value}
          format="currency"
          icon={Receipt}
          subtitle="Average ticket size"
          loading={kpiLoading}
        />
        <KPICard
          title="Units Sold"
          value={kpiData?.total_units_sold}
          format="number"
          icon={Layers}
          subtitle="Physical item volume"
          loading={kpiLoading}
        />
      </div>

      {/* Revenue Line Chart */}
      <div className="w-full">
        {trendsError ? (
          <ErrorMessage message={trendsError} onRetry={refetchTrends} />
        ) : (
          <RevenueLineChart
            data={trendsData}
            loading={trendsLoading}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        )}
      </div>

      {/* Category and Region charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {categoryError ? (
            <ErrorMessage message={categoryError} />
          ) : (
            <CategoryBarChart data={categoryData} loading={categoryLoading} />
          )}
        </div>
        <div>
          {regionError ? (
            <ErrorMessage message={regionError} />
          ) : (
            <RegionBarChart data={regionData} loading={regionLoading} />
          )}
        </div>
      </div>

      {/* Automated Business Insights */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">AI & Business Observations</h3>
            <p className="text-xs text-slate-500">
              Heuristic trends, performance drivers, and operational recommendations
            </p>
          </div>
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : insightsError ? (
          <ErrorMessage message={insightsError} />
        ) : !insightsData || insightsData.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
            No specific observations detected for current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insightsData.map((insight, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getSeverityBadgeClass(
                        insight.severity
                      )}`}
                    >
                      {insight.severity}
                    </span>
                    {renderInsightIcon(insight.severity)}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">{insight.title}</h4>
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">{insight.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  {insight.metric_value && (
                    <div className="text-xs text-slate-700 font-medium mb-1">
                      <span className="text-slate-400">Impact: </span>
                      <strong className="text-primary-700">{insight.metric_value}</strong>{' '}
                      {insight.comparison && <span className="text-slate-500">({insight.comparison})</span>}
                    </div>
                  )}
                  {insight.recommendation && (
                    <div className="text-xs text-slate-500 italic">
                      💡 {insight.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
