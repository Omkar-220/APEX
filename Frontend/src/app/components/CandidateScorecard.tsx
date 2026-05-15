import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock,
  Shield, Users, BookOpen, TrendingUp, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { getSessionScorecard, SessionScorecardDto, ScorecardAnswerDto } from '../services/apiService';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.70)',
  border: '1px solid rgba(15,76,117,0.12)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 4px 16px rgba(15,76,117,0.08)',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtDuration = (secs: number) => {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
};

const violationLabels: Record<string, string> = {
  focus_lost:        'Window lost focus',
  multi_tab_opened:  'Tab switched',
  fullscreen_exit:   'Exited fullscreen',
  exam_finalized:    'Exam finalized',
};

// ── Question card ─────────────────────────────────────────────────────────────

const QuestionRow: React.FC<{ q: ScorecardAnswerDto; index: number }> = ({ q, index }) => {
  const [expanded, setExpanded] = useState(false);
  const optionLabels = ['A', 'B', 'C', 'D'] as const;
  const optionTexts: Record<string, string> = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD };
  const unanswered = q.selectedOption === null;

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ border: `1px solid ${q.isCorrect ? 'rgba(34,197,94,0.2)' : unanswered ? 'rgba(15,76,117,0.12)' : 'rgba(224,122,95,0.2)'}` }}>
      {/* Row header */}
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: q.isCorrect ? 'rgba(34,197,94,0.05)' : unanswered ? 'rgba(15,76,117,0.03)' : 'rgba(224,122,95,0.05)' }}
        onClick={() => setExpanded(v => !v)}>
        {/* Status icon */}
        <div className="flex-shrink-0">
          {unanswered
            ? <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'rgba(15,76,117,0.2)' }} />
            : q.isCorrect
            ? <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
            : <XCircle className="w-5 h-5" style={{ color: '#E07A5F' }} />}
        </div>

        <span className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded"
          style={{ background: 'rgba(15,76,117,0.08)', color: '#0F4C75' }}>Q{index + 1}</span>

        <p className="text-sm flex-1 text-left line-clamp-1" style={{ color: '#2D3436' }}>{q.content}</p>

        <div className="flex items-center gap-3 flex-shrink-0">
          {q.weightage > 1 && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(232,185,96,0.12)', color: '#E8B960', border: '1px solid rgba(232,185,96,0.2)' }}>
              {q.weightage}pts
            </span>
          )}
          <span className="text-xs" style={{ color: unanswered ? '#636E72' : q.isCorrect ? '#22c55e' : '#E07A5F' }}>
            {unanswered ? 'Not answered' : q.isCorrect ? 'Correct' : 'Incorrect'}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: '#636E72' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#636E72' }} />}
        </div>
      </button>

      {/* Expanded options */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2"
          style={{ background: 'rgba(255,255,255,0.6)' }}>
          {optionLabels.map(label => {
            const text = optionTexts[label];
            const isSelected = q.selectedOption === label;
            const isCorrect  = q.correctOption  === label;
            let bg = 'rgba(255,255,255,0.8)';
            let border = '1px solid rgba(15,76,117,0.08)';
            let color = '#636E72';
            if (isCorrect)  { bg = 'rgba(34,197,94,0.08)';  border = '1px solid rgba(34,197,94,0.3)';  color = '#22c55e'; }
            if (isSelected && !isCorrect) { bg = 'rgba(224,122,95,0.08)'; border = '1px solid rgba(224,122,95,0.3)'; color = '#E07A5F'; }
            return (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: bg, border, color }}>
                <span className="font-semibold w-4 flex-shrink-0">{label}</span>
                <span className="flex-1">{text}</span>
                {isCorrect  && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                {isSelected && !isCorrect && <XCircle className="w-3 h-3 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const CandidateScorecard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionScorecardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    getSessionScorecard(sessionId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B9AAA' }} />
      </div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(15,76,117,0.2)' }} />
        <p style={{ color: '#636E72' }}>Scorecard not found</p>
      </div>
    </DashboardLayout>
  );

  const pct = Number(data.percentage);
  const scoreColor = pct >= 80 ? '#22c55e' : pct >= 60 ? '#E8B960' : '#E07A5F';
  const correct   = data.answers.filter(a => a.isCorrect).length;
  const incorrect = data.answers.filter(a => !a.isCorrect && a.selectedOption !== null).length;
  const skipped   = data.answers.filter(a => a.selectedOption === null).length;
  const violations = data.auditEvents.filter(e =>
    ['focus_lost', 'multi_tab_opened', 'fullscreen_exit'].includes(e.eventType));

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/admin/completed-tests')}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#636E72' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0F4C75')}
          onMouseLeave={e => (e.currentTarget.style.color = '#636E72')}>
          <ArrowLeft className="w-4 h-4" /> Back to Completed Tests
        </button>

        {/* ── Hero card ── */}
        <div className="rounded-2xl p-6 mb-5" style={card}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}>
                {data.candidateDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl mb-0.5" style={{ color: '#0F4C75' }}>{data.candidateDisplayName}</h1>
                <p className="text-sm" style={{ color: '#636E72' }}>{data.candidateEmail}</p>
                {data.batchName && (
                  <span className="inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(15,76,117,0.08)', color: '#0F4C75', border: '1px solid rgba(15,76,117,0.15)' }}>
                    <Users className="w-3 h-3" />{data.batchName}
                  </span>
                )}
              </div>
            </div>

            {/* Score circle */}
            <div className="text-center flex-shrink-0">
              <div className="text-4xl font-bold" style={{ color: scoreColor }}>{pct}%</div>
              <div className="text-sm mt-0.5" style={{ color: data.passed ? '#22c55e' : '#E07A5F' }}>
                {data.passed ? '✓ Passed' : '✗ Failed'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#636E72' }}>
                Passing: {Number(data.passingScorePercent)}%
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-5 h-2 rounded-full" style={{ background: 'rgba(15,76,117,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: scoreColor, boxShadow: `0 0 8px ${scoreColor}60` }} />
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { icon: <BookOpen className="w-4 h-4 text-white" />, value: `${data.score}/${data.totalQuestions}`, label: 'Score', grad: 'linear-gradient(135deg, #0F4C75, #1B9AAA)', glow: 'rgba(27,154,170,0.4)' },
            { icon: <CheckCircle2 className="w-4 h-4 text-white" />, value: correct, label: 'Correct', grad: 'linear-gradient(135deg, #22c55e, #16a34a)', glow: 'rgba(34,197,94,0.4)' },
            { icon: <XCircle className="w-4 h-4 text-white" />, value: `${incorrect} wrong, ${skipped} skipped`, label: 'Incorrect / Skipped', grad: 'linear-gradient(135deg, #E07A5F, #c96a50)', glow: 'rgba(224,122,95,0.4)' },
            { icon: <Clock className="w-4 h-4 text-white" />, value: fmtDuration(data.durationSeconds), label: 'Duration', grad: 'linear-gradient(135deg, #E8B960, #d4a843)', glow: 'rgba(232,185,96,0.4)' },
          ].map(({ icon, value, label, grad, glow }) => (
            <div key={label} className="rounded-2xl p-4" style={card}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                style={{ background: grad, boxShadow: `0 4px 12px ${glow}` }}>
                {icon}
              </div>
              <div className="text-base" style={{ color: '#0F4C75' }}>{value}</div>
              <div className="text-xs" style={{ color: '#636E72' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Test info ── */}
        <div className="rounded-2xl p-5 mb-5" style={card}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F4C75' }}>Test Info</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {[
              { label: 'Test', value: data.testTitle },
              { label: 'Started', value: fmtDate(data.startTime) },
              { label: 'Completed', value: fmtDate(data.endTime) },
              { label: 'Session ID', value: data.sessionId.substring(0, 8) + '...' },
              { label: 'Violations', value: `${data.violationCount} recorded` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mb-0.5" style={{ color: '#636E72' }}>{label}</div>
                <div style={{ color: '#2D3436' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Violations ── */}
        {violations.length > 0 && (
          <div className="rounded-2xl p-5 mb-5"
            style={{ ...card, border: '1px solid rgba(232,185,96,0.25)', background: 'rgba(232,185,96,0.05)' }}>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#E8B960' }}>
              <Shield className="w-4 h-4" /> Violations ({violations.length})
            </h2>
            <div className="space-y-2">
              {violations.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(232,185,96,0.08)', border: '1px solid rgba(232,185,96,0.15)' }}>
                  <span style={{ color: '#2D3436' }}>{violationLabels[e.eventType] ?? e.eventType}</span>
                  <span style={{ color: '#636E72' }}>{fmtDate(e.occurredAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Answer breakdown ── */}
        <div className="rounded-2xl p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#0F4C75' }}>
              Answer Breakdown ({data.answers.length} questions)
            </h2>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#636E72' }}>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" style={{ color: '#22c55e' }} />{correct} correct</span>
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3" style={{ color: '#E07A5F' }} />{incorrect} wrong</span>
              {skipped > 0 && <span>{skipped} skipped</span>}
            </div>
          </div>
          <div className="space-y-2">
            {data.answers.map((a, i) => (
              <QuestionRow key={a.questionId} q={a} index={i} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateScorecard;
