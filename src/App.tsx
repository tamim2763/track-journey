/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  SubjectId, 
  PaperId, 
  ChapterProgress, 
  AdmissionExam, 
  SyncMetadata 
} from './types';
import { INITIAL_CHAPTERS, INITIAL_EXAMS, getCleanChapters, calculateChapterAverage } from './services/initialData';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken,
  setCachedToken,
  getStoredAccessToken
} from './services/firebaseAuth';
import { syncAllChaptersToSpreadsheet } from './services/googleSheets';
import { User } from 'firebase/auth';

import { Navbar } from './components/Navbar';
import { ChapterTable } from './components/ChapterTable';
import { ProgressCharts } from './components/ProgressCharts';
import { CountdownWidget } from './components/CountdownWidget';
import { SyncModal } from './components/SyncModal';

import { 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Clock, 
  BarChart3, 
  Layers,
  GraduationCap,
  Compass,
  Target
} from 'lucide-react';

const isOldDummyData = (list: ChapterProgress[]): boolean => {
  const vec = list.find((c) => c.id === 'phy-1-2');
  return vec?.exam1 === 85 && vec?.exam2 === 78;
};

const isOldDefaultExams = (list: AdmissionExam[]): boolean => {
  return list.some((e) => e.id === 'buet-2026' || e.id === 'du-ka-2026' || e.id === 'ckruet-2026');
};

const getStorageKey = (prefix: string, uid?: string | null) => {
  return `hsc_admission_tracker_${prefix}_${uid ? uid : 'guest'}_v2`;
};

const loadStoredChapters = (uid?: string | null): ChapterProgress[] => {
  try {
    // Purge old v1 global key if it contained dummy data
    const oldV1 = localStorage.getItem('hsc_admission_tracker_chapters_v1');
    if (oldV1) {
      try {
        const parsedV1 = JSON.parse(oldV1);
        if (isOldDummyData(parsedV1)) {
          localStorage.removeItem('hsc_admission_tracker_chapters_v1');
        }
      } catch {
        localStorage.removeItem('hsc_admission_tracker_chapters_v1');
      }
    }

    const key = getStorageKey('chapters', uid);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && !isOldDummyData(parsed)) {
        const existingMap = new Map<string, ChapterProgress>(
          parsed.map((c: ChapterProgress) => [c.id, c])
        );
        return getCleanChapters().map((initCh) => {
          const savedCh = existingMap.get(initCh.id);
          if (!savedCh) return initCh;
          return {
            ...savedCh,
            average: calculateChapterAverage(savedCh.exam1, savedCh.exam2, savedCh.exam3),
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed to parse cached chapters', e);
  }
  return getCleanChapters();
};

const loadStoredExams = (uid?: string | null): AdmissionExam[] => {
  try {
    // Purge old global v1 key if it had default exams
    const oldV1 = localStorage.getItem('hsc_admission_tracker_exams_v1');
    if (oldV1) {
      try {
        const parsedV1 = JSON.parse(oldV1);
        if (isOldDefaultExams(parsedV1)) {
          localStorage.removeItem('hsc_admission_tracker_exams_v1');
        }
      } catch {
        localStorage.removeItem('hsc_admission_tracker_exams_v1');
      }
    }

    const key = getStorageKey('exams', uid);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && !isOldDefaultExams(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse cached exams', e);
  }
  return INITIAL_EXAMS;
};

const loadStoredSyncMeta = (uid?: string | null): SyncMetadata => {
  try {
    const key = getStorageKey('sync_meta', uid);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse cached sync meta', e);
  }
  return {
    spreadsheetId: null,
    spreadsheetName: null,
    spreadsheetUrl: null,
    lastSyncedAt: null,
    isSyncing: false,
    error: null,
    autoSync: true,
  };
};

export default function App() {
  const getInitialUid = (): string | null => {
    try {
      return localStorage.getItem('hsc_last_known_uid');
    } catch {
      return null;
    }
  };

  const initialUid = getInitialUid();

  // Firebase auth & token state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken(initialUid || undefined));
  const [authInitialized, setAuthInitialized] = useState(false);

  // Load initial state per user or clean defaults
  const [chapters, setChapters] = useState<ChapterProgress[]>(() => loadStoredChapters(initialUid));
  const [exams, setExams] = useState<AdmissionExam[]>(() => loadStoredExams(initialUid));
  const [syncMeta, setSyncMeta] = useState<SyncMetadata>(() => loadStoredSyncMeta(initialUid));

  const [activeSubject, setActiveSubject] = useState<SubjectId>('physics');
  const [activePaper, setActivePaper] = useState<PaperId>('1st');
  const [activeTab, setActiveTab] = useState<'tracker' | 'charts' | 'countdowns'>('tracker');

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Persist chapters to localStorage for current user session once auth is resolved
  useEffect(() => {
    if (!authInitialized) return;
    try {
      const key = getStorageKey('chapters', user?.uid);
      localStorage.setItem(key, JSON.stringify(chapters));
    } catch (e) {
      console.error('Failed to save chapters to localStorage', e);
    }
  }, [chapters, user?.uid, authInitialized]);

  // Persist exams to localStorage for current user session once auth is resolved
  useEffect(() => {
    if (!authInitialized) return;
    try {
      const key = getStorageKey('exams', user?.uid);
      localStorage.setItem(key, JSON.stringify(exams));
    } catch (e) {
      console.error('Failed to save exams to localStorage', e);
    }
  }, [exams, user?.uid, authInitialized]);

  // Persist syncMeta to localStorage for current user session once auth is resolved
  useEffect(() => {
    if (!authInitialized) return;
    try {
      const key = getStorageKey('sync_meta', user?.uid);
      localStorage.setItem(
        key,
        JSON.stringify({
          spreadsheetId: syncMeta.spreadsheetId,
          spreadsheetName: syncMeta.spreadsheetName,
          spreadsheetUrl: syncMeta.spreadsheetUrl,
          lastSyncedAt: syncMeta.lastSyncedAt,
          autoSync: syncMeta.autoSync,
        })
      );
    } catch (e) {
      console.error('Failed to save syncMeta', e);
    }
  }, [syncMeta, user?.uid, authInitialized]);

  // Initialize Auth state listener & switch dataset per user account
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        try {
          localStorage.setItem('hsc_last_known_uid', currentUser.uid);
        } catch {}
        // Load data specific to this user; if they are a new user, they start fresh from zero
        setChapters(loadStoredChapters(currentUser.uid));
        setExams(loadStoredExams(currentUser.uid));
        setSyncMeta(loadStoredSyncMeta(currentUser.uid));
        setAuthInitialized(true);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        try {
          localStorage.removeItem('hsc_last_known_uid');
        } catch {}
        setChapters(loadStoredChapters(null));
        setExams(loadStoredExams(null));
        setSyncMeta(loadStoredSyncMeta(null));
        setAuthInitialized(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        try {
          localStorage.setItem('hsc_last_known_uid', res.user.uid);
        } catch {}
        setChapters(loadStoredChapters(res.user.uid));
        setExams(loadStoredExams(res.user.uid));
        setSyncMeta(loadStoredSyncMeta(res.user.uid));
        setAuthInitialized(true);
        showToast(`Signed in as ${res.user.displayName || res.user.email}!`, 'success');
      }
    } catch (err: any) {
      showToast(`Sign in failed: ${err.message}`, 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      try {
        localStorage.removeItem('hsc_last_known_uid');
      } catch {}
      setUser(null);
      setAccessToken(null);
      setChapters(loadStoredChapters(null));
      setExams(loadStoredExams(null));
      setSyncMeta(loadStoredSyncMeta(null));
      showToast('Signed out from Google Account', 'info');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateChapter = useCallback((updated: ChapterProgress) => {
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleUpdateAllChapters = useCallback((updatedList: ChapterProgress[]) => {
    setChapters(updatedList);
  }, []);

  const handleUpdateSyncMeta = useCallback((meta: Partial<SyncMetadata>) => {
    setSyncMeta((prev) => ({ ...prev, ...meta }));
  }, []);

  // Trigger manual or quick sync
  const handleTriggerSync = async () => {
    if (!user || !accessToken) {
      setIsSyncModalOpen(true);
      return;
    }

    if (!syncMeta.spreadsheetId) {
      setIsSyncModalOpen(true);
      return;
    }

    try {
      setSyncMeta((prev) => ({ ...prev, isSyncing: true }));
      showToast('Syncing to Google Sheets...', 'info');

      await syncAllChaptersToSpreadsheet(accessToken, syncMeta.spreadsheetId, chapters);

      const now = new Date().toISOString();
      setSyncMeta((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
      }));
      showToast('Google Sheets synchronized successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      setSyncMeta((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      showToast(`Sync error: ${err.message}`, 'error');
    }
  };

  // Exam list modifications
  const handleAddExam = (newExam: AdmissionExam) => {
    setExams((prev) => [...prev, newExam]);
    showToast(`Added target countdown for ${newExam.name}`, 'success');
  };

  const handleDeleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    showToast('Removed countdown', 'info');
  };

  const handleResetDefaultExams = () => {
    setExams(INITIAL_EXAMS);
    showToast('Restored official admission exams', 'info');
  };

  const handleTogglePin = (id: string) => {
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e))
    );
  };

  // Overall readiness rate: Average of all 8 papers' "subject progress"
  const completionRate = useMemo(() => {
    if (!chapters.length) return 0;

    const papers: { subject: SubjectId; paper: PaperId }[] = [
      { subject: 'physics', paper: '1st' },
      { subject: 'physics', paper: '2nd' },
      { subject: 'chemistry', paper: '1st' },
      { subject: 'chemistry', paper: '2nd' },
      { subject: 'higher_math', paper: '1st' },
      { subject: 'higher_math', paper: '2nd' },
      { subject: 'biology', paper: '1st' },
      { subject: 'biology', paper: '2nd' },
    ];

    const paperProgresses = papers.map(({ subject, paper }) => {
      const paperChapters = chapters.filter(
        (c) => c.subject === subject && c.paper === paper
      );
      if (!paperChapters.length) return 0;
      // Paper's Subject Progress: sum of chapter averages (ungraded = 0%) divided by total chapters in this paper
      const totalAverageSum = paperChapters.reduce(
        (acc, c) => acc + (c.average !== null ? c.average : 0),
        0
      );
      return totalAverageSum / paperChapters.length;
    });

    const averageSubjectProgress =
      paperProgresses.reduce((acc, val) => acc + val, 0) / papers.length;

    return Math.round(averageSubjectProgress * 10) / 10;
  }, [chapters]);

  // Total current week targets
  const currentWeekChapters = useMemo(() => {
    return chapters.filter((c) => c.isCurrentWeek);
  }, [chapters]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-2 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navbar & Navigation Tabs */}
      <Navbar
        activeSubject={activeSubject}
        activePaper={activePaper}
        onSelectPaper={(subj, p) => {
          setActiveSubject(subj);
          setActivePaper(p);
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        syncMeta={syncMeta}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onTriggerSync={handleTriggerSync}
        completionRate={completionRate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Current Week Banner (if any chapters are marked) */}
        {currentWeekChapters.length > 0 && activeTab === 'tracker' && (
          <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-white border animate-border-pulse shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center space-x-2 shrink-0">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Target className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Active Weekly Focus
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {currentWeekChapters.length} {currentWeekChapters.length === 1 ? 'Chapter' : 'Chapters'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {currentWeekChapters.map((ch) => (
                  <span
                    key={ch.id}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-indigo-50/40 hover:border-indigo-200 transition shadow-2xs"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {ch.subject === 'physics' ? 'Phy' : ch.subject === 'chemistry' ? 'Chem' : ch.subject === 'higher_math' ? 'Math' : 'Bio'} {ch.paper}
                    </span>
                    <span className="text-slate-300 font-normal">•</span>
                    <span className="text-slate-700 font-medium">{ch.nameBn}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'tracker' && (
          <ChapterTable
            chapters={chapters}
            activeSubject={activeSubject}
            activePaper={activePaper}
            onUpdateChapter={handleUpdateChapter}
            onBatchUpdate={handleUpdateAllChapters}
          />
        )}

        {activeTab === 'charts' && (
          <ProgressCharts
            chapters={chapters}
            activeSubject={activeSubject}
            activePaper={activePaper}
          />
        )}

        {activeTab === 'countdowns' && (
          <CountdownWidget
            exams={exams}
            onAddExam={handleAddExam}
            onDeleteExam={handleDeleteExam}
            onTogglePin={handleTogglePin}
            onResetDefaults={handleResetDefaultExams}
          />
        )}
      </main>

      {/* Sync Manager Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleSignIn}
        chapters={chapters}
        onUpdateAllChapters={handleUpdateAllChapters}
        syncMeta={syncMeta}
        onUpdateSyncMeta={handleUpdateSyncMeta}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">
              Track The Journey
            </span>
          </div>
          <div>
            <span>Cloud-synchronized with Google Sheets & Drive</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
