'use client';

import { ArrowLeft, FileXls, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import ConsoleLayout from '../components/ConsoleLayout';
import Modal from '../components/Modal';

interface Spreadsheet {
  id: string;
  name: string;
  description: string;
  url: string;
}

export default function SpreadsheetsPage() {
  const router = useRouter();
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const serviceAccountEmail = process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL ?? '';

  const loadSpreadsheets = useCallback(async () => {
    try {
      const response = await fetch('/api/spreadsheets');
      const data = await response.json() as { data: Spreadsheet[] };
      
      if (response.ok) {
        setSpreadsheets(data.data);
      }
    } catch {
      console.error('failed to load spreadsheets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSpreadsheets();
  }, [loadSpreadsheets]);

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
        await loadSpreadsheets();
      }
    } catch {
      console.error('failed to save spreadsheet');
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingId, loadSpreadsheets]);

  const deleteSheet = useCallback(async (id: string) => {
    if (!confirm('Delete This Spreadsheet?')) {
      return;
    }

    try {
      const response = await fetch(`/api/spreadsheets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSpreadsheets();
      }
    } catch {
      console.error('failed to delete spreadsheet');
    }
  }, [loadSpreadsheets]);

  const editSheet = useCallback((sheet: Spreadsheet) => {
    setFormData({ name: sheet.name, description: sheet.description, url: sheet.url });
    setEditingId(sheet.id);
    setShowForm(true);
  }, []);

  return (
    <ConsoleLayout>
      <div className="p-8">
        <button
          className="flex items-center gap-2 text-emerald-900 mb-6 hover:underline"
          onClick={() => router.push('/console')}
        >
          <ArrowLeft size={18} />
          Back To Console
        </button>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium text-emerald-900">Spreadsheets</h2>
          <button
            className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-900/90 transition-colors text-sm font-medium"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: '', description: '', url: '' });
            }}
          >
            <Plus size={18} />
            Add Spreadsheet
          </button>
        </div>

        <div
          className="border-2 border-dashed border-emerald-900 rounded-lg p-12 mb-8 cursor-pointer hover:bg-emerald-900/5 transition-colors flex flex-col items-center justify-center gap-2"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: '', description: '', url: '' });
          }}
        >
          <FileXls className="text-emerald-900" size={48} />
          <p className="text-emerald-900 font-medium">Click Here To Add A Spreadsheet Or Drag.</p>
          <p className="text-sm text-emerald-900/80">Supported Format: Google Sheets URL</p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-emerald-900">Spreadsheets</h3>
          <p className="text-sm text-emerald-900/80 mt-1">
            {spreadsheets.length} Total · Here You Can Explore Your Spreadsheets.
          </p>
        </div>

        {showForm && (
          <Modal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData({ name: '', description: '', url: '' });
            }}
            title={`${editingId ? 'Edit' : 'Add'} Spreadsheet`}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-emerald-900">Name</label>
                <input
                  className="w-full border border-emerald-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                  }}
                  placeholder="My Spreadsheet"
                  type="text"
                  value={formData.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-emerald-900">Description</label>
                <textarea
                  className="w-full border border-emerald-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                  }}
                  placeholder="Description of this spreadsheet"
                  rows={3}
                  value={formData.description}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-emerald-900">Spreadsheet URL</label>
                <input
                  className="w-full border border-emerald-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
                  onChange={(e) => {
                    setFormData({ ...formData, url: e.target.value });
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  type="url"
                  value={formData.url}
                />
                <p className="text-xs text-emerald-900 mt-2">
                  Share This Spreadsheet With: <span className="font-mono bg-emerald-900/20 px-2 py-1 rounded text-emerald-900">{serviceAccountEmail}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 bg-emerald-900 text-white py-2 rounded-lg hover:bg-emerald-950 disabled:bg-emerald-900/50 disabled:text-white/70 disabled:cursor-not-allowed font-medium transition-colors"
                  disabled={submitting || !formData.name || !formData.url}
                  onClick={() => {
                    void saveSpreadsheet();
                  }}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="flex-1 border-2 border-emerald-900 text-emerald-900 py-2 rounded-lg hover:bg-emerald-900 hover:text-white transition-colors"
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
        )}

        {loading ? (
          <p className="text-emerald-900 font-mono">Loading...</p>
        ) : spreadsheets.length === 0 ? (
          <p className="text-emerald-900 font-mono">No Spreadsheets Yet</p>
        ) : (
          <div className="border border-emerald-900 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-white">
                  <th className="w-12 px-4 py-3" />
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {spreadsheets.map((sheet) => (
                  <tr
                    className="border-t border-emerald-900/20 hover:bg-emerald-900/5 transition-colors"
                    key={sheet.id}
                  >
                    <td className="px-4 py-3">
                      <FileXls className="text-emerald-900" size={24} />
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-900">{sheet.name}</td>
                    <td className="px-4 py-3 text-emerald-900 max-w-xs truncate font-mono">{sheet.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end items-center">
                        <a
                          className="flex items-center gap-1 text-emerald-900 hover:underline"
                          href={sheet.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Open
                        </a>
                        <button
                          className="flex items-center gap-1 text-emerald-900"
                          onClick={() => editSheet(sheet)}
                        >
                          <PencilSimple size={16} />
                          Edit
                        </button>
                        <button
                          className="flex items-center gap-1 text-emerald-900"
                          onClick={() => void deleteSheet(sheet.id)}
                        >
                          <Trash size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ConsoleLayout>
  );
}
