export type SubjectId = 'physics' | 'chemistry' | 'higher_math' | 'biology';
export type PaperId = '1st' | '2nd';

export type ChapterStatus = 'not_started' | 'in_progress' | 'completed' | 'revision';

export interface ExamDetails {
  obtained: number;
  outOf: number;
}

export interface ChapterProgress {
  id: string;
  subject: SubjectId;
  paper: PaperId;
  chapterNumber: number;
  nameBn: string;
  nameEn: string;
  exam1: number | null;
  exam2: number | null;
  exam3: number | null;
  exam1Details?: ExamDetails | null;
  exam2Details?: ExamDetails | null;
  exam3Details?: ExamDetails | null;
  average: number | null;
  isCurrentWeek: boolean;
  status: ChapterStatus;
  theoryDone: boolean;
  practiceDone: boolean;
  mcqDone: boolean;
  questionBankDone: boolean;
  notes: string;
  lastUpdated?: string;
}

export interface AdmissionExam {
  id: string;
  name: string;
  nameBn?: string;
  shortName: string;
  targetDate: string; // ISO string e.g. "2026-11-15T09:00:00"
  category: 'engineering' | 'university' | 'medical' | 'model_test' | 'other';
  venue?: string;
  isPinned?: boolean;
}

export interface SyncMetadata {
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
  autoSync: boolean;
}
