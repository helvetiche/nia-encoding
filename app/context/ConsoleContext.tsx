'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface Spreadsheet {
  id: string;
  name: string;
  description: string;
  url: string;
}

interface ConsoleContextValue {
  spreadsheets: Spreadsheet[];
  loading: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  refreshSpreadsheets: () => Promise<void>;
  registerOpenAddSpreadsheet: (fn: () => void) => void;
  openAddSpreadsheet: () => void;
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export const useConsole = () => {
  const ctx = useContext(ConsoleContext);
  if (!ctx) {
    throw new Error('useConsole must be used within ConsoleLayout');
  }
  return ctx;
};

interface ConsoleProviderProps {
  children: React.ReactNode;
}

export const ConsoleProvider = ({ children }: ConsoleProviderProps) => {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const openAddSpreadsheetRef = useRef<(() => void) | null>(null);

  const registerOpenAddSpreadsheet = useCallback((fn: () => void) => {
    openAddSpreadsheetRef.current = fn;
  }, []);

  const openAddSpreadsheet = useCallback(() => {
    openAddSpreadsheetRef.current?.();
  }, []);

  const refreshSpreadsheets = useCallback(async () => {
    try {
      const response = await fetch('/api/spreadsheets');
      const data = (await response.json()) as { data: Spreadsheet[] };
      if (response.ok) {
        setSpreadsheets(data.data);
      }
    } catch {
      setSpreadsheets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSpreadsheets();
  }, [refreshSpreadsheets]);

  const value: ConsoleContextValue = {
    spreadsheets,
    loading,
    selectedId,
    setSelectedId,
    refreshSpreadsheets,
    registerOpenAddSpreadsheet,
    openAddSpreadsheet,
  };

  return (
    <ConsoleContext.Provider value={value}>
      {children}
    </ConsoleContext.Provider>
  );
};
