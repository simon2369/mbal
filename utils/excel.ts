import * as XLSX from 'xlsx';
import { ParsedSheet } from '../types';

export const parseExcelFile = async (file: File): Promise<ParsedSheet[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File is empty");

        const workbook = XLSX.read(data, { type: 'array' });
        const sheets: ParsedSheet[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // Use header:1 to get raw array of arrays first to detect headers, 
          // but sheet_to_json with defval is safer for consistency.
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (jsonData.length > 0) {
            // Extract headers from the first row keys
            const columns = Object.keys(jsonData[0] as object);
            sheets.push({
              name: sheetName,
              data: jsonData,
              columns
            });
          }
        });

        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const exportData = (
  data: any[],
  columns: string[],
  format: 'csv' | 'txt',
  filename: string
) => {
  // Filter data to only include selected columns
  const filteredData = data.map(row => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      newRow[col] = row[col];
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  
  // Generate CSV string
  const output = XLSX.utils.sheet_to_csv(worksheet, { FS: format === 'csv' ? ',' : '\t' });

  // Add BOM for UTF-8 compatibility in Excel
  const bom = '\uFEFF';
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
  const blob = new Blob([bom + output], { type: mimeType });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.${format}`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Clean up the object URL to prevent memory leaks
  URL.revokeObjectURL(url);
};