export const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatNumber = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-US').format(val);
};

export const formatPercent = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};
