import React, { useState, useEffect } from 'react';
import { AdmissionExam } from '../types';
import { Clock, Plus, Trash2, Calendar, MapPin, Sparkles, Pin, RotateCcw } from 'lucide-react';

interface CountdownWidgetProps {
  exams: AdmissionExam[];
  onAddExam: (exam: AdmissionExam) => void;
  onDeleteExam: (id: string) => void;
  onTogglePin: (id: string) => void;
  onResetDefaults?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalHours: number;
}

function calculateTimeRemaining(targetDate: string): TimeRemaining {
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));

  return { days, hours, minutes, seconds, isPast: false, totalHours };
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({
  exams,
  onAddExam,
  onDeleteExam,
  onTogglePin,
  onResetDefaults,
}) => {
  const [, setTick] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state for adding custom exam
  const [examName, setExamName] = useState('');
  const [examNameBn, setExamNameBn] = useState('');
  const [examCategory, setExamCategory] = useState<AdmissionExam['category']>('engineering');
  const [examDate, setExamDate] = useState('2026-11-20T10:00');
  const [examVenue, setExamVenue] = useState('');

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) return;

    const newExam: AdmissionExam = {
      id: `custom-exam-${Date.now()}`,
      name: examName.trim(),
      nameBn: examNameBn.trim() || undefined,
      shortName: examName.slice(0, 10),
      category: examCategory,
      targetDate: new Date(examDate).toISOString(),
      venue: examVenue.trim() || undefined,
      isPinned: false,
    };

    onAddExam(newExam);
    setExamName('');
    setExamNameBn('');
    setExamVenue('');
    setIsModalOpen(false);
  };

  // Filter out any exam whose timer has reached 0:0:0:0 (diff <= 0) so they automatically disappear
  const activeExams = exams.filter((exam) => {
    const target = new Date(exam.targetDate).getTime();
    return target > Date.now();
  });

  const sortedExams = [...activeExams].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  const getCategoryBadge = (cat: AdmissionExam['category']) => {
    switch (cat) {
      case 'engineering':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'university':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medical':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'model_test':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">University Admission Exam Countdowns</h2>
          </div>
        </div>

        <button
          id="add-custom-exam-button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Target / Coaching Test</span>
        </button>
      </div>

      {/* Grid of Countdowns or Empty State */}
      {sortedExams.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center shadow-xs">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No active admission countdowns</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            All timers have reached 0:0:0:0 or all countdown cards were removed. You can add a new target exam or coaching test countdown anytime.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              id="empty-state-add-exam-btn"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Target Exam</span>
            </button>
            {onResetDefaults && (
              <button
                id="empty-state-restore-exams-btn"
                onClick={onResetDefaults}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restore Default Exams</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedExams.map((exam) => {
            const timeLeft = calculateTimeRemaining(exam.targetDate);
            const formattedDate = new Date(exam.targetDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = new Date(exam.targetDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition relative flex flex-col justify-between ${
                  exam.isPinned ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top badges, pin and delete */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${getCategoryBadge(
                        exam.category
                      )}`}
                    >
                      {exam.category}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        id={`pin-exam-${exam.id}`}
                        onClick={() => onTogglePin(exam.id)}
                        title={exam.isPinned ? 'Unpin' : 'Pin to top'}
                        className={`p-1 rounded hover:bg-slate-100 ${
                          exam.isPinned ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-exam-${exam.id}`}
                        onClick={() => onDeleteExam(exam.id)}
                        title="Delete countdown"
                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Exam Title */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{exam.name}</h3>
                  {exam.nameBn && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{exam.nameBn}</p>
                  )}

                  {/* Venue & Date info */}
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {formattedDate} at {formattedTime}
                      </span>
                    </div>
                    {exam.venue && (
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{exam.venue}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Countdown Numbers Grid */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  {timeLeft.isPast ? (
                    <div className="bg-slate-100 text-slate-500 rounded-lg py-2.5 text-center text-xs font-semibold">
                      Exam Completed
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-4 gap-1 text-center">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                          <span className="text-xl font-extrabold text-slate-900 block leading-tight">
                            {timeLeft.days}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Days
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                          <span className="text-xl font-extrabold text-slate-900 block leading-tight">
                            {String(timeLeft.hours).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Hours
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                          <span className="text-xl font-extrabold text-slate-900 block leading-tight">
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Mins
                          </span>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                          <span className="text-xl font-extrabold text-indigo-600 block leading-tight">
                            {String(timeLeft.seconds).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                            Secs
                          </span>
                        </div>
                      </div>

                      {/* Urgency indication */}
                      <div className="mt-2 text-center">
                        {timeLeft.days <= 14 ? (
                          <span className="inline-block text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            🔥 Final Sprint: Only {timeLeft.days} days remaining!
                          </span>
                        ) : timeLeft.days <= 45 ? (
                          <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            ⚡ Revision phase ({timeLeft.days} days left)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Approx {Math.round(timeLeft.days / 7)} weeks for syllabus & question bank mastery
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Target Exam / Coaching Test</h3>
            <p className="text-xs text-slate-500 mb-4">
              Set a countdown for an upcoming coaching exam (e.g. Udvash Model Test), college pre-test, or admission test.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Name (English)*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Udvash Physics Weekly Model Test 04"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Name (বাংলা - optional)</label>
                <input
                  type="text"
                  placeholder="e.g. উদ্ভাস উইকলি পরীক্ষা ০৪"
                  value={examNameBn}
                  onChange={(e) => setExamNameBn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={examCategory}
                    onChange={(e) => setExamCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="engineering">Engineering</option>
                    <option value="university">Varsity Science</option>
                    <option value="medical">Medical</option>
                    <option value="model_test">Weekly Model Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time*</label>
                  <input
                    type="datetime-local"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Syllabus Scope (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Farmgate Branch / Chapters: Vectors & Dynamics"
                  value={examVenue}
                  onChange={(e) => setExamVenue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Save Countdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
