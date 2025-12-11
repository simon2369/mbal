import React, { useState } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { analyzeSpreadsheet } from '../services/gemini';
import { ParsedSheet } from '../types';

interface SmartAnalysisProps {
  sheet: ParsedSheet;
  onApplySuggestions: (columns: string[]) => void;
}

export const SmartAnalysis: React.FC<SmartAnalysisProps> = ({ sheet, onApplySuggestions }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSpreadsheet(sheet.columns, sheet.data);
      setSummary(result.summary);
      if (result.suggestedColumns.length > 0) {
        // Filter out columns that don't exist in the current sheet to be safe
        const validColumns = result.suggestedColumns.filter(c => sheet.columns.includes(c));
        onApplySuggestions(validColumns);
      }
    } catch (err: any) {
      setError("AI analysis failed. Please check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Unsure which columns to pick? Let Gemini analyze your data and select the 5 most relevant columns for you.
      </p>

      {summary && (
         <div className="bg-white/80 p-3 rounded-md mb-4 border border-indigo-100 text-sm text-gray-700 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p>{summary}</p>
         </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-md hover:bg-purple-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Auto-Select Best 5 Columns
          </>
        )}
      </button>
    </div>
  );
};