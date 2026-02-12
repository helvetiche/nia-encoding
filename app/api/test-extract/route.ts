import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { extractData } from '@/lib/dataExtractor';
import { parseExcelFile } from '@/lib/excelParser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'no file uploaded' },
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

    const extractedData = extractData(parsedSheets, file.name);

    return NextResponse.json({
      data: extractedData,
      success: true,
    });
  } catch (error) {
    console.error('extract error:', error);
    return NextResponse.json(
      { error: 'server is broken' },
      { status: 500 }
    );
  }
}
