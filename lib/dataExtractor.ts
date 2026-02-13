import { getCellByAddress, type ParsedSheet } from './excelParser';

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

/** Sum planted areas from ACC sheet D30, D31, D32... (profileGenerator writes here). Row 29 = Excel row 30, col 3 = D. */
const sumPlantedAreaFromAcc = (accData: unknown[][]): string => {
  let total = 0;
  const startRow = 29;
  const col = 3;
  const maxRows = 30;
  for (let r = startRow; r < startRow + maxRows; r++) {
    const row = accData[r];
    if (!Array.isArray(row)) break;
    const cell = row[col];
    const num = typeof cell === 'number' ? cell : parseFloat(String(cell || '').replace(/,/g, ''));
    if (!Number.isNaN(num) && num > 0) {
      total += num;
    }
  }
  return total > 0 ? formatNumber(String(total)) : '';
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

/** Find row index containing "Sub-total" (principal/penalty totals). */
const findSubtotalRow = (data: unknown[][]): number => {
  for (const [index, rowData] of data.entries()) {
    if (!Array.isArray(rowData)) continue;
    for (const cell of rowData) {
      if (typeof cell === 'string' && cell.toUpperCase().includes('SUB-TOTAL')) {
        return index;
      }
    }
  }
  return -1;
};

/** Sum principal/penalty from SOA IFR rows (col 3, 5) – used when formulas aren't evaluated. */
const sumSoaPrincipalPenaltyFromIfrRows = (
  data: unknown[][],
): { principal: string; penalty: string } => {
  let principalTotal = 0;
  let penaltyTotal = 0;
  for (let r = 94; r <= 98; r++) {
    const row = data[r];
    if (!Array.isArray(row)) continue;
    const p = typeof row[3] === 'number' ? row[3] : parseFloat(String(row[3] || '').replace(/,/g, ''));
    const pen = typeof row[5] === 'number' ? row[5] : parseFloat(String(row[5] || '').replace(/,/g, ''));
    if (!Number.isNaN(p)) principalTotal += p;
    if (!Number.isNaN(pen)) penaltyTotal += pen;
  }
  return {
    penalty: penaltyTotal > 0 ? formatNumber(String(penaltyTotal)) : '',
    principal: principalTotal > 0 ? formatNumber(String(principalTotal)) : '',
  };
};

/**
 * Compute principal and penalty from ACC planted areas × SOA rate/%penalty.
 * SOA formulas often don't evaluate when reading with xlsx, so we calculate:
 * principal_i = area_i × rate_i, penalty_i = principal_i × (pct_i / 100)
 */
const computePrincipalPenaltyFromAccAndSoa = (
  accData: unknown[][],
  soaData: unknown[][],
): { principal: string; penalty: string } => {
  let principalTotal = 0;
  let penaltyTotal = 0;
  const accStartRow = 29;
  const soaIfrStartRow = 94;
  const maxRows = 10;

  for (let i = 0; i < maxRows; i++) {
    const accRow = accData[accStartRow + i];
    const soaRow = soaData[soaIfrStartRow + i];
    if (!Array.isArray(accRow) || !Array.isArray(soaRow)) break;

    const area =
      typeof accRow[3] === 'number' ? accRow[3] : parseFloat(String(accRow[3] || '').replace(/,/g, ''));
    const rate =
      typeof soaRow[2] === 'number' ? soaRow[2] : parseFloat(String(soaRow[2] || '').replace(/,/g, ''));
    const pctPenalty =
      typeof soaRow[4] === 'number' ? soaRow[4] : parseFloat(String(soaRow[4] || '').replace(/,/g, ''));

    if (Number.isNaN(area) || area <= 0 || Number.isNaN(rate)) continue;

    const principal = area * rate;
    const penalty = Number.isNaN(pctPenalty) ? 0 : principal * (pctPenalty / 100);
    principalTotal += principal;
    penaltyTotal += penalty;
  }

  return {
    penalty: penaltyTotal > 0 ? formatNumber(String(penaltyTotal)) : '',
    principal: principalTotal > 0 ? formatNumber(String(principalTotal)) : '',
  };
};

export const extractSOADetails = (
  sheet: ParsedSheet,
  accSheet: ParsedSheet | null,
): SOADetail[] => {
  const details: SOADetail[] = [];
  const { data } = sheet;

  const soaStart = findSOAStart(data);
  if (soaStart === -1) {
    return details;
  }

  const areaFromSoa = getCellValue(data, 12, 6, true);
  const areaFromAcc = accSheet ? sumPlantedAreaFromAcc(accSheet.data) : '';
  const area = areaFromSoa || areaFromAcc;

  const worksheet = sheet.worksheet;

  const ROW_100 = 99;
  let principalFromSubtotal = getCellValue(data, ROW_100, 3, true);
  let penaltyFromSubtotal = getCellValue(data, ROW_100, 5, true);

  if (!principalFromSubtotal || !penaltyFromSubtotal) {
    const p100 = getCellByAddress(worksheet, "D100");
    const pen100 = getCellByAddress(worksheet, "F100");
    if (p100 !== undefined && String(p100).trim() !== "") {
      principalFromSubtotal =
        principalFromSubtotal || formatNumber(String(p100).replace(/,/g, ""));
    }
    if (pen100 !== undefined && String(pen100).trim() !== "") {
      penaltyFromSubtotal =
        penaltyFromSubtotal || formatNumber(String(pen100).replace(/,/g, ""));
    }
  }

  const { principal: principalFromIfr, penalty: penaltyFromIfr } =
    sumSoaPrincipalPenaltyFromIfrRows(data);
  const { principal: principalComputed, penalty: penaltyComputed } = accSheet
    ? computePrincipalPenaltyFromAccAndSoa(accSheet.data, data)
    : { principal: '', penalty: '' };

  const principal =
    principalFromSubtotal || principalFromIfr || principalComputed;
  const penalty = penaltyFromSubtotal || penaltyFromIfr || penaltyComputed;

  if (process.env.NODE_ENV !== "production") {
    const directD100 = worksheet ? getCellByAddress(worksheet, "D100") : undefined;
    const directF100 = worksheet ? getCellByAddress(worksheet, "F100") : undefined;
    const rawPrincipal = (data[ROW_100] as unknown[])?.[3];
    const rawPenalty = (data[ROW_100] as unknown[])?.[5];
    console.log("[dataExtractor] SOA raw:", {
      row100Index: ROW_100,
      directD100,
      directF100,
      rawPrincipal,
      rawPenalty,
      areaFromSoa,
      areaFromAcc,
      area,
      principalFromSubtotal,
      penaltyFromSubtotal,
      principalFromIfr,
      penaltyFromIfr,
      principalComputed,
      penaltyComputed,
      principal,
      penalty,
    });
  }

  const oldAccount = getCellValue(data, 100, 6, true);
  let total = getCellValue(data, 101, 6, true);
  if (!total) {
    const g102 = getCellByAddress(worksheet, "G102");
    if (g102 !== undefined && String(g102).trim() !== "") {
      total = formatNumber(String(g102).replace(/,/g, ""));
    }
  }

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
  const soaSheets = sheets.filter((s) => s.name.includes('01 SOA'));
  const accSheet = sheets.find((s) => s.name.includes('00 ACC DETAILS'));

  let bestSoa: SOADetail[] = [];
  for (const soaSheet of soaSheets) {
    const details = extractSOADetails(soaSheet, accSheet ?? null);
    if (details.length === 0) continue;
    if (details[0].principal && details[0].penalty) {
      bestSoa = details;
      break;
    }
    if (bestSoa.length === 0 || (details[0].principal || details[0].penalty)) {
      bestSoa = details;
    }
  }

  return {
    accountDetails: accSheet ? extractAccountDetails(accSheet) : [],
    fileId: extractFileId(filename),
    soaDetails: bestSoa,
  };
};
