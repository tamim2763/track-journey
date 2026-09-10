import React, { useState, useMemo } from 'react';
import { ChapterProgress, ChapterStatus, SubjectId, PaperId, ExamDetails } from '../types';
import { calculateChapterAverage } from '../services/initialData';
import { ExamScoreModal } from './ExamScoreModal';
import { 
  Search, 
  Star, 
  AlertTriangle, 
  X
} from 'lucide-react';

interface ChapterTableProps {
  chapters: ChapterProgress[];
  activeSubject: SubjectId;
  activePaper: PaperId;
  onUpdateChapter: (updated: ChapterProgress) => void;
  onBatchUpdate?: (updatedList: ChapterProgress[]) => void;
}

export const ChapterTable: React.FC<ChapterTableProps> = ({
  chapters,
  activeSubject,
  activePaper,
  onUpdateChapter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'current_week' | 'completed' | 'weak'>('all');
  const [selectedExamModal, setSelectedExamModal] = useState<{
    chapter: ChapterProgress;
    examField: 'exam1' | 'exam2' | 'exam3';
  } | null>(null);

  // Filter for active subject and paper
  const currentPaperChapters = useMemo(() => {
    return chapters.filter(
      (c) => c.subject === activeSubject && c.paper === activePaper
    );
  }, [chapters, activeSubject, activePaper]);

  // Filtered by search and status
  const displayedChapters = useMemo(() => {
    return currentPaperChapters.filter((ch) => {
      const matchesSearch =
        ch.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.nameEn.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'current_week') return ch.isCurrentWeek;
      if (statusFilter === 'completed') return ch.average !== null && ch.average >= 75;
      if (statusFilter === 'weak') return ch.average !== null && ch.average < 75;

      return true;
    });
  }, [currentPaperChapters, searchQuery, statusFilter]);

  // Statistics for this paper
  const stats = useMemo(() => {
    const total = currentPaperChapters.length;
    const completed = currentPaperChapters.filter((c) => c.average !== null && c.average >= 75).length;
    const currentWeekCount = currentPaperChapters.filter((c) => c.isCurrentWeek).length;
    
    // Subject Progress: sum of averages of all chapters (not graded counts as 0%) divided by total chapters
    const totalChaptersAverageSum = currentPaperChapters.reduce(
      (acc, c) => acc + (c.average !== null ? c.average : 0),
      0
    );
    const subjectProgress =
      total > 0
        ? Math.round((totalChaptersAverageSum / total) * 10) / 10
        : 0;

    return { total, completed, currentWeekCount, subjectProgress };
  }, [currentPaperChapters]);

  const handleSaveExamScore = (
    chapterId: string,
    examField: 'exam1' | 'exam2' | 'exam3',
    score: number | null,
    details: ExamDetails | null
  ) => {
    const targetChapter = chapters.find((c) => c.id === chapterId);
    if (!targetChapter) return;

    const detailKey = `${examField}Details` as 'exam1Details' | 'exam2Details' | 'exam3Details';
    const nextChapter: ChapterProgress = {
      ...targetChapter,
      [examField]: score,
      [detailKey]: details,
    };

    // Calculate average: If at least 1 exam taken, average of all 3 exams (ungraded counted as 0). Otherwise null (Not Graded).
    const hasTakenAtLeastOne =
      nextChapter.exam1 !== null || nextChapter.exam2 !== null || nextChapter.exam3 !== null;

    nextChapter.average = calculateChapterAverage(
      nextChapter.exam1,
      nextChapter.exam2,
      nextChapter.exam3
    );

    // Automatic status progression based on >= 75% target:
    if (nextChapter.average !== null && nextChapter.average >= 75) {
      nextChapter.status = 'completed';
    } else if (nextChapter.average !== null && nextChapter.average < 75 && nextChapter.status === 'completed') {
      nextChapter.status = 'in_progress';
    } else if (hasTakenAtLeastOne && nextChapter.status === 'not_started') {
      nextChapter.status = 'in_progress';
    }

    nextChapter.lastUpdated = new Date().toISOString();
    onUpdateChapter(nextChapter);
  };

  const handleToggleCurrentWeek = (chapter: ChapterProgress) => {
    onUpdateChapter({
      ...chapter,
      isCurrentWeek: !chapter.isCurrentWeek,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleStatusChange = (chapter: ChapterProgress, status: ChapterStatus) => {
    onUpdateChapter({
      ...chapter,
      status,
      lastUpdated: new Date().toISOString(),
    });
  };

  const getScoreColorClass = (score: number | null) => {
    if (score === null) return 'text-slate-400 bg-slate-100 border-slate-200';
    if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold';
    if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200 font-semibold';
    if (score >= 45) return 'text-amber-700 bg-amber-50 border-amber-200 font-semibold';
    return 'text-rose-700 bg-rose-50 border-rose-200 font-semibold';
  };

  const getSubjectPaperTitles = (subj: SubjectId, paper: PaperId) => {
    switch (subj) {
      case 'physics':
        return {
          en: `Physics ${paper} Paper`,
          bn: `পদার্থবিজ্ঞান ${paper === '1st' ? '১ম' : '২য়'} পত্র`,
        };
      case 'chemistry':
        return {
          en: `Chemistry ${paper} Paper`,
          bn: `রসায়ন ${paper === '1st' ? '১ম' : '২য়'} পত্র`,
        };
      case 'higher_math':
        return {
          en: `Higher Mathematics ${paper} Paper`,
          bn: `উচ্চতর গণিত ${paper === '1st' ? '১ম' : '২য়'} পত্র`,
        };
      case 'biology':
        return {
          en: `Biology ${paper} Paper`,
          bn: `জীববিজ্ঞান ${paper === '1st' ? '১ম' : '২য়'} পত্র`,
        };
    }
  };

  const { en: englishTitle, bn: bengaliTitle } = getSubjectPaperTitles(activeSubject, activePaper);

  return (
    <div className="space-y-6">
      {/* Title & Quick Performance Stats Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{englishTitle}</h2>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">{bengaliTitle}</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Chapters</span>
              <p className="text-lg font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Completed</span>
              <p className="text-lg font-bold text-emerald-700">
                {stats.completed} <span className="text-xs text-emerald-600 font-normal">/ {stats.total}</span>
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">Current Week</span>
              <p className="text-lg font-bold text-amber-700">{stats.currentWeekCount} Active</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">Subject Progress</span>
              <p className="text-lg font-bold text-indigo-700">
                {stats.subjectProgress}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="chapter-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapter (বাংলা or English) or notes..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            id="filter-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({currentPaperChapters.length})
          </button>
          <button
            id="filter-current-week"
            onClick={() => setStatusFilter('current_week')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'current_week'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Current Week ({stats.currentWeekCount})</span>
          </button>
          <button
            id="filter-completed"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Completed ({stats.completed})
          </button>
          <button
            id="filter-weak"
            onClick={() => setStatusFilter('weak')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'weak'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Needs Focus (&lt; 75%)</span>
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">Week</th>
                <th className="py-3.5 px-4 min-w-[220px]">Chapter</th>
                <th className="py-3.5 px-3 w-28 text-center">Exam-1</th>
                <th className="py-3.5 px-3 w-28 text-center">Exam-2</th>
                <th className="py-3.5 px-3 w-28 text-center">Exam-3</th>
                <th className="py-3.5 px-3 w-32 text-center">Average (%)</th>
                <th className="py-3.5 px-3 w-32 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedChapters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No chapters match the selected filter.
                  </td>
                </tr>
              ) : (
                displayedChapters.map((ch) => {
                  const isCurrent = ch.isCurrentWeek;
                  return (
                    <tr
                      key={ch.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrent ? 'bg-amber-50/40 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      {/* Current Week Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`current-week-toggle-${ch.id}`}
                          onClick={() => handleToggleCurrentWeek(ch)}
                          title={isCurrent ? 'Current target this week (click to remove)' : 'Mark as active this week'}
                          className={`p-1.5 rounded-md transition ${
                            isCurrent
                              ? 'text-amber-500 bg-amber-100 hover:bg-amber-200'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${isCurrent ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Chapter Names (Bangla + English) */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {ch.nameBn}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{ch.nameEn}</div>
                        {isCurrent && (
                          <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Current Week Active
                          </span>
                        )}
                      </td>

                      {/* Exam 1 */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          id={`btn-exam1-${ch.id}`}
                          type="button"
                          onClick={() => setSelectedExamModal({ chapter: ch, examField: 'exam1' })}
                          className={`w-22 py-1.5 px-2 rounded-lg border text-center transition cursor-pointer group ${
                            ch.exam1 !== null
                              ? 'bg-white hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-300 shadow-2xs'
                              : 'bg-slate-50/70 hover:bg-slate-100 border-dashed border-slate-300 hover:border-slate-400'
                          }`}
                          title="Click to enter Exam-1 score (Obtained / Out of)"
                        >
                          {ch.exam1 !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                                {ch.exam1}%
                              </span>
                              {ch.exam1Details && (
                                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                  {ch.exam1Details.obtained}/{ch.exam1Details.outOf}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-medium">
                              —
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Exam 2 */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          id={`btn-exam2-${ch.id}`}
                          type="button"
                          onClick={() => setSelectedExamModal({ chapter: ch, examField: 'exam2' })}
                          className={`w-22 py-1.5 px-2 rounded-lg border text-center transition cursor-pointer group ${
                            ch.exam2 !== null
                              ? 'bg-white hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-300 shadow-2xs'
                              : 'bg-slate-50/70 hover:bg-slate-100 border-dashed border-slate-300 hover:border-slate-400'
                          }`}
                          title="Click to enter Exam-2 score (Obtained / Out of)"
                        >
                          {ch.exam2 !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                                {ch.exam2}%
                              </span>
                              {ch.exam2Details && (
                                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                  {ch.exam2Details.obtained}/{ch.exam2Details.outOf}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-medium">
                              —
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Exam 3 */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          id={`btn-exam3-${ch.id}`}
                          type="button"
                          onClick={() => setSelectedExamModal({ chapter: ch, examField: 'exam3' })}
                          className={`w-22 py-1.5 px-2 rounded-lg border text-center transition cursor-pointer group ${
                            ch.exam3 !== null
                              ? 'bg-white hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-300 shadow-2xs'
                              : 'bg-slate-50/70 hover:bg-slate-100 border-dashed border-slate-300 hover:border-slate-400'
                          }`}
                          title="Click to enter Exam-3 score (Obtained / Out of)"
                        >
                          {ch.exam3 !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                                {ch.exam3}%
                              </span>
                              {ch.exam3Details && (
                                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                  {ch.exam3Details.obtained}/{ch.exam3Details.outOf}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-medium">
                              —
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Average (%) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs border ${getScoreColorClass(
                              ch.average
                            )}`}
                            title={
                              ch.average !== null
                                ? ch.average >= 75
                                  ? 'Expected Target achieved (≥ 75%) — চ্যাপ্টারের প্রস্তুতি কমপ্লিট!'
                                  : 'Target is ≥ 75%'
                                : 'Not graded'
                            }
                          >
                            <span>{ch.average !== null ? `${ch.average}%` : 'Not graded'}</span>
                            {ch.average !== null && ch.average >= 75 && (
                              <span className="text-emerald-600 font-black text-[10px]">✓</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          id={`select-status-${ch.id}`}
                          value={ch.status}
                          onChange={(e) => handleStatusChange(ch, e.target.value as ChapterStatus)}
                          className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="revision">Revision</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE / TABLET CARD VIEW */}
      <div className="block lg:hidden space-y-3">
        {displayedChapters.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            No chapters match the selected filter.
          </div>
        ) : (
          displayedChapters.map((ch) => {
            const isCurrent = ch.isCurrentWeek;
            return (
              <div
                key={ch.id}
                className={`bg-white rounded-xl border p-4 shadow-xs transition ${
                  isCurrent ? 'border-amber-400 ring-2 ring-amber-200/50 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                {/* Header: Name and Current Week Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Ch {ch.chapterNumber}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Active Target This Week
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{ch.nameBn}</h3>
                    <p className="text-xs text-slate-500">{ch.nameEn}</p>
                  </div>

                  <button
                    id={`mobile-current-week-${ch.id}`}
                    onClick={() => handleToggleCurrentWeek(ch)}
                    className={`p-2 rounded-lg border transition ${
                      isCurrent
                        ? 'bg-amber-100 text-amber-700 border-amber-300'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isCurrent ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Exam Inputs Grid */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  {(['exam1', 'exam2', 'exam3'] as const).map((field, idx) => {
                    const score = ch[field];
                    const detailKey = `${field}Details` as 'exam1Details' | 'exam2Details' | 'exam3Details';
                    const details = ch[detailKey];
                    return (
                      <button
                        key={field}
                        type="button"
                        onClick={() => setSelectedExamModal({ chapter: ch, examField: field })}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          score !== null
                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-2xs'
                            : 'bg-slate-50 border-dashed border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                          Exam-{idx + 1}
                        </span>
                        {score !== null ? (
                          <div>
                            <span className="text-sm font-bold text-slate-900">{score}%</span>
                            {details && (
                              <span className="block text-[10px] text-slate-400 font-medium">
                                {details.obtained}/{details.outOf}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 font-medium">—</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Score Average */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-medium">Average:</span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs border ${getScoreColorClass(ch.average)}`}>
                      <span>{ch.average !== null ? `${ch.average}%` : 'Not graded'}</span>
                      {ch.average !== null && ch.average >= 75 && (
                        <span className="text-emerald-600 font-black text-[10px]">✓</span>
                      )}
                    </span>
                  </div>
                  {ch.average !== null && ch.average >= 75 && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Target Met (≥75%)
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Exam Score Entry Popup Modal */}
      {selectedExamModal && (
        <ExamScoreModal
          isOpen={!!selectedExamModal}
          chapter={
            chapters.find((c) => c.id === selectedExamModal.chapter.id) || selectedExamModal.chapter
          }
          examField={selectedExamModal.examField}
          onClose={() => setSelectedExamModal(null)}
          onSave={handleSaveExamScore}
        />
      )}
    </div>
  );
};
