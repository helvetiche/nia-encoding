'use client';

import { FileXls, Link, PencilSimple, Plus, Syringe, Trash } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

import { useConsole, type Spreadsheet } from '../context/ConsoleContext';
import Modal from '../components/Modal';

const extractSheetIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export default function SpreadsheetManager() {
  const { spreadsheets, selectedId, setSelectedId, refreshSpreadsheets, registerOpenAddSpreadsheet } = useConsole();
  const selectedSheet = spreadsheets.find((s) => s.id === selectedId) ?? null;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ description: '', name: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [injectSheet, setInjectSheet] = useState<Spreadsheet | null>(null);
  const [injectFiles, setInjectFiles] = useState<File[]>([]);
  const [injecting, setInjecting] = useState(false);
  const [injectProgress, setInjectProgress] = useState(0);
  const [injectResult, setInjectResult] = useState<null | string>(null);
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
    setShowInjectFileModal(true);
  }, []);

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

  const handleInjectFilesSelected = useCallback((files: File[]) => {
    setInjectFiles(files);
    setInjectResult(null);
    setShowInjectFileModal(false);
  }, []);

  const injectExcel = useCallback(async () => {
    if (!injectSheet || injectFiles.length === 0) {
      return;
    }

    const sheetId = extractSheetIdFromUrl(injectSheet.url);
    if (!sheetId) {
      setInjectResult('Invalid Spreadsheet URL');
      return;
    }

    setInjecting(true);
    setInjectResult('');
    setInjectProgress(0);

    const total = injectFiles.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < injectFiles.length; i++) {
      const file = injectFiles[i];

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
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }

      setInjectProgress(Math.round(((i + 1) / total) * 100));
    }
    setInjectResult(`Completed: ${String(successCount)} Success, ${String(failCount)} Failed`);
    setInjecting(false);
    await refreshSpreadsheets();
    setTimeout(() => {
      setInjectSheet(null);
      setInjectFiles([]);
      setInjectResult(null);
    }, 2000);
  }, [injectSheet, injectFiles, refreshSpreadsheets]);

  const clearInjectSelection = useCallback(() => {
    setInjectSheet(null);
    setInjectFiles([]);
    setInjectResult(null);
  }, []);

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
          <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {injectFiles.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-emerald-900">
                <FileXls size={16} />
                {f.name}
              </li>
            ))}
          </ul>
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
                <div className="h-2 w-full bg-emerald-900/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-900 transition-all duration-300 ease-out"
                    style={{ width: `${injectProgress}%` }}
                  />
                </div>
                <p className="text-sm font-mono text-emerald-900 text-center">{injectProgress}%</p>
              </div>
            )}
            {injectResult && (
              <div className="p-4 rounded-lg bg-emerald-900/10 text-emerald-900 border border-emerald-900">
                {injectResult}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSheet ? (
        <div className="border border-emerald-900 rounded-lg overflow-hidden bg-white p-6">
          <div className="flex items-start gap-4 mb-4">
            <FileXls className="text-emerald-900 shrink-0" size={32} />
            <div>
              <h3 className="text-lg font-medium text-emerald-900">{selectedSheet.name}</h3>
              {selectedSheet.description && (
                <p className="text-sm text-emerald-900/80 mt-1 font-mono">{selectedSheet.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-900 text-white text-sm font-medium hover:bg-emerald-950 transition-colors"
              onClick={() => openInjectModal(selectedSheet)}
              title="Inject Excel"
            >
              <Syringe size={16} />
              Inject
            </button>
            <a
              className="flex items-center gap-1 px-4 py-2 rounded-lg border-2 border-emerald-900 text-emerald-900 text-sm font-medium hover:bg-emerald-900 hover:text-white transition-colors"
              href={selectedSheet.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Link size={16} />
              Open
            </a>
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-lg border-2 border-emerald-900 text-emerald-900 text-sm font-medium hover:bg-emerald-900 hover:text-white transition-colors"
              onClick={() => editSheet(selectedSheet)}
            >
              <PencilSimple size={16} />
              Edit
            </button>
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-lg border-2 border-red-600 text-red-600 text-sm font-medium hover:bg-red-600 hover:text-white transition-colors"
              onClick={() => void deleteSheet(selectedSheet.id)}
            >
              <Trash size={16} />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <p className="text-emerald-900 text-sm font-mono">Select A Spreadsheet From The Sidebar</p>
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
    </div>
  );
}
