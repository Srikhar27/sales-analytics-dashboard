import React from 'react';
import { useFilters } from '../hooks/useFilters';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import TopProductsChart from '../components/charts/TopProductsChart';
import ProfitabilityChart from '../components/charts/ProfitabilityChart';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { AlertOctagon, Package, Layers } from 'lucide-react';

export const ProductAnalysis: React.FC = () => {
  const { filters, refreshKey } = useFilters();

  // Top products
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useApi(() => api.getTopProducts(filters, 15), [filters, refreshKey]);

  // Profitability
  const {
    data: profitabilityData,
    loading: profitabilityLoading,
    error: profitabilityError,
    refetch: refetchProfitability,
  } = useApi(() => api.getProfitability(filters), [filters, refreshKey]);

  // Subcategories
  const {
    data: subcategoryData,
    loading: subcategoryLoading,
    error: subcategoryError,
  } = useApi(() => api.getSubcategories(filters), [filters, refreshKey]);

  // Loss-making products / items
  const lossMakingItems = (profitabilityData || []).filter((item) => item.profit < 0 || item.is_negative);

  return (
    <div className="space-y-6">
      {/* Top row: Top products chart & Profitability chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {productsError ? (
            <ErrorMessage message={productsError} onRetry={refetchProducts} />
          ) : (
            <TopProductsChart data={productsData} loading={productsLoading} />
          )}
        </div>
        <div>
          {profitabilityError ? (
            <ErrorMessage message={profitabilityError} onRetry={refetchProfitability} />
          ) : (
            <ProfitabilityChart data={profitabilityData} loading={profitabilityLoading} />
          )}
        </div>
      </div>

      {/* Loss Making Products Alert / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Loss-Making Segments & Products
              </h3>
              <p className="text-xs text-slate-500">
                Items producing negative margin requiring pricing or discounting intervention
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-100 text-rose-800">
            {lossMakingItems.length} Negative Drivers
          </span>
        </div>

        {lossMakingItems.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500">
            🎉 Great job! No negative profit drivers identified under the current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-rose-50/50 text-rose-950 font-semibold border-b border-rose-100">
                <tr>
                  <th className="py-2.5 px-3">Product / Segment</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Net Loss</th>
                  <th className="py-2.5 px-3 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lossMakingItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/20 transition">
                    <td className="py-2 px-3 font-medium text-slate-900">{item.name}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(item.revenue)}</td>
                    <td className="py-2 px-3 text-right font-bold text-rose-600">
                      {formatCurrency(item.profit)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-rose-600">
                      {formatPercent(item.profit_margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sub-Category Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sub-Category Breakdown</h3>
            <p className="text-xs text-slate-500">Detailed performance hierarchy</p>
          </div>
        </div>

        {subcategoryError ? (
          <ErrorMessage message={subcategoryError} />
        ) : !subcategoryData || subcategoryData.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
            No sub-category data available.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Sub-Category</th>
                  <th className="py-2.5 px-3">Parent Category</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subcategoryData.map((sub: any, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 font-semibold text-slate-900">{sub.category}</td>
                    <td className="py-2 px-3 text-slate-500">{sub.parent_category || filters.category || 'All'}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(sub.orders)}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(sub.quantity)}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900">
                      {formatCurrency(sub.revenue)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-medium ${
                        sub.profit < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(sub.profit)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        sub.profit_margin < 0 ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {formatPercent(sub.profit_margin)}
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

export default ProductAnalysis;
