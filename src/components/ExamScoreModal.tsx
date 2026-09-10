import React, { useState, useEffect } from 'react';
import { ChapterProgress, ExamDetails } from '../types';
import { calculateChapterAverage } from '../services/initialData';
import { X, Calculator, Check, RotateCcw, AlertCircle, CheckCircle2, Target } from 'lucide-react';

interface ExamScoreModalProps {
  isOpen: boolean;
  chapter: ChapterProgress | null;
  examField: 'exam1' | 'exam2' | 'exam3' | null;
  onClose: () => void;
  onSave: (
    chapterId: string,
    examField: 'exam1' | 'exam2' | 'exam3',
    score: number | null,
    details: ExamDetails | null
  ) => void;
}

export const ExamScoreModal: React.FC<ExamScoreModalProps> = ({
  isOpen,
  chapter,
  examField,
  onClose,
  onSave,
}) => {
  const [obtainedStr, setObtainedStr] = useState<string>('');
  const [outOfStr, setOutOfStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && chapter && examField) {
      setErrorMsg(null);
      const detailKey = `${examField}Details` as 'exam1Details' | 'exam2Details' | 'exam3Details';
      const existingDetails = chapter[detailKey];
      const existingScore = chapter[examField];

      if (existingDetails && typeof existingDetails.obtained === 'number' && typeof existingDetails.outOf === 'number') {
        setObtainedStr(existingDetails.obtained.toString());
        setOutOfStr(existingDetails.outOf.toString());
      } else if (existingScore !== null && existingScore !== undefined) {
        setObtainedStr(existingScore.toString());
        setOutOfStr('100');
      } else {
        setObtainedStr('');
        setOutOfStr('');
      }
    }
  }, [isOpen, chapter, examField]);

  if (!isOpen || !chapter || !examField) return null;

  const examLabel = examField === 'exam1' ? 'Exam-1' : examField === 'exam2' ? 'Exam-2' : 'Exam-3';

  // Compute percentage in real-time
  const obtainedNum = parseFloat(obtainedStr);
  const outOfNum = parseFloat(outOfStr);

  const isValidObtained = !isNaN(obtainedNum) && obtainedNum >= 0;
  const isValidOutOf = !isNaN(outOfNum) && outOfNum > 0;

  let calculatedPercentage: number | null = null;
  let isOverMax = false;

  if (isValidObtained && isValidOutOf) {
    calculatedPercentage = Math.round(((obtainedNum / outOfNum) * 100) * 10) / 10;
    if (obtainedNum > outOfNum) {
      isOverMax = true;
    }
  }

  const projectedAverage = calculatedPercentage !== null
    ? calculateChapterAverage(
        examField === 'exam1' ? calculatedPercentage : chapter.exam1,
        examField === 'exam2' ? calculatedPercentage : chapter.exam2,
        examField === 'exam3' ? calculatedPercentage : chapter.exam3
      )
    : null;

  const handleSave = () => {
    // If both empty, clear the score
    if (obtainedStr.trim() === '' && outOfStr.trim() === '') {
      onSave(chapter.id, examField, null, null);
      onClose();
      return;
    }

    if (!isValidObtained) {
      setErrorMsg('Please enter a valid obtained mark (≥ 0).');
      return;
    }

    if (!isValidOutOf) {
      setErrorMsg('Please enter a valid total mark ("Out of" must be > 0).');
      return;
    }

    if (calculatedPercentage === null) {
      setErrorMsg('Unable to calculate percentage score.');
      return;
    }

    const details: ExamDetails = {
      obtained: Math.round(obtainedNum * 10) / 10,
      outOf: Math.round(outOfNum * 10) / 10,
    };

    onSave(chapter.id, examField, calculatedPercentage, details);
    onClose();
  };

  const handleClear = () => {
    onSave(chapter.id, examField, null, null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                {examLabel} Marks Entry
              </span>
              <span className="text-xs text-slate-400">Chapter {chapter.chapterNumber}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-snug">
              {chapter.nameBn}
            </h3>
            <p className="text-xs text-slate-500">{chapter.nameEn}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calculation Rule / Guide */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold mb-1">
            <Calculator className="w-3.5 h-3.5" />
            <span>কনভার্ট নিয়ম (১০০% স্কেলিং):</span>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
              Score = (Obtained / Out of) × 100%
            </span>
          </p>
          <p className="text-slate-500 mt-1 text-[11px]">
            যেমন: ৩৫ এর মধ্যে ২৩ পেলে = (২৩ ÷ ৩৫) × ১০০ = <strong>৬৫.৭%</strong>
          </p>
        </div>

        {/* Form Inputs */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Obtained Marks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Obtained marks: <span className="text-indigo-600 font-normal">(প্রাপ্ত নম্বর)</span>
              </label>
              <input
                id="exam-obtained-input"
                type="number"
                step="0.5"
                min="0"
                autoFocus
                placeholder="e.g. 23"
                value={obtainedStr}
                onChange={(e) => {
                  setObtainedStr(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* Out of Marks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Out of: <span className="text-indigo-600 font-normal">(মোট নম্বর)</span>
              </label>
              <input
                id="exam-outof-input"
                type="number"
                step="0.5"
                min="1"
                placeholder="e.g. 35"
                value={outOfStr}
                onChange={(e) => {
                  setOutOfStr(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isOverMax && !errorMsg && (
            <div className="flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Obtained marks exceed total marks ({obtainedNum} &gt; {outOfNum}).</span>
            </div>
          )}

          {/* Converted Preview Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              calculatedPercentage !== null
                ? calculatedPercentage >= 75
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-indigo-50/60 border-indigo-200'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Converted Exam Score (১০০% স্কেল)
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span
                    className={`text-2xl font-black ${
                      calculatedPercentage !== null
                        ? calculatedPercentage >= 75
                          ? 'text-emerald-700'
                          : calculatedPercentage >= 60
                          ? 'text-indigo-700'
                          : 'text-amber-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {calculatedPercentage !== null ? `${calculatedPercentage}%` : '— %'}
                  </span>
                  {calculatedPercentage !== null && (
                    <span className="text-xs font-medium text-slate-500">
                      ({obtainedNum} / {outOfNum})
                    </span>
                  )}
                </div>
              </div>

              {calculatedPercentage !== null && (
                <div className="text-right">
                  {calculatedPercentage >= 75 ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Target Met (≥ 75%)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      <Target className="w-3.5 h-3.5" />
                      <span>Target: ≥ 75%</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {calculatedPercentage !== null && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Projected Chapter Average:</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {projectedAverage !== null ? `${projectedAverage}%` : 'Not graded'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  (৩টি পরীক্ষার গড়: বাকি পরীক্ষা না দেওয়া পর্যন্ত সেগুলো ০% হিসেবে গণনা করা হবে)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {(chapter[examField] !== null || chapter[`${examField}Details` as 'exam1Details' | 'exam2Details' | 'exam3Details']) && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center space-x-1 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Score</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              id="save-exam-score-btn"
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              <Check className="w-4 h-4" />
              <span>Save Score</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
