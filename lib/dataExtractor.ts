import type { ParsedSheet } from './excelParser';

export interface LotOwner {
  firstName: string;
  lastName: string;
  middleName: string;
}

export interface Farmer {
  firstName: string;
  lastName: string;
  middleName: string;
}

export interface AccountDetail {
  farmer: Farmer;
  lotNo: string;
  lotOwner: LotOwner;
}

export interface SOADetail {
  area: string;
  oldAccount: string;
  penalty: string;
  principal: string;
  total: string;
}

export interface ExtractedData {
  accountDetails: AccountDetail[];
  fileId: string;
  soaDetails: SOADetail[];
}

const formatNumber = (value: string): string => {
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) {
    return value;
  }
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

const getCellValue = (data: unknown[][], row: number, col: number, isNumeric = false): string => {
  if (row >= data.length || row < 0) {
    return '';
  }
  const rowData = data[row];
  if (!Array.isArray(rowData) || col >= rowData.length || col < 0) {
    return '';
  }
  const cell = rowData[col];
  const value = typeof cell === 'string' || typeof cell === 'number' ? String(cell).trim() : '';
  
  if (isNumeric && value) {
    return formatNumber(value);
  }
  
  return value;
};

const findAccountDetailsStart = (data: unknown[][]): number => {
  for (const [index, rowData] of data.entries()) {
    if (!Array.isArray(rowData)) {
      continue;
    }
    for (const cell of rowData) {
      if (typeof cell === 'string' && cell.toUpperCase().includes('ACCOUNT DETAILS')) {
        return index;
      }
    }
  }
  return -1;
};

export const extractAccountDetails = (sheet: ParsedSheet): AccountDetail[] => {
  const details: AccountDetail[] = [];
  const { data } = sheet;

  const headerRow = findAccountDetailsStart(data);
  if (headerRow === -1) {
    return details;
  }

  const lotNo = getCellValue(data, headerRow + 1, 2);
  
  if (!lotNo || lotNo === '') {
    return details;
  }

  const ownerFirstName = getCellValue(data, headerRow + 5, 2);
  const ownerMiddleName = getCellValue(data, headerRow + 6, 2);
  const ownerSurname = getCellValue(data, headerRow + 7, 2);

  const farmerFirstName = getCellValue(data, headerRow + 9, 2);
  const farmerMiddleName = getCellValue(data, headerRow + 10, 2);
  const farmerSurname = getCellValue(data, headerRow + 11, 2);

  if (ownerFirstName || ownerMiddleName || ownerSurname || farmerFirstName || farmerMiddleName || farmerSurname) {
    details.push({
      farmer: {
        firstName: farmerFirstName,
        lastName: farmerSurname,
        middleName: farmerMiddleName,
      },
      lotNo,
      lotOwner: {
        firstName: ownerFirstName,
        lastName: ownerSurname,
        middleName: ownerMiddleName,
      },
    });
  }

  return details;
};

const findSOAStart = (data: unknown[][]): number => {
  for (const [index, rowData] of data.entries()) {
    if (!Array.isArray(rowData)) {
      continue;
    }
    for (const cell of rowData) {
      if (typeof cell === 'string' && cell.toUpperCase().includes('STATEMENT OF ACCOUNT')) {
        return index;
      }
    }
  }
  return -1;
};

export const extractSOADetails = (sheet: ParsedSheet): SOADetail[] => {
  const details: SOADetail[] = [];
  const { data } = sheet;

  const soaStart = findSOAStart(data);
  if (soaStart === -1) {
    return details;
  }

  const area = getCellValue(data, 12, 6, true);
  const principal = getCellValue(data, 99, 3, true);
  const penalty = getCellValue(data, 99, 5, true);
  const oldAccount = getCellValue(data, 100, 6, true);
  const total = getCellValue(data, 101, 6, true);

  if (area || principal || penalty || oldAccount || total) {
    details.push({
      area,
      oldAccount,
      penalty,
      principal,
      total,
    });
  }

  return details;
};

const extractFileId = (filename: string): string => {
  const regex = /^(\d+)\s/;
  const match = regex.exec(filename);
  if (!match) {
    return '';
  }
  return String(parseInt(match[1], 10));
};

export const extractData = (sheets: ParsedSheet[], filename = ''): ExtractedData => {
  const soaSheet = sheets.find((s) => s.name.includes('01 SOA'));
  const accSheet = sheets.find((s) => s.name.includes('00 ACC DETAILS'));

  return {
    accountDetails: accSheet ? extractAccountDetails(accSheet) : [],
    fileId: extractFileId(filename),
    soaDetails: soaSheet ? extractSOADetails(soaSheet) : [],
  };
};
