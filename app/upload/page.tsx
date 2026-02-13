"use client";

import { FileXls, UploadSimple } from "@phosphor-icons/react";
import { useCallback, useState } from "react";

interface UploadResponse {
  diagnostics?: { accountDetailsCount: number; fileId: string; soaDetailsCount: number };
  error?: string;
  hint?: string;
  rowsWritten?: number;
  sheetName?: string;
  success?: boolean;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sheetId, setSheetId] = useState("");
  const [tabName, setTabName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<null | string>(null);

  const uploadFile = useCallback(async () => {
    if (!file || !sheetId) {
      setResult("Please Select A File And Enter Sheet ID");
      return;
    }

    setUploading(true);
    setResult("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheetId", sheetId);
      if (tabName.trim()) {
        formData.append("tabName", tabName.trim());
      }

      const response = await fetch("/api/upload-excel", {
        body: formData,
        method: "POST",
      });

      const data = (await response.json()) as UploadResponse;

      if (response.ok) {
        setResult(
          `Success! Wrote ${String(data.rowsWritten ?? 0)} Rows To Sheet "${data.sheetName ?? "Unknown"}"`,
        );
        setFile(null);
      } else {
        let msg = `Error: ${data.error ?? "Unknown Error"}`;
        if (data.hint) msg += `\n\n${data.hint}`;
        if (data.diagnostics) {
          msg += `\n\nExtracted: fileId=${data.diagnostics.fileId}, accountDetails=${data.diagnostics.accountDetailsCount}, soaDetails=${data.diagnostics.soaDetailsCount}`;
        }
        setResult(msg);
      }
    } catch {
      setResult("Upload Failed - Server Is Broken");
    } finally {
      setUploading(false);
    }
  }, [file, sheetId, tabName]);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-medium mb-8 text-emerald-900">
          Upload Excel to Google Sheets
        </h1>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              Google Sheet ID
            </label>
            <input
              className="w-full px-4 py-2 border border-emerald-900 rounded-lg focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900 font-mono"
              onChange={(e) => {
                setSheetId(e.target.value);
              }}
              placeholder="Paste Your Sheet ID Here"
              type="text"
              value={sheetId}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              Tab Name (Optional)
            </label>
            <input
              className="w-full px-4 py-2 border border-emerald-900 rounded-lg focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900 font-mono"
              onChange={(e) => setTabName(e.target.value)}
              placeholder="Leave empty for first sheet"
              type="text"
              value={tabName}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileXls size={18} />
              Excel File
            </label>
            <input
              accept=".xlsx,.xls"
              className="w-full text-sm text-emerald-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-900 file:text-white hover:file:bg-emerald-950"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
              }}
              type="file"
            />
          </div>

          <button
            className="flex items-center justify-center gap-2 w-full bg-emerald-900 text-white py-3 rounded-lg hover:bg-emerald-950 disabled:bg-emerald-900/50 disabled:text-white/70 disabled:cursor-not-allowed font-medium transition-colors"
            disabled={uploading || !file || !sheetId}
            onClick={() => {
              void uploadFile();
            }}
          >
            <UploadSimple size={20} />
            {uploading ? "Uploading..." : "Upload To Google Sheets"}
          </button>

          {result && (
            <div
              className={`p-4 rounded-lg font-mono whitespace-pre-line ${result.toLowerCase().includes("success") ? "bg-emerald-900/10 text-emerald-900 border border-emerald-900" : "bg-emerald-900/10 text-emerald-900 border border-emerald-900"}`}
            >
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
