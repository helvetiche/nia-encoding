'use client';

import { CheckCircle, FileXls, Plus, Syringe, Trash, Warning, XCircle } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useConsole, type Spreadsheet } from '../context/ConsoleContext';
import Modal from '../components/Modal';

const extractSheetIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const sortFilesByName = (files: File[]): File[] => {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
};

export default function SpreadsheetManager() {
  const { spreadsheets, refreshSpreadsheets, registerOpenAddSpreadsheet, registerSpreadsheetActions } = useConsole();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ description: '', name: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [injectSheet, setInjectSheet] = useState<Spreadsheet | null>(null);
  const [injectFiles, setInjectFiles] = useState<File[]>([]);
  const [injecting, setInjecting] = useState(false);
  const [injectProgress, setInjectProgress] = useState(0);
  const [injectResult, setInjectResult] = useState<null | string>(null);
  const [currentInjectFile, setCurrentInjectFile] = useState<string | null>(null);
  const [injectEtaSeconds, setInjectEtaSeconds] = useState<number | null>(null);
  const [rateLimitedFiles, setRateLimitedFiles] = useState<File[]>([]);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStats, setCompletionStats] = useState<{ success: number; failed: number; skipped: number } | null>(null);
  const [showInjectSelectModal, setShowInjectSelectModal] = useState(false);
  const [showInjectFileModal, setShowInjectFileModal] = useState(false);

  const serviceAccountEmail = process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL ?? '';

  const saveSpreadsheet = useCallback(async () => {
    if (!formData.name || !formData.url) {
      return;
    }

    setSubmitting(true);

    try {
      const url = editingId ? `/api/spreadsheets/${editingId}` : '/api/spreadsheets';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
        method,
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ name: '', description: '', url: '' });
        setEditingId(null);
        await refreshSpreadsheets();
      }
    } catch {
      console.error('failed to save spreadsheet');
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingId, refreshSpreadsheets]);

  const deleteSheet = useCallback(async (id: string) => {
    if (!confirm('Delete This Spreadsheet?')) {
      return;
    }

    try {
      const response = await fetch(`/api/spreadsheets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refreshSpreadsheets();
      }
    } catch {
      console.error('failed to delete spreadsheet');
    }
  }, [refreshSpreadsheets]);

  const openAddForm = useCallback(() => {
    setShowForm(true);
    setEditingId(null);
    setFormData({ name: '', description: '', url: '' });
  }, []);

  const editSheet = useCallback((sheet: Spreadsheet) => {
    setFormData({ description: sheet.description, name: sheet.name, url: sheet.url });
    setEditingId(sheet.id);
    setShowForm(true);
  }, []);

  useEffect(() => {
    registerOpenAddSpreadsheet(openAddForm);
  }, [registerOpenAddSpreadsheet, openAddForm]);

  const openInjectModal = useCallback((sheet: Spreadsheet) => {
    setInjectSheet(sheet);
    setInjectFiles([]);
    setInjectProgress(0);
    setInjectResult(null);
    setRateLimitedFiles([]);
    setRetryCountdown(null);
    setShowInjectFileModal(true);
  }, []);

  useEffect(() => {
    registerSpreadsheetActions({
      onInject: openInjectModal,
      onEdit: editSheet,
      onDelete: deleteSheet,
    });
  }, [registerSpreadsheetActions, openInjectModal, editSheet, deleteSheet]);

  const handleInjectFileClick = useCallback(() => {
    setShowInjectSelectModal(true);
  }, []);

  const handleSelectSpreadsheetForInject = useCallback((sheet: Spreadsheet) => {
    setShowInjectSelectModal(false);
    openInjectModal(sheet);
  }, [openInjectModal]);

  const handleCreateFromInjectModal = useCallback(() => {
    setShowInjectSelectModal(false);
    openAddForm();
  }, [openAddForm]);

  const closeInjectModal = useCallback(() => {
    setInjectSheet(null);
    setInjectFiles([]);
    setInjectProgress(0);
    setInjectResult(null);
    setShowInjectFileModal(false);
  }, []);

  const handleInjectFilesSelected = useCallback((files: File[], append = false) => {
    setInjectFiles((prev) => {
      const next = append ? [...prev, ...files] : files;
      return sortFilesByName(next);
    });
    setInjectResult(null);
    if (!append) setShowInjectFileModal(false);
  }, []);

  const injectExcel = useCallback(async (filesToInject?: File[], isRetry = false) => {
    const files = filesToInject ?? injectFiles;
    if (!injectSheet || files.length === 0) {
      return;
    }

    const sheetId = extractSheetIdFromUrl(injectSheet.url);
    if (!sheetId) {
      setInjectResult('Invalid Spreadsheet URL');
      return;
    }

    setInjecting(true);
    setInjectResult(isRetry ? 'Retrying skipped files...' : '');
    setInjectProgress(0);
    setRateLimitedFiles([]);
    setCurrentInjectFile(null);
    setInjectEtaSeconds(null);

    const total = files.length;
    let successCount = 0;
    let failCount = 0;
    const skipped: File[] = [];
    const secondsPerFile = 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentInjectFile(file.name);
      setInjectEtaSeconds((total - i - 1) * secondsPerFile);

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('sheetId', sheetId);

        const response = await fetch('/api/upload-excel', {
          body: formDataUpload,
          method: 'POST',
        });

        await response.json();

        if (response.ok) {
          successCount++;
        } else if (response.status === 429) {
          skipped.push(file);
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }

      setInjectProgress(Math.round(((i + 1) / total) * 100));

      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setCurrentInjectFile(null);
    setInjectEtaSeconds(null);
    setRateLimitedFiles(skipped);
    setCompletionStats({ success: successCount, failed: failCount, skipped: skipped.length });
    setShowCompletionModal(true);
    setInjectResult(
      skipped.length > 0 && !isRetry
        ? `Completed: ${String(successCount)} Success, ${String(failCount)} Failed. ${String(skipped.length)} skipped (rate limit). Auto-retry in 65s...`
        : `Completed: ${String(successCount)} Success, ${String(failCount)} Failed${skipped.length > 0 ? `, ${String(skipped.length)} Skipped (Rate Limit)` : ''}`
    );
    setInjecting(false);
    await refreshSpreadsheets();

    if (skipped.length === 0) {
      setTimeout(() => {
        setInjectSheet(null);
        setInjectFiles([]);
        setInjectResult(null);
      }, 2000);
    } else if (!isRetry && skipped.length > 0) {
      setRetryCountdown(65);
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = setInterval(() => {
        setRetryCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (retryIntervalRef.current) {
              clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = null;
            }
            setRetryCountdown(null);
            setTimeout(() => void injectExcel(skipped, true), 0);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [injectSheet, injectFiles, refreshSpreadsheets]);

  const clearInjectSelection = useCallback(() => {
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
    setInjectSheet(null);
    setInjectFiles([]);
    setInjectResult(null);
    setRateLimitedFiles([]);
    setRetryCountdown(null);
    setShowCompletionModal(false);
    setCompletionStats(null);
  }, []);

  const handleCloseCompletionModal = useCallback(() => {
    setShowCompletionModal(false);
    setCompletionStats(null);
  }, []);

  const handleRetryRateLimited = useCallback(() => {
    if (rateLimitedFiles.length > 0 && injectSheet) {
      void injectExcel(rateLimitedFiles, true);
    }
  }, [rateLimitedFiles, injectSheet, injectExcel]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-emerald-900">My Spreadsheets</h2>
        <button
          className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-900/90 transition-colors text-sm font-medium"
          onClick={handleInjectFileClick}
        >
          <Syringe size={18} />
          Inject File
        </button>
      </div>

      <div
        className="border-2 border-dashed border-emerald-900 rounded-lg p-12 mb-8 cursor-pointer hover:bg-emerald-900/5 transition-colors flex flex-col items-center justify-center gap-2"
        onClick={openAddForm}
      >
        <FileXls className="text-emerald-900" size={48} />
        <p className="text-emerald-900 font-medium">Click Here To Add A Spreadsheet Or Drag.</p>
        <p className="text-sm text-emerald-900/80">Supported Format: Google Sheets URL</p>
      </div>

      {injectSheet && injectFiles.length > 0 && (
        <div className="border border-emerald-900 rounded-lg overflow-hidden bg-white p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-emerald-900">
              Inject {injectFiles.length} File{injectFiles.length !== 1 ? 's' : ''} into <span className="font-mono">{injectSheet.name}</span>
            </p>
            <button
              className="text-sm text-emerald-900 hover:underline"
              onClick={clearInjectSelection}
            >
              Clear
            </button>
          </div>
          <ul className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {injectFiles.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-emerald-900">
                <FileXls size={16} />
                {f.name}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mb-4">
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-emerald-900 text-emerald-900 py-2 rounded-lg cursor-pointer hover:bg-emerald-900/5 transition-colors text-sm font-medium">
              <Plus size={16} />
              Add More Files
              <input
                accept=".xlsx,.xls"
                className="hidden"
                multiple
                onChange={(e) => {
                  const fileList = e.target.files;
                  if (fileList && fileList.length > 0) {
                    handleInjectFilesSelected(Array.from(fileList), true);
                  }
                  e.target.value = '';
                }}
                type="file"
              />
            </label>
          </div>
          <div className="space-y-3">
            <button
              className="flex items-center justify-center gap-2 w-full bg-emerald-900 text-white py-3 rounded-lg font-medium hover:bg-emerald-950 disabled:bg-emerald-900/50 disabled:text-white/70 disabled:cursor-not-allowed transition-colors"
              disabled={injecting}
              onClick={() => void injectExcel()}
            >
              <Syringe size={20} />
              {injecting ? 'Injecting...' : `Inject ${String(injectFiles.length)} Files To Sheets`}
            </button>
            {injecting && (
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-emerald-900/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-900 transition-all duration-300 ease-out"
                    style={{ width: `${injectProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm text-emerald-900">
                  <span className="font-mono font-medium">{injectProgress}%</span>
                  {injectEtaSeconds !== null && injectEtaSeconds > 0 && (
                    <span className="text-emerald-900/80">~{String(injectEtaSeconds)}s remaining</span>
                  )}
                </div>
                {currentInjectFile && (
                  <p className="text-xs text-emerald-900/80 truncate font-mono" title={currentInjectFile}>
                    Scanning: {currentInjectFile}
                  </p>
                )}
              </div>
            )}
            {injectResult && (
              <div className="p-4 rounded-lg bg-emerald-900/10 text-emerald-900 border border-emerald-900">
                {injectResult}
                {retryCountdown !== null && retryCountdown > 0 && (
                  <p className="mt-2 text-sm font-mono font-medium">
                    Retrying in {String(retryCountdown)}s...
                  </p>
                )}
              </div>
            )}
            {rateLimitedFiles.length > 0 && (
              <div className="space-y-3 p-4 rounded-lg border border-amber-500 bg-amber-50">
                <p className="text-sm font-medium text-amber-900">Skipped Due To Rate Limit ({rateLimitedFiles.length} Files)</p>
                <p className="text-xs text-amber-800">These files were skipped because the Google Sheets API quota was exceeded. Wait a minute and retry.</p>
                <ul className="max-h-32 overflow-y-auto space-y-1 text-sm text-amber-900 font-mono">
                  {rateLimitedFiles.map((f, i) => (
                    <li key={i}>• {f.name}</li>
                  ))}
                </ul>
                <button
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
                  disabled={injecting}
                  onClick={handleRetryRateLimited}
                >
                  <Syringe size={18} />
                  Retry Skipped Files
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
          setFormData({ name: '', description: '', url: '' });
        }}
        title={`${editingId ? 'Edit' : 'Add'} Spreadsheet`}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-emerald-900">Name</label>
            <input
              className="w-full border border-emerald-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
              }}
              placeholder="My Spreadsheet"
              type="text"
              value={formData.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-emerald-900">Description</label>
            <textarea
              className="w-full border border-emerald-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
              }}
              placeholder="Description"
              rows={2}
              value={formData.description}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-emerald-900">Spreadsheet URL</label>
            <input
              className="w-full border border-emerald-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
              onChange={(e) => {
                setFormData({ ...formData, url: e.target.value });
              }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              type="url"
              value={formData.url}
            />
            <p className="text-xs text-emerald-900 mt-1">
              Share With: <span className="font-mono bg-emerald-900/20 px-1 rounded text-emerald-900">{serviceAccountEmail}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 bg-emerald-900 text-white py-2 rounded text-sm font-medium hover:bg-emerald-950 disabled:bg-emerald-900/50 disabled:text-white/70 disabled:cursor-not-allowed transition-colors"
              disabled={submitting || !formData.name || !formData.url}
              onClick={() => {
                void saveSpreadsheet();
              }}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              className="flex-1 border-2 border-emerald-900 text-emerald-900 py-2 rounded text-sm font-medium hover:bg-emerald-900 hover:text-white transition-colors"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: '', description: '', url: '' });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showInjectSelectModal}
        onClose={() => setShowInjectSelectModal(false)}
        title="Select Spreadsheet To Inject"
      >
        <div className="space-y-4">
          {spreadsheets.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-emerald-900/90 mb-3">Choose an existing spreadsheet to inject Excel data into:</p>
              {spreadsheets.map((sheet) => (
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-emerald-900 text-left hover:bg-emerald-900/5 transition-colors"
                  key={sheet.id}
                  onClick={() => handleSelectSpreadsheetForInject(sheet)}
                >
                  <FileXls className="text-emerald-900 shrink-0" size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-emerald-900">{sheet.name}</p>
                    {sheet.description && (
                      <p className="text-xs text-emerald-900/70 truncate mt-0.5">{sheet.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-emerald-900/90">No spreadsheets yet. Create one to get started.</p>
          )}
          <button
            className="w-full flex items-center justify-center gap-2 border-2 border-emerald-900 text-emerald-900 py-2.5 rounded-lg hover:bg-emerald-900 hover:text-white transition-colors text-sm font-medium"
            onClick={handleCreateFromInjectModal}
          >
            <Plus size={18} />
            Create Spreadsheet
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!injectSheet && showInjectFileModal}
        onClose={closeInjectModal}
        title={injectSheet ? `Select Excel Files For "${injectSheet.name}"` : 'Inject Excel'}
      >
        {injectSheet && (
          <div className="space-y-4">
            <p className="text-sm text-emerald-900/90">Select one or more Excel files. The modal will close and files will appear below the upload area.</p>
            <input
              accept=".xlsx,.xls"
              className="w-full text-sm text-emerald-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-900 file:text-white hover:file:bg-emerald-950"
              multiple
              onChange={(e) => {
                const fileList = e.target.files;
                if (fileList && fileList.length > 0) {
                  handleInjectFilesSelected(Array.from(fileList));
                }
                e.target.value = '';
              }}
              type="file"
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCompletionModal}
        onClose={handleCloseCompletionModal}
        title="Injection Complete"
      >
        {completionStats && (
          <div className="space-y-4">
            <p className="text-sm text-emerald-900/90">Summary of the injection session:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-900/10 border border-emerald-900">
                <CheckCircle className="text-emerald-900 shrink-0" size={24} />
                <span className="text-emerald-900 font-medium">{completionStats.success} Success</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <XCircle className="text-red-600 shrink-0" size={24} />
                <span className="text-red-700 font-medium">{completionStats.failed} Failed</span>
              </div>
              {completionStats.skipped > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Warning className="text-amber-600 shrink-0" size={24} />
                  <span className="text-amber-800 font-medium">{completionStats.skipped} Skipped (Rate Limit)</span>
                </div>
              )}
            </div>
            <button
              className="w-full bg-emerald-900 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-950 transition-colors"
              onClick={handleCloseCompletionModal}
            >
              OK
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
