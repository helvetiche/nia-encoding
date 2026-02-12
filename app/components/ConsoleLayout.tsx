'use client';

import { House, MagnifyingGlass, SignOut, Table } from '@phosphor-icons/react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export default function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarSearch, setSidebarSearch] = useState('');
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
    </div>
  );
}
