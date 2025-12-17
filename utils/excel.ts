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

// Transform date format from "11/04/2025" to "11.04.2025"
const transformDate = (dateStr: string): string => {
  if (!dateStr) return dateStr;
  return String(dateStr).replace(/\//g, '.');
};

// Transform data: split rows with "First In" and "Last Out" into separate rows
const transformDataForExport = (data: any[], columns: string[]): any[] => {
  // Check if we have the pattern: Personnel Code, Date, First In, Last Out
  const hasFirstIn = columns.some(col => 
    col.includes('Първи вътре') || col.includes('First In') || col.toLowerCase().includes('first')
  );
  const hasLastOut = columns.some(col => 
    col.includes('Последно излизане') || col.includes('Last Out') || col.toLowerCase().includes('last')
  );
  const hasPersonnelCode = columns.some(col => 
    col.includes('Кодекс на персонала') || col.includes('Код на персонала') || 
    col.toLowerCase().includes('personnel') || col.toLowerCase().includes('code')
  );
  const hasDate = columns.some(col => 
    col.includes('Дата') || col.toLowerCase().includes('date')
  );

  // If we have the time-split pattern, transform the data
  if (hasFirstIn && hasLastOut && hasPersonnelCode && hasDate) {
    const transformedData: any[] = [];
    
    // Find the actual column names
    const personnelCodeCol = columns.find(col => 
      col.includes('Кодекс на персонала') || col.includes('Код на персонала') || 
      col.toLowerCase().includes('personnel') || col.toLowerCase().includes('code')
    ) || columns[0];
    
    const dateCol = columns.find(col => 
      col.includes('Дата') || col.toLowerCase().includes('date')
    ) || columns[1];
    
    const firstInCol = columns.find(col => 
      col.includes('Първи вътре') || col.includes('First In') || col.toLowerCase().includes('first')
    );
    
    const lastOutCol = columns.find(col => 
      col.includes('Последно излизане') || col.includes('Last Out') || col.toLowerCase().includes('last')
    );

    data.forEach(row => {
      const personnelCode = row[personnelCodeCol] || '';
      const date = transformDate(String(row[dateCol] || ''));
      
      // Create row for First In time
      if (firstInCol && row[firstInCol]) {
        transformedData.push({
          'Код на персонала': personnelCode,
          'Дата': date,
          'време': String(row[firstInCol]).trim()
        });
      }
      
      // Create row for Last Out time
      if (lastOutCol && row[lastOutCol]) {
        transformedData.push({
          'Код на персонала': personnelCode,
          'Дата': date,
          'време': String(row[lastOutCol]).trim()
        });
      }
    });

    return transformedData;
  }

  // Default: filter data to only include selected columns
  return data.map(row => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      // Transform date format if it's a date column
      const value = row[col];
      if (col.includes('Дата') || col.toLowerCase().includes('date')) {
        newRow[col] = transformDate(String(value || ''));
      } else {
        newRow[col] = value;
      }
    });
    return newRow;
  });
};

export const exportData = (
  data: any[],
  columns: string[],
  format: 'csv' | 'txt',
  filename: string
) => {
  // Transform data based on detected pattern
  const transformedData = transformDataForExport(data, columns);

  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  
  // Generate CSV string (use tab separator for both CSV and TXT to match your example)
  const output = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });

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