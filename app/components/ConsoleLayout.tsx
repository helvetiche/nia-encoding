'use client';

import { GraduationCap, House, MagnifyingGlass, SignOut, Table } from '@phosphor-icons/react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import Modal from './Modal';

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export default function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const isHome = pathname === '/console';
  const isSpreadsheets = pathname === '/spreadsheets';

  useEffect(() => {
    setUserEmail(localStorage.getItem('userEmail') ?? '');
    setUserId(localStorage.getItem('userId') ?? '');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="w-64 min-h-screen bg-emerald-900 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Image
              alt="Nia Encoding"
              height={36}
              src="/logo.png"
              width={36}
            />
            <h1 className="text-xl font-medium text-white">Nia Encoding</h1>
          </div>
          <p className="text-sm text-white/70">
            Automate consolidation of Excel files into Google Sheets.
          </p>
        </div>
        <div className="px-4 mb-4">
          <div className="relative">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
              size={20}
            />
            <input
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white"
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search..."
              type="text"
              value={sidebarSearch}
            />
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isHome ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => router.push('/console')}
          >
            <House size={20} />
            Home
          </button>
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isSpreadsheets ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => router.push('/spreadsheets')}
          >
            <Table size={20} />
            Spreadsheets
          </button>
        </nav>
        <div className="p-4 border-t border-white/20 space-y-3">
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-white mb-2">Need Help Getting Started?</p>
            <button
              className="w-full flex items-center justify-center gap-2 bg-emerald-900 text-white py-2 rounded-lg hover:bg-emerald-900/90 transition-colors text-sm font-medium"
              onClick={() => setShowTutorial(true)}
            >
              <GraduationCap size={18} />
              Tutorial
            </button>
          </div>
          {userEmail && (
            <div className="px-4 py-2">
              <p className="text-sm text-white truncate">{userEmail}</p>
              {userId && (
                <p className="text-xs text-white/60 font-mono mt-0.5">
                  #{userId.toUpperCase()}
                </p>
              )}
            </div>
          )}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={logout}
          >
            <SignOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main
        className="flex-1 min-h-screen overflow-auto"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 78, 59, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 78, 59, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      >
        {children}
      </main>

      <Modal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        size="large"
        title="Tutorial"
      >
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">1. Add A Spreadsheet</h3>
            <p className="text-emerald-900/90 mb-2">
              Click the dashed upload area or the "Add Spreadsheet" button. Enter a name, optional description, and the Google Sheets URL. Make sure to share the spreadsheet with the service account email shown in the form.
            </p>
            <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-900 font-mono text-sm text-emerald-900">
              <p>Example URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">2. Prepare Your Excel Files</h3>
            <p className="text-emerald-900/90 mb-2">
              Your Excel files must include a file ID in the filename. The system extracts this ID to match rows in the spreadsheet. Format your spreadsheet with column A containing the file IDs that correspond to your Excel filenames.
            </p>
            <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-900 font-mono text-sm text-emerald-900">
              <p>Example filename: division10_12345.xlsx (ID: 12345)</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">3. Inject Excel Data</h3>
            <p className="text-emerald-900/90 mb-2">
              Click the "Inject" button on any spreadsheet row. Select one or more Excel files and click "Inject Excel". The system will parse each file, find the matching row in the spreadsheet, and write the extracted data.
            </p>
            <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-900 font-mono text-sm text-emerald-900">
              <p>Multiple files can be injected at once. A progress bar shows the completion status.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">4. Data Mapping</h3>
            <p className="text-emerald-900/90 mb-2">
              The system writes account details (lot number, owner, farmer) to columns B–G and SOA details (area, principal, penalty, total) to columns I–M of the matched row.
            </p>
          </section>
        </div>
      </Modal>
    </div>
  );
}
