import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { extractData } from '@/lib/dataExtractor';
import { parseExcelFile } from '@/lib/excelParser';
import { readFromSheet, writeToSheet } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sheetId = formData.get('sheetId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'no file uploaded' },
        { status: 400 }
      );
    }

    if (!sheetId) {
      return NextResponse.json(
        { error: 'sheet id missing' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedSheets = parseExcelFile(buffer);

    if (parsedSheets.length === 0) {
      return NextResponse.json(
        { error: 'no data found in excel' },
        { status: 400 }
      );
    }

    const extracted = extractData(parsedSheets, file.name);
    
    if (!extracted.fileId) {
      return NextResponse.json(
        { error: 'could not extract file id from filename' },
        { status: 400 }
      );
    }

    const existingData = await readFromSheet(sheetId, 'A:A') as string[][];
    let targetRow = -1;
    
    for (const [index, row] of existingData.entries()) {
      const cellValue = row[0];
      if (cellValue) {
        const valueStr = typeof cellValue === 'number' ? String(cellValue) : cellValue;
        const normalizedValue = String(parseInt(valueStr, 10));
        if (normalizedValue === extracted.fileId) {
          targetRow = index + 1;
          break;
        }
      }
    }

    if (targetRow === -1) {
      return NextResponse.json(
        { error: `no row found for file id ${extracted.fileId}` },
        { status: 404 }
      );
    }

    const updates: { range: string; values: unknown[][] }[] = [];

    if (extracted.accountDetails.length > 0) {
      const detail = extracted.accountDetails[0];
      const rowData = [
        detail.lotNo,
        detail.lotOwner.lastName,
        detail.lotOwner.firstName,
        '',
        detail.farmer.lastName,
        detail.farmer.firstName,
      ];

      console.log('Account detail object:', detail);
      console.log('Row data array:', rowData);
      console.log('Writing to range:', `B${String(targetRow)}:G${String(targetRow)}`);

      updates.push({
        range: `B${String(targetRow)}:G${String(targetRow)}`,
        values: [rowData],
      });
    }

    if (extracted.soaDetails.length > 0) {
      const detail = extracted.soaDetails[0];

      const soaData = [
        detail.area,
        detail.principal,
        detail.penalty,
        detail.oldAccount,
        detail.total,
      ];

      updates.push({
        range: `I${String(targetRow)}:M${String(targetRow)}`,
        values: [soaData],
      });
    }

    for (const update of updates) {
      console.log('Executing write:', update);
      const result = await writeToSheet(sheetId, update.range, update.values);
      console.log('Write result:', result);
    }

    return NextResponse.json({
      rowsWritten: updates.length,
      success: true,
    });
  } catch (error) {
    console.error('upload error:', error);
    return NextResponse.json(
      { error: 'server is broken' },
      { status: 500 }
    );
  }
}
