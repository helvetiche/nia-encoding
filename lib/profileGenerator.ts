/**
 * Generates farmer profile XLSX files from local template.
 * Uses xlsx-populate to preserve structure and avoid corruption.
 */

import fs from "node:fs";
import path from "node:path";

import XlsxPopulate from "xlsx-populate";

import type { LotGroup } from "./mastersListProcessor";

const TEMPLATE_CANDIDATES = [
  path.join(process.cwd(), "data", "template.xlsx"),
  path.join(process.cwd(), "public", "template.xlsx"),
];

const getTemplatePath = (): string => {
  for (const p of TEMPLATE_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Template not found. Tried: ${TEMPLATE_CANDIDATES.join(", ")}`
  );
};

const ACC_SHEET = "00 ACC DETAILS 01";
const SOA_SHEET = "01 SOA 01";

const formatQueueNumber = (n: number): string => String(n).padStart(2, "0");

const isValidName = (s: string): boolean =>
  !!s && s.trim() !== "" && s.trim() !== "N";

const formatFilename = (
  queue: number,
  lotCode: string,
  landOwnerLast: string,
  landOwnerFirst: string,
  farmerLast: string,
  farmerFirst: string
): string => {
  const ownerParts = [landOwnerLast, landOwnerFirst].filter(isValidName);
  const tillerParts = [farmerLast, farmerFirst].filter(isValidName);
  const nameToUse =
    ownerParts.length > 0 ? ownerParts.join(", ") : tillerParts.join(", ");
  const base = `${formatQueueNumber(queue)} ${lotCode}`.trim();
  return nameToUse ? `${base} ${nameToUse}.xlsx` : `${base}.xlsx`;
};

const emptyIfN = (v: string | number): string | number =>
  (typeof v === "string" && v.trim() === "N" ? "" : v);

const setCell = (
  workbook: { sheet: (n: string) => { cell: (r: string) => { value: (v: string | number) => unknown } } },
  sheetName: string,
  ref: string,
  value: string | number
): void => {
  const cleaned = emptyIfN(value);
  const cell = workbook.sheet(sheetName).cell(ref);
  if (typeof cleaned === "number" || (String(cleaned) !== "" && !Number.isNaN(Number(cleaned)))) {
    cell.value(typeof cleaned === "number" ? cleaned : Number(cleaned));
  } else {
    cell.value(String(cleaned));
  }
};

export const generateProfileBuffer = async (
  lotGroup: LotGroup,
  queueNumber: number
): Promise<{ buffer: Buffer; filename: string }> => {
  const templatePath = getTemplatePath();

  const workbook = await XlsxPopulate.fromFileAsync(templatePath);

  const lotCode = lotGroup.lotCode;
  const landOwnerLast = lotGroup.landOwnerLast;
  const landOwnerFirst = lotGroup.landOwnerFirst;
  const farmerFirst = lotGroup.rows[0]?.farmerFirst ?? "";
  const farmerLast = lotGroup.rows[0]?.farmerLast ?? "";
  const oldAccount = lotGroup.rows[0]?.oldAccount ?? "";

  setCell(workbook, ACC_SHEET, "C3", lotCode);
  setCell(workbook, ACC_SHEET, "C7", landOwnerFirst);
  setCell(workbook, ACC_SHEET, "C9", landOwnerLast);
  setCell(workbook, ACC_SHEET, "C11", farmerFirst);
  setCell(workbook, ACC_SHEET, "C13", farmerLast);

  const ifrRows = lotGroup.rows;
  for (let i = 0; i < ifrRows.length; i++) {
    const row = ifrRows[i];
    const rowNum = 30 + i;
    setCell(workbook, ACC_SHEET, `B${rowNum}`, row.cropSeason);
    setCell(workbook, ACC_SHEET, `C${rowNum}`, row.cropYear);
    setCell(workbook, ACC_SHEET, `D${rowNum}`, row.plantedArea);
  }

  setCell(workbook, SOA_SHEET, "G101", oldAccount);

  const output = await workbook.outputAsync();
  const buffer = Buffer.isBuffer(output) ? output : Buffer.from(output as ArrayBuffer);
  const filename = formatFilename(
    queueNumber,
    lotCode,
    landOwnerLast,
    landOwnerFirst,
    farmerLast,
    farmerFirst
  );
  return { buffer, filename };
};
