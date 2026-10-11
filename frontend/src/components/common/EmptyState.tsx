import React from 'react';
import { Database, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no records matching your selected filter criteria or no dataset has been uploaded yet.',
  icon: Icon = Database,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl my-4 w-full min-h-[200px]">
      <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 mb-3 text-slate-400">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
