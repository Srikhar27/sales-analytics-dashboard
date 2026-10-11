import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

export const STANDARD_FIELDS: FieldDefinition[] = [
  { key: 'order_id', label: 'Order ID', required: true, aliases: ['order id', 'order_id', 'orderid', 'id'] },
  { key: 'order_date', label: 'Order Date', required: true, aliases: ['order date', 'order_date', 'date'] },
  { key: 'sales', label: 'Sales / Revenue', required: true, aliases: ['sales', 'total revenue', 'revenue', 'amount', 'total'] },
  { key: 'quantity', label: 'Quantity', required: true, aliases: ['quantity', 'units sold', 'qty', 'units', 'count'] },
  { key: 'profit', label: 'Profit', required: true, aliases: ['profit', 'total profit', 'net_profit', 'margin'] },
  { key: 'customer_name', label: 'Customer Name', required: false, aliases: ['customer name', 'customer_name', 'name', 'client'] },
  { key: 'customer_id', label: 'Customer ID', required: false, aliases: ['customer id', 'customer_id', 'client_id'] },
  { key: 'segment', label: 'Segment', required: false, aliases: ['segment', 'customer segment', 'market', 'sales channel'] },
  { key: 'region', label: 'Region', required: false, aliases: ['region', 'territory', 'zone'] },
  { key: 'category', label: 'Category', required: false, aliases: ['category', 'item type', 'product category', 'type'] },
  { key: 'sub_category', label: 'Sub-Category', required: false, aliases: ['sub category', 'sub_category', 'sub-category'] },
  { key: 'product_name', label: 'Product Name', required: false, aliases: ['product name', 'item type', 'product_name', 'item', 'item name'] },
  { key: 'discount', label: 'Discount', required: false, aliases: ['discount', 'discount %', 'disc'] },
];

interface ColumnMapperProps {
  csvHeaders: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  csvHeaders,
  mapping,
  onMappingChange,
}) => {
  // Auto-detect matches on initial load
  useEffect(() => {
    const newMapping: Record<string, string> = { ...mapping };
    STANDARD_FIELDS.forEach((field) => {
      if (!newMapping[field.key]) {
        // Find best match among csvHeaders
        const match = csvHeaders.find((h) => {
          const clean = h.trim().toLowerCase().replace(/[-_ ]+/g, ' ');
          return field.aliases.some((alias) => clean === alias.toLowerCase() || clean.includes(alias.toLowerCase()));
        });
        if (match) {
          newMapping[field.key] = match;
        }
      }
    });
    onMappingChange(newMapping);
  }, [csvHeaders]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldSelect = (modelFieldKey: string, selectedCsvHeader: string) => {
    const updated = { ...mapping };
    if (!selectedCsvHeader) {
      delete updated[modelFieldKey];
    } else {
      updated[modelFieldKey] = selectedCsvHeader;
    }
    onMappingChange(updated);
  };

  const missingRequired = STANDARD_FIELDS.filter((f) => f.required && !mapping[f.key]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Map CSV Columns to System Fields</h4>
          <p className="text-xs text-slate-500">
            Confirm or select corresponding CSV column headers. Required fields must be mapped.
          </p>
        </div>
        <div>
          {missingRequired.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All required fields mapped
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <AlertCircle className="w-3.5 h-3.5" />
              {missingRequired.length} required field(s) unmapped
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
        {STANDARD_FIELDS.map((field) => {
          const selectedValue = mapping[field.key] || '';
          const isMapped = !!selectedValue;

          return (
            <div
              key={field.key}
              className={`p-2.5 rounded-lg border text-xs transition ${
                field.required && !isMapped
                  ? 'border-amber-300 bg-amber-50/40'
                  : isMapped
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-800">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{field.key}</span>
              </div>
              <select
                value={selectedValue}
                onChange={(e) => handleFieldSelect(field.key, e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-primary-500 focus:outline-none"
              >
                <option value="">-- Ignore / Not in CSV --</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ColumnMapper;
