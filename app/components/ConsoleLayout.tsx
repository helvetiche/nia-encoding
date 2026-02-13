"use client";

import {
  FileXls,
  GraduationCap,
  Link,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  SignOut,
  Syringe,
  Trash,
  FileArrowDown,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConsoleProvider, useConsole } from "../context/ConsoleContext";
import GenerateProfilesModal from "./GenerateProfilesModal";
import Modal from "./Modal";

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

const SidebarContent = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const {
    spreadsheets,
    loading,
    popoverSheetId,
    setPopoverSheetId,
    openAddSpreadsheet,
    spreadsheetActions,
  } = useConsole();
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!popoverSheetId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setPopoverSheetId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverSheetId, setPopoverSheetId]);

  const filteredSpreadsheets = useMemo(() => {
    if (!sidebarSearch.trim()) return spreadsheets;
    const q = sidebarSearch.toLowerCase().trim();
    return spreadsheets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q),
    );
  }, [spreadsheets, sidebarSearch]);

  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") ?? "");
    setUserId(localStorage.getItem("userId") ?? "");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex bg-white">
      <aside
        className="w-64 min-h-screen bg-emerald-900 flex flex-col shrink-0"
        ref={sidebarRef}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Image alt="Nia Encoding" height={36} src="/logo.png" width={36} />
            <h1 className="text-xl font-medium text-white">Nia Encoding</h1>
          </div>
          <p className="text-sm text-white/70">
            Automate consolidation of Excel files into Google Sheets.
          </p>
        </div>
        <div className="px-4 mb-4">
          <button
            className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white py-2.5 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium mb-2"
            onClick={() => setShowGenerateModal(true)}
            type="button"
          >
            <FileArrowDown size={18} />
            Generate Profiles
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white py-2.5 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium mb-4"
            onClick={openAddSpreadsheet}
          >
            <Plus size={18} />
            Add Spreadsheet
          </button>
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
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="flex gap-3 p-3 rounded-lg bg-white/5" key={i}>
                  <div className="w-8 h-8 rounded bg-white/20 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-24 rounded bg-white/20 animate-pulse mb-2" />
                    <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSpreadsheets.length === 0 ? (
            <p className="text-sm text-white/60 py-4">No Spreadsheets Yet</p>
          ) : (
            filteredSpreadsheets.map((sheet) => (
              <div className="relative" key={sheet.id}>
                <button
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                    popoverSheetId === sheet.id
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopoverSheetId(
                      popoverSheetId === sheet.id ? null : sheet.id,
                    );
                  }}
                >
                  <FileXls className="text-white shrink-0 mt-0.5" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sheet.name}</p>
                    <p className="text-xs text-white/70 truncate mt-0.5">
                      {sheet.description || "No description"}
                    </p>
                  </div>
                </button>
                {popoverSheetId === sheet.id && spreadsheetActions && (
                  <div
                    className="absolute left-0 top-full mt-1 z-50 min-w-[140px] bg-white border border-emerald-900 rounded-lg shadow-lg py-1"
                    role="menu"
                  >
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-900/10 transition-colors text-left"
                      onClick={() => {
                        spreadsheetActions.onInject(sheet);
                        setPopoverSheetId(null);
                      }}
                      role="menuitem"
                    >
                      <Syringe size={16} />
                      Inject
                    </button>
                    <a
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-900/10 transition-colors text-left"
                      href={sheet.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      onClick={() => setPopoverSheetId(null)}
                    >
                      <Link size={16} />
                      Open
                    </a>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-900/10 transition-colors text-left"
                      onClick={() => {
                        spreadsheetActions.onEdit(sheet);
                        setPopoverSheetId(null);
                      }}
                      role="menuitem"
                    >
                      <PencilSimple size={16} />
                      Edit
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      onClick={() => {
                        spreadsheetActions.onDelete(sheet.id);
                        setPopoverSheetId(null);
                      }}
                      role="menuitem"
                    >
                      <Trash size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-white/20 space-y-3">
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-white mb-2">
              Need Help Getting Started?
            </p>
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
          backgroundSize: "24px 24px",
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
            <h3 className="text-lg font-medium text-emerald-900 mb-2">
              1. Add A Spreadsheet
            </h3>
            <p className="text-emerald-900/90 mb-2">
              Click the dashed upload area or the "Add Spreadsheet" button.
              Enter a name, optional description, and the Google Sheets URL.
              Make sure to share the spreadsheet with the service account email
              shown in the form.
            </p>
            <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-900 font-mono text-sm text-emerald-900">
              <p>
                Example URL:
                https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">
              2. Prepare Your Excel Files
            </h3>
            <p className="text-emerald-900/90 mb-2">
              Your Excel files must include a file ID in the filename. The
              system extracts this ID to match rows in the spreadsheet. Format
              your spreadsheet with column A containing the file IDs that
              correspond to your Excel filenames.
            </p>
            <p className="text-emerald-900/90 mb-2">
              Share your Google Sheet with the service account so it can write
              data:
            </p>
            <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-900 font-mono text-sm text-emerald-900">
              <p>
                firebase-adminsdk-fbsvc@nia-encoding.iam.gserviceaccount.com
              </p>
              <p className="mt-2 text-emerald-900/80">
                Example filename: division10_12345.xlsx (ID: 12345)
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">
              3. Inject Excel Data
            </h3>
            <p className="text-emerald-900/90 mb-2">
              Click the "Inject" button on any spreadsheet row. Select one or
              more Excel files and click "Inject Excel". The system will parse
              each file, find the matching row in the spreadsheet, and write the
              extracted data.
            </p>
            <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-900 font-mono text-sm text-emerald-900">
              <p>
                Multiple files can be injected at once. A progress bar shows the
                completion status.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">
              4. Data Mapping
            </h3>
            <p className="text-emerald-900/90 mb-2">
              The system writes account details (lot number, owner, farmer) to
              columns B–G and SOA details (area, principal, penalty, total) to
              columns I–M of the matched row.
            </p>
          </section>
        </div>
      </Modal>

      <GenerateProfilesModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  );
};

export default function ConsoleLayout({ children }: ConsoleLayoutProps) {
  return (
    <ConsoleProvider>
      <SidebarContent>{children}</SidebarContent>
    </ConsoleProvider>
  );
}
