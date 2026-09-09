import React, { useMemo, useState } from 'react';
import { ChapterProgress, SubjectId, PaperId } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, TrendingUp, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProgressChartsProps {
  chapters: ChapterProgress[];
  activeSubject: SubjectId;
  activePaper: PaperId;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  chapters,
  activeSubject,
  activePaper,
}) => {
  const [chartMode, setChartMode] = useState<'current_paper' | 'all_papers'>('current_paper');

  // Filter chapters for current paper
  const currentPaperChapters = useMemo(() => {
    return chapters.filter(
      (c) => c.subject === activeSubject && c.paper === activePaper
    );
  }, [chapters, activeSubject, activePaper]);

  // Data for current paper bar chart
  const currentPaperChartData = useMemo(() => {
    return currentPaperChapters.map((ch) => ({
      name: `Ch ${ch.chapterNumber}`,
      fullName: ch.nameBn,
      nameEn: ch.nameEn,
      'Exam 1': ch.exam1 !== null ? ch.exam1 : 0,
      'Exam 2': ch.exam2 !== null ? ch.exam2 : 0,
      'Exam 3': ch.exam3 !== null ? ch.exam3 : 0,
      'Average': ch.average !== null ? ch.average : 0,
    }));
  }, [currentPaperChapters]);

  // Statistics for all papers
  const paperStats = useMemo(() => {
    const papers: { key: string; name: string; chapters: ChapterProgress[] }[] = [
      { key: 'phy-1', name: 'Phy 1st', chapters: chapters.filter((c) => c.subject === 'physics' && c.paper === '1st') },
      { key: 'phy-2', name: 'Phy 2nd', chapters: chapters.filter((c) => c.subject === 'physics' && c.paper === '2nd') },
      { key: 'chem-1', name: 'Chem 1st', chapters: chapters.filter((c) => c.subject === 'chemistry' && c.paper === '1st') },
      { key: 'chem-2', name: 'Chem 2nd', chapters: chapters.filter((c) => c.subject === 'chemistry' && c.paper === '2nd') },
      { key: 'math-1', name: 'Math 1st', chapters: chapters.filter((c) => c.subject === 'higher_math' && c.paper === '1st') },
      { key: 'math-2', name: 'Math 2nd', chapters: chapters.filter((c) => c.subject === 'higher_math' && c.paper === '2nd') },
      { key: 'bio-1', name: 'Bio 1st', chapters: chapters.filter((c) => c.subject === 'biology' && c.paper === '1st') },
      { key: 'bio-2', name: 'Bio 2nd', chapters: chapters.filter((c) => c.subject === 'biology' && c.paper === '2nd') },
    ];

    return papers.map((p) => {
      const total = p.chapters.length;
      const completed = p.chapters.filter((c) => (c.average !== null && c.average >= 75) || c.status === 'completed').length;
      const scored = p.chapters.filter((c) => c.average !== null);
      const avg =
        scored.length > 0
          ? Math.round((scored.reduce((acc, c) => acc + (c.average || 0), 0) / scored.length) * 10) / 10
          : 0;

      return {
        name: p.name,
        total,
        completed,
        completionRate: Math.round((completed / total) * 100),
        averageScore: avg,
      };
    });
  }, [chapters]);

  // Overall Strengths and Weaknesses
  const scoredAllChapters = useMemo(() => {
    return chapters.filter((c) => c.average !== null);
  }, [chapters]);

  const topChapters = useMemo(() => {
    return [...scoredAllChapters]
      .sort((a, b) => (b.average || 0) - (a.average || 0))
      .slice(0, 3);
  }, [scoredAllChapters]);

  const weakChapters = useMemo(() => {
    return [...scoredAllChapters]
      .filter((c) => (c.average || 0) < 75)
      .sort((a, b) => (a.average || 0) - (b.average || 0))
      .slice(0, 3);
  }, [scoredAllChapters]);

  const getSubjectPaperLabel = (subj: SubjectId, paper: PaperId) => {
    switch (subj) {
      case 'physics': return `Physics ${paper} Paper`;
      case 'chemistry': return `Chemistry ${paper} Paper`;
      case 'higher_math': return `Higher Math ${paper} Paper`;
      case 'biology': return `Biology ${paper} Paper`;
    }
  };

  const paperLabel = getSubjectPaperLabel(activeSubject, activePaper);

  return (
    <div className="space-y-6">
      {/* Top Controls: Switch between Active Paper and Multi-Paper Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Visual Progress & Performance Analytics</h2>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            id="chart-mode-paper"
            onClick={() => setChartMode('current_paper')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              chartMode === 'current_paper'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {paperLabel} Scores
          </button>
          <button
            id="chart-mode-all"
            onClick={() => setChartMode('all_papers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              chartMode === 'all_papers'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 8 Papers Comparison
          </button>
        </div>
      </div>

      {/* Main Chart Section */}
      {chartMode === 'current_paper' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {paperLabel} - Chapter Exam Comparison (%)
              </h3>
              <p className="text-xs text-slate-500">
                Exam-1, Exam-2, Exam-3 and Chapter Average Scores (0–100%)
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentPaperChartData}
                margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = currentPaperChartData.find((d) => d.name === label);
                      return (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-lg text-xs">
                          <p className="font-bold text-slate-900">{item?.fullName}</p>
                          <p className="text-slate-500 text-[11px] mb-2">{item?.nameEn}</p>
                          {payload.map((p, idx) => (
                            <div key={idx} className="flex justify-between gap-4 py-0.5">
                              <span style={{ color: p.color }} className="font-medium">
                                {p.name}:
                              </span>
                              <span className="font-bold text-slate-800">
                                {p.value ? `${p.value}%` : 'Not tested'}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar dataKey="Exam 1" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="Exam 2" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="Exam 3" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="Average" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Cross-Paper Performance & Preparation Overview
              </h3>
              <p className="text-xs text-slate-500">
                Average Exam Score and Syllabus Completion % across Physics 1st, 2nd & Math 1st, 2nd
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paperStats} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar
                  dataKey="averageScore"
                  name="Average Score (%)"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="completionRate"
                  name="Chapters Completed (%)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tutor Action Guidance: Strengths vs Areas Needing Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Strengths */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-700 mb-3">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Top Performing Chapters (Strengths)</h3>
          </div>
          {topChapters.length === 0 ? (
            <p className="text-xs text-slate-400">Enter exam marks to highlight strengths.</p>
          ) : (
            <div className="space-y-2">
              {topChapters.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{ch.nameBn}</span>
                    <span className="text-[11px] text-slate-500">
                      {ch.subject === 'physics' ? 'Physics' : 'Higher Math'} {ch.paper} Paper
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-700 bg-white px-2 py-1 rounded shadow-2xs border border-emerald-200">
                    {ch.average}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Chapters Needing Attention */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-rose-700 mb-3">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Target for Revision (Score &lt; 75%)</h3>
          </div>
          {weakChapters.length === 0 ? (
            <p className="text-xs text-slate-400">No weak chapters flagged! Excellent tutoring progress.</p>
          ) : (
            <div className="space-y-2">
              {weakChapters.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{ch.nameBn}</span>
                    <span className="text-[11px] text-slate-500">
                      {ch.subject === 'physics' ? 'Physics' : 'Higher Math'} {ch.paper} Paper
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-rose-700 bg-white px-2 py-1 rounded shadow-2xs border border-rose-200">
                    {ch.average}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
