import React, { useState } from 'react';
import { useFilters } from '../hooks/useFilters';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import {
  FileDown,
  Printer,
  Table,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle,
  FileText,
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const Reports: React.FC = () => {
  const { filters, refreshKey } = useFilters();
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  // Summary stats for preview
  const { data: kpi, loading: kpiLoading } = useApi(
    () => api.getDashboardSummary(filters),
    [filters, refreshKey]
  );

  const handleExportCSV = async (type: 'records' | 'summary') => {
    setDownloadingType(type);
    try {
      await api.exportCSV(type, filters);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportQuality = async () => {
    setDownloadingType('quality');
    try {
      const report = await api.exportQualityReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data_quality_report.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDownloadingType(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Executive Reports & Data Exports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate and download formatted data packs, analytical summaries, and board-ready outputs.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save to PDF</span>
        </button>
      </div>

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Dataset Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
              <Table className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Full Transactional Records</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Export every line-item sales record applying your current active date, region, and category filters.
            </p>
          </div>

          <button
            onClick={() => handleExportCSV('records')}
            disabled={downloadingType === 'records'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloadingType === 'records' ? 'Generating CSV...' : 'Download Sales CSV'}</span>
          </button>
        </div>

        {/* Executive Summary CSV */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Aggregated Summary Report</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Includes executive KPIs, categorized performance tables, and regional metrics compiled into a single CSV.
            </p>
          </div>

          <button
            onClick={() => handleExportCSV('summary')}
            disabled={downloadingType === 'summary'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloadingType === 'summary' ? 'Compiling...' : 'Download Summary CSV'}</span>
          </button>
        </div>

        {/* Quality Audit Report */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Data Health & Audit Report</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Structured JSON report detailing missing column ratios, duplicate flags, and data sanitization summaries.
            </p>
          </div>

          <button
            onClick={handleExportQuality}
            disabled={downloadingType === 'quality'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloadingType === 'quality' ? 'Exporting...' : 'Download JSON Audit'}</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Overview Section for Print / Review */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-5 h-5 text-primary-600" />
          <h3 className="text-sm font-bold text-slate-900">Active Reporting Snapshot</h3>
        </div>

        {kpiLoading ? (
          <LoadingSpinner message="Loading report metrics..." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Reported Revenue</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {formatCurrency(kpi?.total_revenue)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Reported Profit</span>
              <span className="text-base font-bold text-emerald-600 block mt-1">
                {formatCurrency(kpi?.total_profit)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Blended Margin</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {formatPercent(kpi?.profit_margin)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Recorded Transactions</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {formatNumber(kpi?.total_orders)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
