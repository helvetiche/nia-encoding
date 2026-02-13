"use client";

import { FileXls, DownloadSimple, X } from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";

interface GenerateProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateProfilesModal({
  isOpen,
  onClose,
}: GenerateProfilesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!file) {
      setResult("Please Select A Master's List File");
      return;
    }

    setGenerating(true);
    setResult("Generating profiles...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/generate-profiles", {
        body: formData,
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setResult(`Error: ${data.error ?? "Unknown Error"}`);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "farmer-profiles.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setResult("Success! Your profiles zip has been downloaded.");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setResult("Generate Failed - Server Is Broken");
    } finally {
      setGenerating(false);
    }
  }, [file]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFile(e.target.files?.[0] ?? null);
      setResult(null);
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-h-[90vh] overflow-y-auto max-w-lg bg-white rounded-lg border border-emerald-900"
        role="document"
      >
        <div className="flex items-center justify-between p-4 border-b border-emerald-900">
          <h2 className="text-xl font-medium text-emerald-900">
            Generate Farmer Profiles
          </h2>
          <button
            aria-label="Close modal"
            className="p-2 text-emerald-900 hover:bg-emerald-900/10 rounded-lg transition-colors"
            onClick={onClose}
            type="button"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-emerald-800/80 text-sm">
            Upload the master&apos;s list and download profiles based on the
            template.
          </p>

          <div>
            <label
              className="flex items-center gap-2 text-sm font-medium mb-2 text-emerald-900"
              htmlFor="masters-file-modal"
            >
              <FileXls size={18} />
              Master&apos;s List (Excel)
            </label>
            <input
              ref={fileInputRef}
              accept=".xlsx,.xls"
              className="w-full text-sm text-emerald-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-900 file:text-white hover:file:bg-emerald-950"
              id="masters-file-modal"
              onChange={handleFileChange}
              type="file"
            />
          </div>

          <button
            aria-label="Generate farmer profiles from master's list"
            className="flex items-center justify-center gap-2 w-full bg-emerald-900 text-white py-3 rounded-lg hover:bg-emerald-950 disabled:bg-emerald-900/50 disabled:text-white/70 disabled:cursor-not-allowed font-medium transition-colors"
            disabled={generating || !file}
            onClick={() => {
              void handleGenerate();
            }}
          >
            <DownloadSimple size={20} />
            {generating ? "Generating..." : "Generate Profiles"}
          </button>

          {result && (
            <div
              className={`p-4 rounded-lg font-mono text-sm border border-emerald-900 bg-emerald-900/10 text-emerald-900`}
            >
              {result}
            </div>
          )}

          <div className="border border-emerald-900/20 rounded-lg p-4 text-sm text-emerald-900/90">
            <h3 className="font-medium mb-2">Output Format</h3>
            <p className="mb-2">
              Each file:{" "}
              <span className="font-mono bg-emerald-900/10 px-1 rounded">
                [Queue] [Lot Code] [Name]
              </span>
            </p>
            <p className="font-mono text-xs">
              01 3170-1 Mendoza, Dominga VDA
              <br />
              02 3170-2 Bustamante, Encarnacion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
