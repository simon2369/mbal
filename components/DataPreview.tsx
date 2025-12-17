import React, { useState, useEffect } from 'react';
import { ParsedSheet, ExportFormat } from '../types';
import { Check, FileText, Download, AlertCircle } from 'lucide-react';
import { exportData } from '../utils/excel';

interface DataPreviewProps {
  sheet: ParsedSheet;
  fileName: string;
  onReset: () => void;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ sheet, fileName, onReset }) => {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.CSV);

  // Initialize with all columns selected
  useEffect(() => {
    setSelectedColumns(new Set(sheet.columns));
  }, [sheet]);

  const toggleColumn = (col: string) => {
    const newSet = new Set(selectedColumns);
    if (newSet.has(col)) {
      newSet.delete(col);
    } else {
      newSet.add(col);
    }
    setSelectedColumns(newSet);
  };

  const handleExport = () => {
    if (selectedColumns.size === 0) return;
    exportData(
      sheet.data,
      Array.from(selectedColumns),
      exportFormat,
      fileName.replace(/\.[^/.]+$/, "")
    );
  };

  const selectedCount = selectedColumns.size;
  const isReady = selectedCount > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-indigo-600" />
            Preview & Select
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            File: <span className="font-medium text-gray-700">{fileName}</span> • {sheet.data.length} rows found
          </p>
        </div>
        <button 
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-red-600 underline"
        >
          Choose different file
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Column Selection */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Columns</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${isReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {selectedCount} Selected
              </span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {sheet.columns.map((col) => {
                const isSelected = selectedColumns.has(col);
                return (
                  <label
                    key={col}
                    className={`
                      flex items-center p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'}
                    `}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => toggleColumn(col)}
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium truncate select-none">{col}</span>
                  </label>
                );
              })}
            </div>
             {!isReady && (
                <div className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please select at least one column to export.
                </div>
              )}
          </div>

          {/* Export Controls */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Export Settings</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setExportFormat(ExportFormat.CSV)}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all
                  ${exportFormat === ExportFormat.CSV
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'}
                `}
              >
                CSV
              </button>
              <button
                onClick={() => setExportFormat(ExportFormat.TXT)}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all
                  ${exportFormat === ExportFormat.TXT
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'}
                `}
              >
                Text
              </button>
            </div>

            <button
              onClick={handleExport}
              disabled={!isReady}
              className={`
                w-full flex items-center justify-center gap-2 p-3 rounded-lg text-white font-medium transition-all shadow-md
                ${isReady 
                  ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg' 
                  : 'bg-gray-300 cursor-not-allowed'}
              `}
            >
              <Download className="w-4 h-4" />
              Download {exportFormat.toUpperCase()}
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">
              Exported as UTF-8 with BOM
            </p>
          </div>
        </div>

        {/* Right Column: Table Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Data Preview (First 20 rows)</h3>
            </div>
            <div className="overflow-auto flex-grow max-h-[600px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {sheet.columns.map((col) => (
                      <th 
                        key={col} 
                        className={`
                          p-3 font-semibold text-xs uppercase tracking-wider border-b border-gray-200 whitespace-nowrap
                          ${selectedColumns.has(col) ? 'text-indigo-700 bg-indigo-50/50' : 'text-gray-500'}
                        `}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sheet.data.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      {sheet.columns.map((col) => (
                        <td 
                          key={`${idx}-${col}`} 
                          className={`
                            p-3 whitespace-nowrap text-gray-600 max-w-[200px] overflow-hidden text-ellipsis
                            ${selectedColumns.has(col) ? 'bg-indigo-50/10 font-medium text-gray-900' : ''}
                          `}
                        >
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.data.length === 0 && (
                 <div className="p-10 text-center text-gray-400">
                    No data found in this sheet.
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
