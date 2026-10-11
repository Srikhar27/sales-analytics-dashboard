import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';
import FileUpload from '../components/upload/FileUpload';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  Server,
  Trash2,
  Upload,
  Info,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { triggerRefresh, resetFilters } = useFilters();
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [clearError, setClearError] = useState<string | null>(null);

  // Health check
  const {
    data: health,
    loading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useApi(() => api.getHealth(), []);

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete all sales data records from the database? This action cannot be undone.'
    );
    if (!confirmed) return;

    setClearing(true);
    setClearError(null);
    setClearSuccess(null);

    try {
      const res = await api.clearData();
      setClearSuccess(`Data cleared successfully. Deleted ${res.rows_deleted} records.`);
      resetFilters();
      triggerRefresh();
    } catch (err: any) {
      setClearError(
        err?.response?.data?.message || err?.message || 'Failed to clear database records.'
      );
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* API Health & Environment Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Backend Connectivity & Health</h3>
              <p className="text-xs text-slate-500">Live status of FastAPI service</p>
            </div>
          </div>
          <button
            onClick={refetchHealth}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-500">API Status:</span>
            {healthLoading ? (
              <span className="text-xs text-slate-400">Checking...</span>
            ) : health?.status === 'healthy' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Healthy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                <AlertCircle className="w-3.5 h-3.5" />
                Disconnected
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-500">Application:</span>
            <span className="text-xs font-semibold text-slate-800">
              {health?.app || 'Sales Analytics API'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-500">Debug Mode:</span>
            <span className="text-xs font-semibold text-slate-800">
              {health?.debug ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Dataset Ingestion */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary-50 text-primary-600 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ingest New Sales Dataset</h3>
            <p className="text-xs text-slate-500">Upload and map raw CSV records</p>
          </div>
        </div>

        <FileUpload />
      </div>

      {/* Database Maintenance & Clear Data */}
      <div className="bg-white p-6 rounded-xl border border-rose-200/80 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900">Danger Zone: Purge Database</h3>
            <p className="text-xs text-slate-500">
              Wipe all sales records, orders, and historical batch data from storage
            </p>
          </div>
        </div>

        {clearSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{clearSuccess}</span>
          </div>
        )}

        {clearError && <ErrorMessage message={clearError} />}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 max-w-md">
            This permanently drops all rows from the database. You will need to re-upload your CSV dataset.
          </span>
          <button
            onClick={handleClearData}
            disabled={clearing}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{clearing ? 'Clearing...' : 'Purge All Records'}</span>
          </button>
        </div>
      </div>

      {/* App Information */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Application Information</h4>
        </div>
        <div className="space-y-1.5 text-xs text-slate-500">
          <p>
            <strong>Version:</strong> 1.0.0 (Production Release)
          </p>
          <p>
            <strong>Stack:</strong> React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, FastAPI, SQLAlchemy
          </p>
          <p>
            <strong>Proxy:</strong> Local development proxy configured at <code>/api -&gt; http://localhost:8000</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
