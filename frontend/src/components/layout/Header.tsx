import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  RefreshCw,
  Upload,
  Calendar,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenUploadModal?: () => void;
}

const routeTitles: Record<string, string> = {
  '/': 'Executive Overview',
  '/sales': 'Sales & Revenue Analysis',
  '/products': 'Product & Profitability Analysis',
  '/customers': 'Customer Demographics & Segmentation',
  '/regions': 'Regional Performance Analysis',
  '/explorer': 'Sales Data Explorer',
  '/quality': 'Data Integrity & Quality Report',
  '/reports': 'Executive Reports & Export',
  '/settings': 'System Settings & Data Management',
};

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenUploadModal,
}) => {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'Sales Analytics';

  const {
    filters,
    setDateRange,
    setRegion,
    setCategory,
    resetFilters,
    filterOptions,
    triggerRefresh,
  } = useFilters();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Mobile button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl tracking-tight">{title}</h1>
            <p className="text-xs text-slate-500">Real-time enterprise metrics & decision support</p>
          </div>
        </div>

        {/* Right: Date filter + Region + Category + Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start Date */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setDateRange(e.target.value, filters.end_date)}
              className="bg-transparent text-slate-700 outline-none cursor-pointer"
              title="Start Date"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">to</span>

          {/* End Date */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setDateRange(filters.start_date, e.target.value)}
              className="bg-transparent text-slate-700 outline-none cursor-pointer"
              title="End Date"
            />
          </div>

          {/* Region Dropdown */}
          <div className="relative">
            <select
              value={filters.region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-primary-500 focus:outline-none"
            >
              <option value="">All Regions</option>
              {filterOptions.regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-primary-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(filters.start_date || filters.end_date || filters.region || filters.category) && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            title="Refresh dashboard data"
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
          </button>

          {/* Upload CSV button */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
