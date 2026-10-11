import React, { useState, useEffect } from 'react';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';
import { SalesRecord, PaginatedRecords } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';

export const DataExplorer: React.FC = () => {
  const { filters, filterOptions, refreshKey } = useFilters();

  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string>('order_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [recordsResponse, setRecordsResponse] = useState<PaginatedRecords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch records
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecords(
        filters,
        page,
        pageSize,
        debouncedSearch || undefined,
        sortBy || undefined,
        sortOrder
      );
      setRecordsResponse(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to retrieve records from the database.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters, page, pageSize, debouncedSearch, sortBy, sortOrder, refreshKey]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.exportCSV('records', filters);
    } catch (err: any) {
      alert('Failed to export CSV: ' + (err?.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const total = recordsResponse?.total || 0;
  const totalPages = recordsResponse?.total_pages || Math.ceil(total / pageSize) || 1;
  const records = recordsResponse?.data || [];

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary-600 ml-1 inline" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Top filter and actions header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary-500 focus:outline-none transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export Filtered CSV'}</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchRecords} />}

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Row count bar */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{records.length}</strong> of{' '}
            <strong className="text-slate-800">{formatNumber(total)}</strong> sales transactions
          </span>
          {filters.region || filters.category ? (
            <span className="text-[11px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-medium">
              Filtered: {filters.region && `[Region: ${filters.region}]`}{' '}
              {filters.category && `[Category: ${filters.category}]`}
            </span>
          ) : null}
        </div>

        {/* Table content */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <LoadingSpinner message="Querying dataset..." />
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No sales records match your current search and filter parameters.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('order_id')}
                    className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 transition whitespace-nowrap"
                  >
                    Order ID {renderSortIcon('order_id')}
                  </th>
                  <th
                    onClick={() => handleSort('order_date')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition whitespace-nowrap"
                  >
                    Date {renderSortIcon('order_date')}
                  </th>
                  <th
                    onClick={() => handleSort('customer_name')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition whitespace-nowrap"
                  >
                    Customer {renderSortIcon('customer_name')}
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Segment</th>
                  <th className="py-3 px-3 whitespace-nowrap">Region</th>
                  <th className="py-3 px-3 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3 whitespace-nowrap">Product</th>
                  <th
                    onClick={() => handleSort('sales')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition whitespace-nowrap"
                  >
                    Sales {renderSortIcon('sales')}
                  </th>
                  <th
                    onClick={() => handleSort('quantity')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition whitespace-nowrap"
                  >
                    Qty {renderSortIcon('quantity')}
                  </th>
                  <th
                    onClick={() => handleSort('profit')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition whitespace-nowrap"
                  >
                    Profit {renderSortIcon('profit')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {r.order_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {formatDate(r.order_date)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap max-w-[140px] truncate">
                      {r.customer_name || '--'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{r.segment || '--'}</td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{r.region || '--'}</td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {r.category || '--'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate" title={r.product_name}>
                      {r.product_name || '--'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.sales)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap">
                      {formatNumber(r.quantity)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        r.profit < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(r.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Page <strong className="text-slate-800">{page}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-semibold text-slate-700">{page}</span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
