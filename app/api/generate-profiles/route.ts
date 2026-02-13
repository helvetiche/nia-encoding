import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import JSZip from "jszip";

import { parseExcelFile } from "@/lib/excelParser";
import { processMastersList } from "@/lib/mastersListProcessor";
import { generateProfileBuffer } from "@/lib/profileGenerator";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No master's list file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedSheets = parseExcelFile(buffer);

    if (parsedSheets.length === 0) {
      return NextResponse.json(
        { error: "No data found in Excel file" },
        { status: 400 }
      );
    }

    const firstSheet = parsedSheets[0];
    const data = firstSheet.data as unknown[][];
    const lotGroups = processMastersList(data);

    if (lotGroups.length === 0) {
      return NextResponse.json(
        { error: "No lot records found in master's list" },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    for (let i = 0; i < lotGroups.length; i++) {
      const { buffer: profileBuffer, filename } = await generateProfileBuffer(
        lotGroups[i],
        i + 1
      );
      zip.file(filename, profileBuffer);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="farmer-profiles.zip"`,
      },
    });
  } catch (error) {
    console.error("generate-profiles error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err?.message ?? "Failed to generate profiles" },
      { status: 500 }
    );
  }
}
