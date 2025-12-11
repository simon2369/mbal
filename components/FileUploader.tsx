import React, { useCallback } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect, isProcessing]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
        ${isProcessing ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer bg-white border-gray-300'}
      `}
    >
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        id="file-upload"
        onChange={handleChange}
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          <FileSpreadsheet className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isProcessing ? 'Processing...' : 'Upload Excel File'}
        </h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          Drag and drop your .xlsx or .xls file here, or click to browse.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <UploadCloud className="w-4 h-4 mr-2" />
          Select File
        </div>
      </label>
    </div>
  );
};