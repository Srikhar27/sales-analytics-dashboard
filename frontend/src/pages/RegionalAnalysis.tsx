import React from 'react';
import { useFilters } from '../hooks/useFilters';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import RegionBarChart from '../components/charts/RegionBarChart';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { Trophy, AlertTriangle, MapPin, Globe } from 'lucide-react';

export const RegionalAnalysis: React.FC = () => {
  const { filters, refreshKey } = useFilters();

  const {
    data: regionsData,
    loading: regionsLoading,
    error: regionsError,
    refetch: refetchRegions,
  } = useApi(() => api.getRegions(filters), [filters, refreshKey]);

  // Identify Best and Worst regions
  const sortedByRevenue = regionsData ? [...regionsData].sort((a, b) => b.revenue - a.revenue) : [];
  const bestRegion = sortedByRevenue.length > 0 ? sortedByRevenue[0] : null;
  const worstRegion =
    sortedByRevenue.length > 1 ? sortedByRevenue[sortedByRevenue.length - 1] : null;

  const sortedByMargin = regionsData
    ? [...regionsData].sort((a, b) => b.profit_margin - a.profit_margin)
    : [];
  const highestMarginRegion = sortedByMargin.length > 0 ? sortedByMargin[0] : null;

  return (
    <div className="space-y-6">
      {/* Highlights: Best vs Worst regions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Top revenue region */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Top Revenue Territory
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {bestRegion ? bestRegion.region : '--'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {bestRegion ? `${formatCurrency(bestRegion.revenue)} in total sales` : 'No data'}
            </p>
          </div>
        </div>

        {/* Highest Margin region */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Most Profitable Territory
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {highestMarginRegion ? highestMarginRegion.region : '--'}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              {highestMarginRegion
                ? `${formatPercent(highestMarginRegion.profit_margin)} profit margin`
                : 'No data'}
            </p>
          </div>
        </div>

        {/* Lowest revenue region */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lagging Territory
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {worstRegion ? worstRegion.region : '--'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {worstRegion ? `${formatCurrency(worstRegion.revenue)} generated` : 'No data'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div>
        {regionsError ? (
          <ErrorMessage message={regionsError} onRetry={refetchRegions} />
        ) : (
          <RegionBarChart data={regionsData} loading={regionsLoading} />
        )}
      </div>

      {/* Detailed Region Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Regional Performance Metrics</h3>
            <p className="text-xs text-slate-500">Comprehensive geographical ledger</p>
          </div>
        </div>

        {!regionsData || regionsData.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
            No regional data found for current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Gross Revenue</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-right">Profit Margin</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionsData.map((reg, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{reg.region}</td>
                    <td className="py-3 px-3 text-right">{formatNumber(reg.orders)}</td>
                    <td className="py-3 px-3 text-right">{formatNumber(reg.quantity)}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-900">
                      {formatCurrency(reg.revenue)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-medium ${
                        reg.profit < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(reg.profit)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        reg.profit_margin < 0 ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {formatPercent(reg.profit_margin)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {reg.region === bestRegion?.region ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Leader
                        </span>
                      ) : reg.profit < 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          Deficit
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                          Stable
                        </span>
                      )}
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

export default RegionalAnalysis;
