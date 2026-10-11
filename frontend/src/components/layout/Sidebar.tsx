import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  MapPin,
  Table,
  ShieldCheck,
  FileDown,
  Settings,
  BarChart3,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Sales Analysis', to: '/sales', icon: TrendingUp },
  { name: 'Product Analysis', to: '/products', icon: Package },
  { name: 'Customer Analysis', to: '/customers', icon: Users },
  { name: 'Regional Analysis', to: '/regions', icon: MapPin },
  { name: 'Data Explorer', to: '/explorer', icon: Table },
  { name: 'Data Quality', to: '/quality', icon: ShieldCheck },
  { name: 'Reports & Export', to: '/reports', icon: FileDown },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-md">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">Sales Analytics</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Enterprise Pro</span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Analytics & Operations
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  end={item.to === '/'}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">Analytics Director</p>
              <p className="truncate text-[11px] text-slate-400">admin@company.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
