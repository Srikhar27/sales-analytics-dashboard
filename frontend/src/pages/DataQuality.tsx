import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatNumber } from '../utils/formatters';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  CalendarX,
  FileQuestion,
  Download,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';

export const DataQuality: React.FC = () => {
  const { refreshKey } = useFilters();
  const [downloading, setDownloading] = useState(false);

  const {
    data: qualityReport,
    loading,
    error,
    refetch,
  } = useApi(() => api.getDataQuality(), [refreshKey]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const report = await api.exportQualityReport();
      const jsonBlob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data_quality_report.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download quality report: ' + (err?.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  // Missing values as chart data
  const missingValuesList = qualityReport?.missing_values
    ? Object.entries(qualityReport.missing_values).map(([column, count]) => ({
        column,
        count,
      }))
    : [];

  const totalMissing = missingValuesList.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Download Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Dataset Hygiene & Integrity Report</h2>
            <p className="text-xs text-slate-500">
              Automated audit of schema conformance, anomalies, and data health
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || !qualityReport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 shadow-sm transition disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{downloading ? 'Downloading...' : 'Download Quality Report'}</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {loading ? (
        <LoadingSpinner message="Auditing stored records..." />
      ) : !qualityReport ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border">
          No quality metrics available.
        </div>
      ) : (
        <>
          {/* Quality Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Records
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatNumber(qualityReport.total_records)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Stored sales rows</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Missing Values
              </span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  totalMissing > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {formatNumber(totalMissing)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Null or blank cells</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Duplicates
              </span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  qualityReport.duplicate_rows > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {formatNumber(qualityReport.duplicate_rows)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Exact row replicates</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Invalid Dates
              </span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  qualityReport.invalid_dates > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatNumber(qualityReport.invalid_dates)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Unparseable date formats</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Invalid Numerics
              </span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  qualityReport.invalid_numerics > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatNumber(qualityReport.invalid_numerics)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Corrupted number fields</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Negative Profits
              </span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {formatNumber(qualityReport.negative_profits)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Unprofitable transactions</span>
            </div>
          </div>

          {/* Missing Values Chart */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Missing Values by Column
              </h3>
              <p className="text-xs text-slate-500">Distribution of unpopulated column values</p>
            </div>

            {missingValuesList.length === 0 || totalMissing === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero missing values detected across all columns. Dataset is complete!</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={missingValuesList} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="column"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatNumber(Number(val)), 'Missing Count']}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quality Warnings / Notices List */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Data Quality Warnings & Notices</h3>
            </div>

            {qualityReport.warnings.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-600">
                No active data health warnings.
              </div>
            ) : (
              <div className="space-y-2">
                {qualityReport.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900"
                  >
                    <span className="font-semibold">{idx + 1}.</span>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DataQuality;
