import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 my-4 text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
      <p className="font-medium text-sm mb-1">Failed to load data</p>
      <p className="text-xs text-red-600 max-w-md mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
