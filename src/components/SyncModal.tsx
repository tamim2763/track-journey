import React, { useState, useEffect } from 'react';
import { SyncMetadata, ChapterProgress } from '../types';
import { User } from 'firebase/auth';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  PlusCircle, 
  X,
  Search,
  FolderOpen
} from 'lucide-react';
import { 
  createProgressSpreadsheet, 
  syncAllChaptersToSpreadsheet, 
  pullFromSpreadsheet,
  findExistingSheets,
  SheetSearchItem
} from '../services/googleSheets';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  chapters: ChapterProgress[];
  onUpdateAllChapters: (updated: ChapterProgress[]) => void;
  syncMeta: SyncMetadata;
  onUpdateSyncMeta: (meta: Partial<SyncMetadata>) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onSignIn,
  chapters,
  onUpdateAllChapters,
  syncMeta,
  onUpdateSyncMeta,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [existingSheets, setExistingSheets] = useState<SheetSearchItem[]>([]);
  const [manualIdInput, setManualIdInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      onSignIn();
      return;
    }

    try {
      setIsCreating(true);
      setStatusMessage({ type: 'info', text: 'Creating spreadsheet in your Google Drive...' });
      onUpdateSyncMeta({ isSyncing: true });

      const res = await createProgressSpreadsheet(accessToken, chapters);

      onUpdateSyncMeta({
        spreadsheetId: res.id,
        spreadsheetName: 'Track The Journey - Academic & Admission Progress Tracker',
        spreadsheetUrl: res.url,
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        error: null,
      });

      setStatusMessage({
        type: 'success',
        text: 'Successfully created and synchronized your Google Spreadsheet!',
      });
    } catch (err: any) {
      console.error(err);
      onUpdateSyncMeta({ isSyncing: false, error: err.message });
      setStatusMessage({
        type: 'error',
        text: `Error creating spreadsheet: ${err.message}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSearchDrive = async () => {
    if (!accessToken) {
      onSignIn();
      return;
    }
    try {
      setIsSearching(true);
      const items = await findExistingSheets(accessToken);
      setExistingSheets(items);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to search Drive: ${err.message}` });
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnectExistingSheet = async (sheetId: string, sheetTitle?: string) => {
    if (!accessToken) {
      onSignIn();
      return;
    }
    try {
      onUpdateSyncMeta({ isSyncing: true });
      setStatusMessage({ type: 'info', text: 'Connecting and pulling data from spreadsheet...' });

      const updated = await pullFromSpreadsheet(accessToken, sheetId, chapters);
      onUpdateAllChapters(updated);

      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      onUpdateSyncMeta({
        spreadsheetId: sheetId,
        spreadsheetName: sheetTitle || 'Connected Spreadsheet',
        spreadsheetUrl: sheetUrl,
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        error: null,
      });

      setStatusMessage({ type: 'success', text: 'Connected and synchronized with Google Sheets!' });
    } catch (err: any) {
      onUpdateSyncMeta({ isSyncing: false, error: err.message });
      setStatusMessage({ type: 'error', text: `Failed to connect sheet: ${err.message}` });
    }
  };

  const handleManualConnect = () => {
    if (!manualIdInput.trim()) return;
    let extractedId = manualIdInput.trim();
    // Support pasting full Google Sheets URL
    const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }
    handleConnectExistingSheet(extractedId, 'Linked Google Sheet');
  };

  const handlePushToSheets = async () => {
    if (!syncMeta.spreadsheetId) return;
    if (!accessToken) {
      onSignIn();
      return;
    }
    try {
      onUpdateSyncMeta({ isSyncing: true });
      setStatusMessage({ type: 'info', text: 'Pushing latest marks & progress to Google Sheets...' });

      await syncAllChaptersToSpreadsheet(accessToken, syncMeta.spreadsheetId, chapters);

      onUpdateSyncMeta({
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        error: null,
      });

      setStatusMessage({ type: 'success', text: 'All papers synced to Google Sheets successfully!' });
    } catch (err: any) {
      onUpdateSyncMeta({ isSyncing: false, error: err.message });
      setStatusMessage({ type: 'error', text: `Sync failed: ${err.message}` });
    }
  };

  const handlePullFromSheets = async () => {
    if (!syncMeta.spreadsheetId) return;
    if (!accessToken) {
      onSignIn();
      return;
    }
    try {
      onUpdateSyncMeta({ isSyncing: true });
      setStatusMessage({ type: 'info', text: 'Pulling latest scores from Google Sheets...' });

      const updated = await pullFromSpreadsheet(accessToken, syncMeta.spreadsheetId, chapters);
      onUpdateAllChapters(updated);

      onUpdateSyncMeta({
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        error: null,
      });

      setStatusMessage({ type: 'success', text: 'Updated local progress from Google Sheets!' });
    } catch (err: any) {
      onUpdateSyncMeta({ isSyncing: false, error: err.message });
      setStatusMessage({ type: 'error', text: `Pull failed: ${err.message}` });
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Subject,Paper,Chapter,Exam-1,Exam-2,Exam-3,Average (%),Current Week,Status,Notes\n' +
      chapters
        .map((c) =>
          [
            c.subject,
            c.paper,
            `"${c.nameBn.replace(/"/g, '""')}"`,
            c.exam1 !== null ? c.exam1 : '',
            c.exam2 !== null ? c.exam2 : '',
            c.exam3 !== null ? c.exam3 : '',
            c.average !== null ? c.average : '',
            c.isCurrentWeek ? 'TRUE' : 'FALSE',
            c.status,
            `"${(c.notes || '').replace(/"/g, '""')}"`,
          ].join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HSC_Tracker_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Google Sheets & Cloud Sync</h3>
              <p className="text-xs text-slate-500">
                Real-time synchronization across devices via your Google Drive & Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-indigo-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* User Connection Status */}
        <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {user.displayName || 'Connected Account'}
                    </span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Not connected to Google</span>
                  <span className="text-xs text-slate-500">Sign in to enable real-time Google Sheets sync</span>
                </div>
              )}
            </div>

            {!user ? (
              <button
                onClick={onSignIn}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Sign in with Google
              </button>
            ) : !accessToken ? (
              <button
                onClick={onSignIn}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                Authorize Sheets
              </button>
            ) : null}
          </div>
        </div>

        {/* Sync Controls if User is Signed in */}
        {user && (
          <div className="mt-5 space-y-4">
            {/* If spreadsheet connected */}
            {syncMeta.spreadsheetId ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Active Spreadsheet Connected
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      {syncMeta.spreadsheetName || 'HSC Admission Progress Tracker'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Last synchronized:{' '}
                      {syncMeta.lastSyncedAt
                        ? new Date(syncMeta.lastSyncedAt).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>

                  {syncMeta.spreadsheetUrl && (
                    <a
                      href={syncMeta.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs"
                    >
                      <span>Open in Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Push and Pull Actions */}
                <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-wrap gap-2">
                  <button
                    onClick={handlePushToSheets}
                    disabled={syncMeta.isSyncing}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncMeta.isSyncing ? 'animate-spin' : ''}`} />
                    <span>Push Local to Sheets</span>
                  </button>

                  <button
                    onClick={handlePullFromSheets}
                    disabled={syncMeta.isSyncing}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pull from Sheets</span>
                  </button>
                </div>
              </div>
            ) : (
              /* If no spreadsheet connected yet */
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
                  <h4 className="font-bold text-slate-900 text-sm">Create Google Sheets Tracker</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Automatically creates a new Google Spreadsheet in your Google Drive with 8 tabs for all 8 papers (Physics, Chemistry, Higher Math, Biology), formatted exactly matching your syllabus.
                  </p>
                  <button
                    onClick={handleCreateNewSheet}
                    disabled={isCreating}
                    className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isCreating ? 'Creating in Drive...' : 'Create in Google Drive'}</span>
                  </button>
                </div>

                {/* Or connect existing */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Or Link Existing Google Sheet
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Google Sheets URL or Spreadsheet ID..."
                      value={manualIdInput}
                      onChange={(e) => setManualIdInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={handleManualConnect}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      Connect
                    </button>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={handleSearchDrive}
                      disabled={isSearching}
                      className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{isSearching ? 'Browsing Drive...' : 'Browse My Google Drive Files'}</span>
                    </button>

                    {existingSheets.length > 0 && (
                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto border border-slate-100 rounded-lg p-1.5">
                        {existingSheets.map((sh) => (
                          <div
                            key={sh.id}
                            onClick={() => handleConnectExistingSheet(sh.id, sh.name)}
                            className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer text-xs"
                          >
                            <span className="font-medium text-slate-800 truncate max-w-[280px]">
                              {sh.name}
                            </span>
                            <span className="text-[11px] text-indigo-600 font-semibold">Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offline Backup Export */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Local Device Backup:</span>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
