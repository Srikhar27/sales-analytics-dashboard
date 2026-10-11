import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Table,
} from 'lucide-react';
import { ColumnMapper, STANDARD_FIELDS } from './ColumnMapper';
import api from '../../services/api';
import { UploadResponse } from '../../types';
import { useFilters } from '../../hooks/useFilters';

interface FileUploadProps {
  onSuccess?: (res: UploadResponse) => void;
  onClose?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onSuccess, onClose }) => {
  const { triggerRefresh } = useFilters();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const parseCsvHeaderAndPreview = (fileObj: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        // Simple comma split handling quotes
        const parseLine = (line: string): string[] => {
          const re = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const matches: string[] = [];
          let match;
          while ((match = re.exec(line)) !== null) {
            let val = match[1];
            if (val && val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1).replace(/""/g, '"');
            }
            if (val !== undefined && val !== null) {
              matches.push(val.trim());
            }
            if (re.lastIndex >= line.length) break;
          }
          return matches;
        };

        const headers = parseLine(lines[0]);
        setCsvHeaders(headers);

        const rows: string[][] = [];
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          rows.push(parseLine(lines[i]));
        }
        setPreviewRows(rows);
      }
    };
    reader.readAsText(fileObj.slice(0, 50000));
  };

  const handleSelectedFile = (selected: File) => {
    setError(null);
    setResult(null);

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB maximum allowed limit.');
      return;
    }

    setFile(selected);
    parseCsvHeaderAndPreview(selected);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    // Invert mapping if user selected standard_field -> csv_header,
    // the backend upload endpoint expects { "CSV Header": "model_field" }
    const backendMapping: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([modelField, csvHeader]) => {
      if (csvHeader) {
        backendMapping[csvHeader] = modelField;
      }
    });

    setUploading(true);
    setError(null);

    try {
      const uploadRes = await api.uploadCSV(file, backendMapping);
      setResult(uploadRes);
      triggerRefresh();
      if (onSuccess) {
        onSuccess(uploadRes);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Upload failed. Please check CSV format.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvHeaders([]);
    setPreviewRows([]);
    setColumnMapping({});
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const missingRequired = STANDARD_FIELDS.filter((f) => f.required && !columnMapping[f.key]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 max-w-3xl w-full mx-auto">
      {/* Modal / Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Sales Dataset</h3>
            <p className="text-xs text-slate-500">Ingest Superstore sales or transactional CSV data</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="mt-4 space-y-4">
        {!file && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragActive
                ? 'border-primary-500 bg-primary-50/50'
                : 'border-slate-300 hover:border-primary-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleSelectedFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Click to browse or drag and drop your CSV file here
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports standard CSV formats up to 50MB</p>
            </div>
          </div>
        )}

        {file && !result && (
          <div className="space-y-4">
            {/* File info badge */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {csvHeaders.length} columns detected
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Change File
              </button>
            </div>

            {/* Column Mapper */}
            {csvHeaders.length > 0 && (
              <ColumnMapper
                csvHeaders={csvHeaders}
                mapping={columnMapping}
                onMappingChange={setColumnMapping}
              />
            )}

            {/* Preview table of first 5 rows */}
            {previewRows.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Table className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preview First {previewRows.length} Rows</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-40">
                  <table className="w-full text-[11px] text-left text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        {csvHeaders.map((h, i) => (
                          <th key={i} className="px-3 py-1.5 border-b border-slate-200 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-1 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success / Result Summary */}
        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Dataset Successfully Ingested!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-emerald-100">
                <span className="text-slate-500 block">Batch ID</span>
                <span className="font-mono font-medium text-slate-800">{result.batch_id}</span>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-100">
                <span className="text-slate-500 block">Processed</span>
                <span className="font-semibold text-slate-800">{result.records_processed}</span>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-100">
                <span className="text-slate-500 block">Inserted</span>
                <span className="font-semibold text-emerald-600">{result.records_inserted}</span>
              </div>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200 space-y-1">
                <span className="font-semibold">Warnings:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {result.warnings.slice(0, 3).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Upload Another File
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {file && !result && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {onClose && (
              <button
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleUploadSubmit}
              disabled={uploading || missingRequired.length > 0}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition ${
                uploading || missingRequired.length > 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing CSV...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Process & Import Data</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
