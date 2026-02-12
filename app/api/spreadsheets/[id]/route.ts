import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { deleteSpreadsheet, getSpreadsheet, updateSpreadsheet } from '@/lib/firestore';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const spreadsheet = await getSpreadsheet(id);
    
    if (!spreadsheet) {
      return NextResponse.json(
        { error: 'spreadsheet not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      data: spreadsheet,
      success: true,
    });
  } catch (error) {
    console.error('get spreadsheet error:', error);
    return NextResponse.json(
      { error: 'server is broken' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { name?: string; description?: string; url?: string };
    
    await updateSpreadsheet(id, body);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('update spreadsheet error:', error);
    return NextResponse.json(
      { error: 'server is broken' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSpreadsheet(id);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('delete spreadsheet error:', error);
    return NextResponse.json(
      { error: 'server is broken' },
      { status: 500 }
    );
  }
}
