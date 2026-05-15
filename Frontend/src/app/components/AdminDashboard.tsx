import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Users, BookOpen, Calendar, Clock, ClipboardCheck,
  ChevronRight, Zap, AlertCircle, PlayCircle, CheckCircle2,
  Circle, ArrowUpRight, LayoutGrid, Loader2, ClipboardList, Shield, RefreshCw,
} from 'lucide-react';
import {
  getQuestionBatches, getBatches, getAssignments, getCompletedSessions,
  QuestionBatchDto, CandidateBatchDto, AdminAssignmentDto, CompletedSessionDto,
} from '../services/apiService';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../context/AuthContext';

// ── Theme tokens ──────────────────────────────────────────────────────────────
const T = {
  navy:   '#0F4C75',
  teal:   '#1B9AAA',
  gold:   '#E8B960',
  coral:  '#E07A5F',
  text:   '#2D3436',
  muted:  '#636E72',
  card:   'rgba(255,255,255,0.70)',
  cardHover: 'rgba(255,255,255,0.88)',
  border: 'rgba(15,76,117,0.12)',
  shadow: '0 4px 16px rgba(15,76,117,0.08)',
  shadowHover: '0 8px 24px rgba(15,76,117,0.14)',
};

const statusConfig = {
  Pending:   { label: 'Pending',   color: T.navy,  bg: 'rgba(15,76,117,0.12)',  border: 'rgba(15,76,117,0.2)',  Icon: Circle },
  Active:    { label: 'Active',    color: T.teal,  bg: 'rgba(27,154,170,0.12)', border: 'rgba(27,154,170,0.2)', Icon: PlayCircle },
  Completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.2)', Icon: CheckCircle2 },
  Expired:   { label: 'Expired',   color: T.coral, bg: 'rgba(224,122,95,0.12)', border: 'rgba(224,122,95,0.2)', Icon: Circle },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode; value: string | number; label: string;
  gradient: string; glow: string; badge?: string; onClick?: () => void;
}> = ({ icon, value, label, gradient, glow, badge, onClick }) => (
  <div
    className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200"
    style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: 'blur(16px)',
      cursor: onClick ? 'pointer' : 'default', boxShadow: T.shadow }}
    onClick={onClick}
    onMouseEnter={e => { if (onClick) { const el = e.currentTarget as HTMLElement; el.style.background = T.cardHover; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = T.shadowHover; } }}
    onMouseLeave={e => { if (onClick) { const el = e.currentTarget as HTMLElement; el.style.background = T.card; el.style.transform = 'translateY(0)'; el.style.boxShadow = T.shadow; } }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: gradient, boxShadow: `0 4px 12px ${glow}` }}>
        {icon}
      </div>
      {badge && (
        <span className="text-xs px-2 py-1 rounded-full"
          style={{ background: 'rgba(27,154,170,0.1)', color: T.teal, border: '1px solid rgba(27,154,170,0.2)' }}>
          {badge}
        </span>
      )}
    </div>
    <div className="text-2xl mb-0.5" style={{ color: T.navy }}>{value}</div>
    <div className="text-xs" style={{ color: T.muted }}>{label}</div>
  </div>
);

function useHover(ref: React.RefObject<HTMLElement>) {
  const enter = () => { if (ref.current) { ref.current.style.background = T.cardHover; ref.current.style.transform = 'translateY(-1px)'; ref.current.style.boxShadow = T.shadowHover; } };
  const leave = () => { if (ref.current) { ref.current.style.background = T.card; ref.current.style.transform = 'translateY(0)'; ref.current.style.boxShadow = T.shadow; } };
  return { onMouseEnter: enter, onMouseLeave: leave };
}

// ── Main component ────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'assignments' | 'upcoming' | 'overview' | 'completed'>('assignments');

  const [questionBatches, setQuestionBatches] = useState<QuestionBatchDto[]>([]);
  const [candidateBatches, setCandidateBatches] = useState<CandidateBatchDto[]>([]);
  const [assignments, setAssignments] = useState<AdminAssignmentDto[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true); else setRefreshing(true);
    try {
      const [qb, cb, asgn, completed] = await Promise.all([
        getQuestionBatches(), getBatches(), getAssignments(), getCompletedSessions(),
      ]);
      setQuestionBatches(qb);
      setCandidateBatches(cb);
      setAssignments(asgn);
      setCompletedSessions(completed);
    } catch {
      // silently ignore — stale data stays visible
    } finally {
      if (isInitial) setLoading(false); else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    // Auto-refresh every 30s to pick up session completions
    const interval = setInterval(() => fetchData(false), 30_000);
    return () => clearInterval(interval);
  }, []);

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const upcomingAssignments = assignments.filter(a => a.status === 'Pending');
  const activeAssignments  = assignments.filter(a => a.status === 'Active');

  const tabs = [
    { id: 'assignments', label: 'Assignments & Status', icon: LayoutGrid },
    { id: 'upcoming',    label: 'Upcoming Tests',       icon: Clock,         count: upcomingAssignments.length },
    { id: 'completed',   label: 'Completed Tests',      icon: ClipboardList, count: completedSessions.length },
    { id: 'overview',    label: 'Batch Overview',       icon: Users },
  ] as const;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: isSuperAdmin
                  ? `linear-gradient(135deg, ${T.gold}, #d4a843)`
                  : `linear-gradient(135deg, ${T.navy}, ${T.teal})` }}>
                {isSuperAdmin ? '👑' : '⚙️'}
              </div>
              <h1 style={{ fontSize: '1.4rem', color: T.navy }}>
                {isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard
              </h1>
            </div>
            <p className="text-xs pl-1" style={{ color: T.muted }}>
              {isSuperAdmin ? 'Full platform control & oversight' : 'Manage your assigned batches & tests'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${T.border}`,
                color: refreshing ? T.muted : T.navy, cursor: refreshing ? 'not-allowed' : 'pointer' }}
              title="Refresh dashboard data">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => navigate('/admin/create-test')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition-all duration-200"
              style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.teal})`,
                boxShadow: '0 0 20px rgba(27,154,170,0.3)', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 0 30px rgba(27,154,170,0.5)'; el.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 0 20px rgba(27,154,170,0.3)'; el.style.transform = 'translateY(0)'; }}
            >
              <Plus className="w-4 h-4" /> Assign New Test
            </button>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.teal }} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<BookOpen className="w-5 h-5 text-white" />}
                value={questionBatches.length} label="Question Banks"
                gradient={`linear-gradient(135deg, ${T.navy}, ${T.teal})`} glow="rgba(27,154,170,0.4)"
                onClick={() => navigate('/admin/questions')} />
              <StatCard icon={<Users className="w-5 h-5 text-white" />}
                value={candidateBatches.length} label="Candidate Batches"
                gradient={`linear-gradient(135deg, ${T.teal}, #0e7a87)`} glow="rgba(27,154,170,0.4)"
                onClick={() => navigate('/admin/batches')} />
              <StatCard icon={<Clock className="w-5 h-5 text-white" />}
                value={upcomingAssignments.length} label="Upcoming Tests"
                gradient={`linear-gradient(135deg, ${T.navy}, #0a3a5c)`} glow="rgba(15,76,117,0.4)"
                badge={activeAssignments.length > 0 ? `${activeAssignments.length} live` : undefined}
                onClick={() => setSelectedTab('upcoming')} />
              <StatCard icon={<ClipboardCheck className="w-5 h-5 text-white" />}
                value={assignments.length} label="Total Assignments"
                gradient={`linear-gradient(135deg, ${T.gold}, #d4a843)`} glow="rgba(232,185,96,0.4)"
                onClick={() => setSelectedTab('assignments')} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto w-fit"
              style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${T.border}`,
                boxShadow: '0 2px 8px rgba(15,76,117,0.06)' }}>
              {tabs.map(tab => {
                const active = selectedTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200"
                    style={{ background: active ? 'rgba(15,76,117,0.12)' : 'transparent',
                      color: active ? T.navy : T.muted,
                      border: active ? `1px solid rgba(15,76,117,0.2)` : '1px solid transparent' }}>
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {'count' in tab && (tab as any).count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: active ? 'rgba(15,76,117,0.15)' : 'rgba(15,76,117,0.08)',
                          color: active ? T.navy : T.muted }}>
                        {(tab as any).count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── ASSIGNMENTS & STATUS ── */}
            {selectedTab === 'assignments' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ color: T.navy, fontSize: '1.1rem' }}>All Test Assignments</h2>
                  <span className="text-xs" style={{ color: T.muted }}>{assignments.length} total</span>
                </div>

                {assignments.length === 0 ? (
                  <EmptyState message="No assignments yet" />
                ) : assignments.map(a => {
                  const sc = statusConfig[a.status as keyof typeof statusConfig] ?? statusConfig.Pending;
                  return (
                    <AssignmentRow key={a.assignmentId} assignment={a} sc={sc}
                      onClick={() => navigate(`/admin/test-status/${a.testId}`)} />
                  );
                })}
              </div>
            )}

            {/* ── UPCOMING TESTS ── */}
            {selectedTab === 'upcoming' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ color: T.navy, fontSize: '1.1rem' }}>Scheduled Tests</h2>
                  <span className="text-xs" style={{ color: T.muted }}>{upcomingAssignments.length} upcoming</span>
                </div>

                {upcomingAssignments.length === 0 ? (
                  <EmptyState message="No upcoming tests" />
                ) : upcomingAssignments.map(a => (
                  <UpcomingRow key={a.assignmentId} assignment={a}
                    onClick={() => navigate(`/admin/upcoming-test/${a.testId}`)} />
                ))}
              </div>
            )}

            {/* ── COMPLETED TESTS ── */}
            {selectedTab === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ color: T.navy, fontSize: '1.1rem' }}>Completed Test Sessions</h2>
                  <span className="text-xs" style={{ color: T.muted }}>{completedSessions.length} total</span>
                </div>

                {completedSessions.length === 0 ? (
                  <EmptyState message="No completed sessions yet" />
                ) : (
                  <div className="space-y-6">
                    {Object.entries(
                      completedSessions.reduce<Record<string, CompletedSessionDto[]>>((acc, s) => {
                        const key = `${s.testId}::${s.testTitle}`;
                        (acc[key] ??= []).push(s);
                        return acc;
                      }, {})
                    ).map(([key, testSessions]) => {
                      const testTitle = key.split('::')[1];
                      const avgPct = Math.round(testSessions.reduce((a, s) => a + Number(s.percentage), 0) / testSessions.length);
                      const passCount = testSessions.filter(s => s.passed).length;
                      const batchName = testSessions[0].batchName;

                      return (
                        <div key={key}>
                          {/* Test group header */}
                          <div className="rounded-2xl p-5 mb-3" style={cardStyle}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <h3 className="text-base mb-1" style={{ color: T.navy }}>{testTitle}</h3>
                                <div className="flex items-center gap-4 text-xs" style={{ color: T.muted }}>
                                  {batchName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{batchName}</span>}
                                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{testSessions.length} candidates</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-lg" style={{ color: T.navy }}>{avgPct}%</div>
                                  <div className="text-xs" style={{ color: T.muted }}>Avg score</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg" style={{ color: '#22c55e' }}>{passCount}/{testSessions.length}</div>
                                  <div className="text-xs" style={{ color: T.muted }}>Passed</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Candidate rows */}
                          <div className="space-y-2">
                            {testSessions.map(s => {
                              const pct = Number(s.percentage);
                              const scoreColor = pct >= 80 ? '#22c55e' : pct >= 60 ? T.gold : T.coral;
                              return (
                                <div key={s.sessionId}
                                  onClick={() => navigate(`/admin/scorecard/${s.sessionId}`)}
                                  className="rounded-2xl px-5 py-4 cursor-pointer transition-all duration-200"
                                  style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(15,76,117,0.1)', backdropFilter: 'blur(12px)' }}
                                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.9)'; el.style.transform = 'translateX(4px)'; }}
                                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.65)'; el.style.transform = 'translateX(0)'; }}>
                                  <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white flex-shrink-0"
                                      style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}>
                                      {s.candidateDisplayName.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Name + email */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm" style={{ color: T.navy }}>{s.candidateDisplayName}</div>
                                      <div className="text-xs truncate" style={{ color: T.muted }}>{s.candidateEmail}</div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-lg" style={{ color: scoreColor }}>{pct}%</div>
                                      <div className="text-xs" style={{ color: T.muted }}>{s.score}/{s.totalQuestions}</div>
                                    </div>

                                    {/* Pass/Fail */}
                                    <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1"
                                      style={{
                                        background: s.passed ? 'rgba(34,197,94,0.1)' : 'rgba(224,122,95,0.1)',
                                        color: s.passed ? '#22c55e' : T.coral,
                                        border: `1px solid ${s.passed ? 'rgba(34,197,94,0.25)' : 'rgba(224,122,95,0.25)'}`,
                                      }}>
                                      {s.passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                      {s.passed ? 'Passed' : 'Failed'}
                                    </span>

                                    {/* Violations */}
                                    {s.violationCount > 0 && (
                                      <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
                                        style={{ background: 'rgba(232,185,96,0.12)', color: T.gold, border: '1px solid rgba(232,185,96,0.25)' }}>
                                        <Shield className="w-3 h-3" />{s.violationCount}
                                      </span>
                                    )}

                                    {/* Duration */}
                                    <div className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: T.muted }}>
                                      <Clock className="w-3 h-3" />{fmtDuration(s.durationSeconds)}
                                    </div>

                                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(15,76,117,0.3)' }} />
                                  </div>

                                  {/* Score bar */}
                                  <div className="mt-3 h-1 rounded-full ml-13" style={{ background: 'rgba(15,76,117,0.08)', marginLeft: '52px' }}>
                                    <div className="h-full rounded-full transition-all duration-700"
                                      style={{ width: `${pct}%`, background: scoreColor }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── BATCH OVERVIEW ── */}
            {selectedTab === 'overview' && (
              <div className="space-y-8">
                {/* Question Banks */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 style={{ color: T.navy, fontSize: '1.1rem' }}>Question Banks</h2>
                    <ActionButton onClick={() => navigate('/admin/questions/create')} label="Create New" />
                  </div>
                  {questionBatches.length === 0 ? <EmptyState message="No question banks yet" /> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {questionBatches.map(batch => (
                        <QuestionBatchCard key={batch.questionBatchId} batch={batch}
                          onClick={() => navigate(`/admin/questions/${batch.questionBatchId}`)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Candidate Batches */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 style={{ color: T.navy, fontSize: '1.1rem' }}>Candidate Batches</h2>
                    <ActionButton onClick={() => navigate('/admin/batch/new')} label="Create New" />
                  </div>
                  {candidateBatches.length === 0 ? <EmptyState message="No candidate batches yet" /> : (
                    <div className="space-y-3">
                      {candidateBatches.map(batch => (
                        <CandidateBatchRow key={batch.batchId} batch={batch}
                          onClick={() => navigate(`/admin/batch/${batch.batchId}`)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// ── Row / Card sub-components ─────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`,
  backdropFilter: 'blur(12px)', boxShadow: T.shadow,
};

const AssignmentRow: React.FC<{
  assignment: AdminAssignmentDto;
  sc: typeof statusConfig[keyof typeof statusConfig];
  onClick: () => void;
}> = ({ assignment: a, sc, onClick }) => (
  <div onClick={onClick} className="rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-200"
    style={cardStyle}
    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = T.cardHover; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = T.shadowHover; }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = T.card; el.style.transform = 'translateY(0)'; el.style.boxShadow = T.shadow; }}>
    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: T.teal }} />
    <div className="pl-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-sm" style={{ color: T.navy }}>{a.testTitle}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
              <sc.Icon className="w-3 h-3" />{sc.label}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <InfoCell label="Batch" value={a.batchName ?? a.candidateEmail ?? '—'} />
            <InfoCell label="Scheduled" value={fmtDate(a.scheduledStart)} />
            <InfoCell label="Question Bank" value={a.questionBatchName} />
            <InfoCell label="Deadline" value={fmtDate(a.deadline)} />
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: T.muted }} />
      </div>
    </div>
  </div>
);

const UpcomingRow: React.FC<{ assignment: AdminAssignmentDto; onClick: () => void }> = ({ assignment: a, onClick }) => {
  const scheduledDate = new Date(a.scheduledStart);
  const daysUntil = Math.ceil((scheduledDate.getTime() - Date.now()) / 86_400_000);
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200" style={cardStyle}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: T.navy }} />
      <div className="pl-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="text-sm" style={{ color: T.navy }}>{a.testTitle}</h3>
            {daysUntil <= 3 && daysUntil >= 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(224,122,95,0.12)', color: T.coral, border: '1px solid rgba(224,122,95,0.25)' }}>
                <Zap className="w-3 h-3" /> Soon
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <InfoCell label="Batch" value={a.batchName ?? a.candidateEmail ?? '—'} icon={<Users className="w-3 h-3" />} />
            <InfoCell label="Date & Time" value={fmtDate(a.scheduledStart)} icon={<Calendar className="w-3 h-3" />} />
            <InfoCell label="Questions" value={`${a.questionCount}`} icon={<BookOpen className="w-3 h-3" />} />
            <InfoCell label="Max Attempts" value={`${a.maxAttempts}`} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-center px-3 py-2 rounded-xl"
            style={{ background: 'rgba(15,76,117,0.08)', border: `1px solid rgba(15,76,117,0.15)` }}>
            <div className="text-xl leading-none" style={{ color: T.navy }}>{Math.max(0, daysUntil)}</div>
            <div className="text-xs mt-0.5" style={{ color: T.muted }}>days</div>
          </div>
          <button onClick={onClick}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white transition-all duration-200"
            style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.teal})`, boxShadow: '0 0 16px rgba(27,154,170,0.25)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(27,154,170,0.45)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(27,154,170,0.25)'; }}>
            Manage <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionBatchCard: React.FC<{ batch: QuestionBatchDto; onClick: () => void }> = ({ batch, onClick }) => (
  <div onClick={onClick} className="rounded-2xl p-5 cursor-pointer transition-all duration-200" style={cardStyle}
    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = T.cardHover; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = T.shadowHover; }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = T.card; el.style.transform = 'translateY(0)'; el.style.boxShadow = T.shadow; }}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(27,154,170,0.12)', border: '1px solid rgba(27,154,170,0.25)' }}>
        <BookOpen className="w-4 h-4" style={{ color: T.teal }} />
      </div>
      {batch.difficulty && (
        <span className="text-xs px-2 py-0.5 rounded-full capitalize"
          style={{ background: 'rgba(15,76,117,0.08)', color: T.navy, border: `1px solid rgba(15,76,117,0.15)` }}>
          {batch.difficulty}
        </span>
      )}
    </div>
    <h3 className="text-sm mb-1" style={{ color: T.navy }}>{batch.name}</h3>
    <p className="text-xs mb-3" style={{ color: T.muted }}>
      {[batch.domain, batch.topic].filter(Boolean).join(' · ') || 'No domain set'}
    </p>
    <div className="flex items-center justify-between text-xs" style={{ color: T.muted }}>
      <span>{batch.questionCount} questions</span>
      <span>{new Date(batch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    </div>
  </div>
);

const CandidateBatchRow: React.FC<{ batch: CandidateBatchDto; onClick: () => void }> = ({ batch, onClick }) => (
  <div className="rounded-2xl p-5 transition-all duration-200" style={cardStyle}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-sm mb-2" style={{ color: T.navy }}>{batch.name}</h3>
        <div className="flex items-center gap-5 text-xs" style={{ color: T.muted }}>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{batch.candidateCount} candidates</span>
          {batch.domain && <span>{batch.domain}</span>}
          <span>Created {new Date(batch.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <button onClick={onClick}
        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all duration-200"
        style={{ background: 'rgba(15,76,117,0.08)', color: T.navy, border: `1px solid rgba(15,76,117,0.15)` }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.15)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.08)'; }}>
        Manage <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const InfoCell: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div>
    <div className="mb-0.5" style={{ color: T.muted }}>{label}</div>
    <div className="flex items-center gap-1" style={{ color: T.text }}>{icon}{value}</div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-2xl p-12 text-center"
    style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${T.border}` }}>
    <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(15,76,117,0.2)' }} />
    <p style={{ color: T.muted }}>{message}</p>
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
    style={{ background: 'rgba(27,154,170,0.1)', color: T.teal, border: '1px solid rgba(27,154,170,0.2)' }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(27,154,170,0.2)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(27,154,170,0.1)'; }}>
    <Plus className="w-4 h-4" />{label}
  </button>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
}

export default AdminDashboard;
