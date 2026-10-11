import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500 w-full min-h-[160px]">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 mb-2`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
