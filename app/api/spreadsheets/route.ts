import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createSpreadsheet, getSpreadsheets } from "@/lib/firestore";

export async function GET() {
  try {
    const spreadsheets = await getSpreadsheets();

    return NextResponse.json({
      data: spreadsheets,
      success: true,
    });
  } catch (error) {
    console.error("get spreadsheets error:", error);
    return NextResponse.json({ error: "server is broken" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      description: string;
      url: string;
    };

    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: "name and url are required" },
        { status: 400 },
      );
    }

    const id = await createSpreadsheet({
      description: body.description || "",
      name: body.name,
      url: body.url,
    });

    return NextResponse.json({
      id,
      success: true,
    });
  } catch (error) {
    console.error("create spreadsheet error:", error);
    return NextResponse.json({ error: "server is broken" }, { status: 500 });
  }
}
