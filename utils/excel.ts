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

// Check if a value looks like a time (HH:MM or H:MM format)
const isTimeValue = (value: any): boolean => {
  const str = String(value || '').trim();
  // Match patterns like 7:40, 16:23, 09:01, 13:32
  return /^\d{1,2}:\d{2}$/.test(str);
};

// Check if a value looks like a date
const isDateValue = (value: any): boolean => {
  const str = String(value || '').trim();
  // Match patterns like 12/9/2025, 11/04/2025, etc.
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str) || /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str);
};

// Transform data: split rows with two time columns into separate rows
const transformDataForExport = (data: any[], columns: string[]): any[] => {
  if (data.length === 0 || columns.length === 0) return data;

  // Detect columns by content pattern
  const timeColumns: string[] = [];
  const dateColumns: string[] = [];
  const idColumns: string[] = [];

  // Sample first few rows to detect column types
  const sampleSize = Math.min(5, data.length);
  
  columns.forEach(col => {
    let timeCount = 0;
    let dateCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i]?.[col];
      if (isTimeValue(value)) timeCount++;
      if (isDateValue(value)) dateCount++;
    }
    
    // If most samples are times, it's a time column
    if (timeCount >= sampleSize * 0.6) {
      timeColumns.push(col);
    }
    // If most samples are dates, it's a date column
    else if (dateCount >= sampleSize * 0.6) {
      dateColumns.push(col);
    }
    // Otherwise, treat as ID/code column
    else if (value !== undefined && value !== null && value !== '') {
      idColumns.push(col);
    }
  });

  // Check for pattern: at least 1 date column, exactly 2 time columns, and at least 1 ID column
  // OR check by column name patterns (for backward compatibility)
  const hasFirstInByName = columns.some(col => 
    col.includes('Първи вътре') || col.includes('First In') || col.toLowerCase().includes('first')
  );
  const hasLastOutByName = columns.some(col => 
    col.includes('Последно излизане') || col.includes('Last Out') || col.toLowerCase().includes('last')
  );
  const hasPersonnelCodeByName = columns.some(col => 
    col.includes('Кодекс на персонала') || col.includes('Код на персонала') || 
    col.toLowerCase().includes('personnel') || col.toLowerCase().includes('code')
  );
  const hasDateByName = columns.some(col => 
    col.includes('Дата') || col.toLowerCase().includes('date')
  );

  const shouldTransform = 
    (timeColumns.length === 2 && dateColumns.length >= 1 && idColumns.length >= 1) ||
    (hasFirstInByName && hasLastOutByName && hasPersonnelCodeByName && hasDateByName);

  if (shouldTransform) {
    const transformedData: any[] = [];
    
    // Determine column roles
    let dateCol: string;
    let firstTimeCol: string;
    let secondTimeCol: string;
    let idCol: string;

    if (hasDateByName && hasFirstInByName && hasLastOutByName && hasPersonnelCodeByName) {
      // Use name-based detection (backward compatibility)
      dateCol = columns.find(col => 
        col.includes('Дата') || col.toLowerCase().includes('date')
      ) || dateColumns[0] || columns[0];
      
      firstTimeCol = columns.find(col => 
        col.includes('Първи вътре') || col.includes('First In') || col.toLowerCase().includes('first')
      ) || timeColumns[0];
      
      secondTimeCol = columns.find(col => 
        col.includes('Последно излизане') || col.includes('Last Out') || col.toLowerCase().includes('last')
      ) || timeColumns[1];
      
      idCol = columns.find(col => 
        col.includes('Кодекс на персонала') || col.includes('Код на персонала') || 
        col.toLowerCase().includes('personnel') || col.toLowerCase().includes('code')
      ) || idColumns[0] || columns.find(col => !timeColumns.includes(col) && !dateColumns.includes(col)) || columns[0];
    } else {
      // Use content-based detection
      dateCol = dateColumns[0] || columns.find(col => col.toLowerCase().includes('date')) || columns[0];
      firstTimeCol = timeColumns[0] || '';
      secondTimeCol = timeColumns[1] || '';
      idCol = idColumns[0] || columns.find(col => !timeColumns.includes(col) && !dateColumns.includes(col)) || columns[0];
    }

    data.forEach(row => {
      const id = String(row[idCol] || '').trim();
      const date = transformDate(String(row[dateCol] || ''));
      
      // Create row for first time
      if (firstTimeCol && row[firstTimeCol] && String(row[firstTimeCol]).trim()) {
        transformedData.push({
          'Код на персонала': id,
          'Дата': date,
          'време': String(row[firstTimeCol]).trim()
        });
      }
      
      // Create row for second time
      if (secondTimeCol && row[secondTimeCol] && String(row[secondTimeCol]).trim()) {
        transformedData.push({
          'Код на персонала': id,
          'Дата': date,
          'време': String(row[secondTimeCol]).trim()
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