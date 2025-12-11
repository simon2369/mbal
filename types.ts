export interface ParsedSheet {
  name: string;
  data: any[];
  columns: string[];
}

export enum ExportFormat {
  CSV = 'csv',
  TXT = 'txt'
}
