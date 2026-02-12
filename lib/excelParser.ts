import * as XLSX from 'xlsx';

export interface ParsedSheet {
  data: unknown[][];
  name: string;
}

export const parseExcelFile = (buffer: Buffer): ParsedSheet[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  const sheets: ParsedSheet[] = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    return {
      data: data as unknown[][],
      name: sheetName,
    };
  });

  return sheets;
};
