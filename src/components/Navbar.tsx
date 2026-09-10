import React, { useState } from 'react';
import { SubjectId, PaperId, SyncMetadata } from '../types';
import { User } from 'firebase/auth';
import { 
  BookOpen, 
  BarChart3, 
  Clock, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  LogOut,
  Compass,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeSubject: SubjectId;
  activePaper: PaperId;
  onSelectPaper: (subject: SubjectId, paper: PaperId) => void;
  activeTab: 'tracker' | 'charts' | 'countdowns';
  onSelectTab: (tab: 'tracker' | 'charts' | 'countdowns') => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  syncMeta: SyncMetadata;
  onOpenSyncModal: () => void;
  onTriggerSync: () => void;
  completionRate: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSubject,
  activePaper,
  onSelectPaper,
  activeTab,
  onSelectTab,
  user,
  onSignIn,
  onSignOut,
  syncMeta,
  onOpenSyncModal,
  onTriggerSync,
  completionRate,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const subjectGroups: {
    subject: SubjectId;
    nameEn: string;
    nameBn: string;
    color: string;
    papers: { paper: PaperId; labelEn: string; labelBn: string }[];
  }[] = [
    {
      subject: 'physics',
      nameEn: 'Physics',
      nameBn: 'পদার্থবিজ্ঞান',
      color: 'indigo',
      papers: [
        { paper: '1st', labelEn: 'Physics 1st', labelBn: 'পদার্থবিজ্ঞান ১ম' },
        { paper: '2nd', labelEn: 'Physics 2nd', labelBn: 'পদার্থবিজ্ঞান ২য়' },
      ],
    },
    {
      subject: 'chemistry',
      nameEn: 'Chemistry',
      nameBn: 'রসায়ন',
      color: 'amber',
      papers: [
        { paper: '1st', labelEn: 'Chemistry 1st', labelBn: 'রসায়ন ১ম' },
        { paper: '2nd', labelEn: 'Chemistry 2nd', labelBn: 'রসায়ন ২য়' },
      ],
    },
    {
      subject: 'higher_math',
      nameEn: 'Higher Math',
      nameBn: 'উচ্চতর গণিত',
      color: 'emerald',
      papers: [
        { paper: '1st', labelEn: 'Math 1st', labelBn: 'উচ্চতর গণিত ১ম' },
        { paper: '2nd', labelEn: 'Math 2nd', labelBn: 'উচ্চতর গণিত ২য়' },
      ],
    },
    {
      subject: 'biology',
      nameEn: 'Biology',
      nameBn: 'জীববিজ্ঞান',
      color: 'rose',
      papers: [
        { paper: '1st', labelEn: 'Biology 1st', labelBn: 'জীববিজ্ঞান ১ম' },
        { paper: '2nd', labelEn: 'Biology 2nd', labelBn: 'জীববিজ্ঞান ২য়' },
      ],
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Bar: Title, User, Sync */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Track The Journey
              </h1>
            </div>
          </div>

          {/* Right Action: Sync Status & Google Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sync Badge / Button */}
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  id="sync-now-button"
                  onClick={onTriggerSync}
                  disabled={syncMeta.isSyncing}
                  title={syncMeta.lastSyncedAt ? `Last synced: ${new Date(syncMeta.lastSyncedAt).toLocaleTimeString()}` : 'Sync with Google Sheets'}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncMeta.isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                  <span className="hidden md:inline">
                    {syncMeta.isSyncing ? 'Syncing...' : 'Sync Sheets'}
                  </span>
                </button>

                <button
                  id="open-sync-modal-button"
                  onClick={onOpenSyncModal}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">
                    {syncMeta.spreadsheetId ? 'Connected Sheet' : 'Setup Sheets'}
                  </span>
                </button>

                {/* User Info & Logout */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <button
                    id="sign-out-button"
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="google-sign-in-button"
                onClick={onSignIn}
                className="gsi-material-button inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Sign in for Cloud Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs (Chapter Tracker | Charts | Countdowns) */}
        <div className="flex items-center justify-between border-t border-slate-100 py-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1">
            <button
              id="tab-tracker-button"
              onClick={() => onSelectTab('tracker')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tracker'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chapter Tracker</span>
            </button>

            <button
              id="tab-charts-button"
              onClick={() => onSelectTab('charts')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'charts'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Visual Analytics</span>
            </button>

            <button
              id="tab-countdowns-button"
              onClick={() => onSelectTab('countdowns')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'countdowns'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Admission Countdowns</span>
            </button>
          </div>

          {/* Quick Overall Progress Pill */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 pl-4">
            <span>Overall Readiness:</span>
            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="font-bold text-slate-700">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Secondary Ribbon: Subject & Paper Selector */}
      <div className="bg-slate-50/90 border-t border-slate-200 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              id="subject-menu-button"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition shadow-2xs text-left ${
                isMenuOpen
                  ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
              }`}
              aria-label="Select paper"
              aria-expanded={isMenuOpen}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isMenuOpen
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}
              >
                {isMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </div>
              <span className="text-sm font-semibold text-slate-800">
                Select paper
              </span>
            </button>
          </div>

          {/* Expanded Subject Navigator List (Responsive 1-4 cols) */}
          {isMenuOpen && (
            <div
              id="subject-navigator-drawer"
              className="mt-2 bg-white border border-slate-200 rounded-xl p-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {subjectGroups.map((group) => (
                  <div
                    key={group.subject}
                    className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-xs font-bold text-slate-800">
                        {group.nameEn}{' '}
                        <span className="text-slate-500 font-normal">({group.nameBn})</span>
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          group.color === 'indigo'
                            ? 'bg-indigo-100 text-indigo-700'
                            : group.color === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : group.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        2 Papers
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {group.papers.map((p) => {
                        const isSelected =
                          activeSubject === group.subject && activePaper === p.paper;
                        return (
                          <button
                            key={`${group.subject}-${p.paper}`}
                            id={`paper-tab-${group.subject}-${p.paper}`}
                            onClick={() => {
                              onSelectPaper(group.subject, p.paper);
                              setIsMenuOpen(false);
                            }}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition border text-left ${
                              isSelected
                                ? 'bg-white text-indigo-700 border-indigo-400 shadow-xs font-bold ring-2 ring-indigo-100'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 font-medium'
                            }`}
                          >
                            <div className="min-w-0 pr-1">
                              <div className="truncate font-semibold">{p.labelEn}</div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {p.labelBn}
                              </div>
                            </div>
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
