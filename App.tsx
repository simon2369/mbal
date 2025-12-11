import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { DataPreview } from './components/DataPreview';
import { parseExcelFile } from './utils/excel';
import { ParsedSheet } from './types';
import { ArrowRight, Layout, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [parsedSheet, setParsedSheet] = useState<ParsedSheet | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      setFileName(file.name);
      const sheets = await parseExcelFile(file);
      
      if (sheets.length === 0) {
        throw new Error("No readable sheets found in the file.");
      }

      // Default to the first sheet
      setParsedSheet(sheets[0]);
      setCurrentStep(2);
    } catch (err: any) {
      console.error(err);
      setError("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setParsedSheet(null);
    setFileName('');
    setCurrentStep(1);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Excel5 Converter
            </h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Secure • Client-side processing • UTF-8 Ready
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700 animate-fade-in">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-sm hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-10 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors
              ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}
            `}>
              1
            </div>
            <div className={`text-sm font-medium ${currentStep >= 1 ? 'text-indigo-900' : 'text-gray-400'}`}>Upload</div>
            
            <ArrowRight className="w-5 h-5 text-gray-300 mx-2" />
            
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors
              ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}
            `}>
              2
            </div>
            <div className={`text-sm font-medium ${currentStep >= 2 ? 'text-indigo-900' : 'text-gray-400'}`}>Select & Export</div>
          </div>
        </div>

        {/* View Switch */}
        <div className="transition-all duration-300 ease-in-out">
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
                <FileUploader 
                  onFileSelect={handleFileSelect} 
                  isProcessing={isProcessing}
                />
              </div>
              <p className="text-center text-gray-400 text-sm mt-8">
                Supported formats: .xlsx, .xls
              </p>
            </div>
          )}

          {currentStep === 2 && parsedSheet && (
            <DataPreview 
              sheet={parsedSheet} 
              fileName={fileName}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}