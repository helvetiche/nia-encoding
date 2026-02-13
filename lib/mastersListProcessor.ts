/**
 * Parses the master's list Excel and groups rows by Lot Code.
 * Maintains order of first appearance (top to bottom).
 *
 * Master's list columns (0-indexed):
 * C(2)=Lot, D(3)=CropSeason, E(4)=CropYear, H(7)=PlantedArea,
 * M(12)=LandOwnerLast, N(13)=LandOwnerFirst, O(14)=FarmerLast, P(15)=FarmerFirst,
 * Q(16)=OldAccount
 */

export interface MastersListRow {
  cropSeason: string;
  cropYear: string;
  farmerFirst: string;
  farmerLast: string;
  landOwnerFirst: string;
  landOwnerLast: string;
  lotCode: string;
  oldAccount: string;
  plantedArea: string;
}

export interface LotGroup {
  lotCode: string;
  landOwnerFirst: string;
  landOwnerLast: string;
  rows: MastersListRow[];
}

const getCellStr = (row: unknown[], colIndex: number): string => {
  if (!Array.isArray(row) || colIndex < 0 || colIndex >= row.length) {
    return "";
  }
  const val = row[colIndex];
  if (val === null || val === undefined) {
    return "";
  }
  return String(val).trim();
};

/** Single "N" is treated as empty (placeholder in master's list) */
const emptyIfN = (s: string): string =>
  s.trim() === "N" ? "" : s.trim();

export const processMastersList = (data: unknown[][]): LotGroup[] => {
  const groups: LotGroup[] = [];
  const lotToGroupIndex = new Map<string, number>();
  const COL_LOT = 2;
  const COL_CROP_SEASON = 3;
  const COL_CROP_YEAR = 4;
  const COL_PLANTED_AREA = 7;
  const COL_LAND_OWNER_LAST = 12;
  const COL_LAND_OWNER_FIRST = 13;
  const COL_FARMER_LAST = 14;
  const COL_FARMER_FIRST = 15;
  const COL_OLD_ACCOUNT = 16;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    const lotCode = getCellStr(row, COL_LOT);
    if (!lotCode) continue;

    const mastersRow: MastersListRow = {
      cropSeason: emptyIfN(getCellStr(row, COL_CROP_SEASON)),
      cropYear: emptyIfN(getCellStr(row, COL_CROP_YEAR)),
      farmerFirst: emptyIfN(getCellStr(row, COL_FARMER_FIRST)),
      farmerLast: emptyIfN(getCellStr(row, COL_FARMER_LAST)),
      landOwnerFirst: emptyIfN(getCellStr(row, COL_LAND_OWNER_FIRST)),
      landOwnerLast: emptyIfN(getCellStr(row, COL_LAND_OWNER_LAST)),
      lotCode,
      oldAccount: emptyIfN(getCellStr(row, COL_OLD_ACCOUNT)),
      plantedArea: emptyIfN(getCellStr(row, COL_PLANTED_AREA)),
    };

    let groupIndex = lotToGroupIndex.get(lotCode);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      lotToGroupIndex.set(lotCode, groupIndex);
      groups.push({
        landOwnerFirst: mastersRow.landOwnerFirst,
        landOwnerLast: mastersRow.landOwnerLast,
        lotCode,
        rows: [],
      });
    }

    groups[groupIndex].rows.push(mastersRow);
  }

  return groups;
};
