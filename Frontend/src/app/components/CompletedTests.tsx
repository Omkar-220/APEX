import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle2, AlertCircle, Clock, Users, TrendingUp,
  ChevronRight, Loader2, Search, Shield,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { getCompletedSessions, CompletedSessionDto } from '../services/apiService';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.70)',
  border: '1px solid rgba(15,76,117,0.12)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 4px 16px rgba(15,76,117,0.08)',
};

const fmtDuration = (secs: number) => {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CompletedTests: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<CompletedSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCompletedSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  // Group by testTitle
  const grouped = sessions
    .filter(s =>
      s.testTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.candidateDisplayName.toLowerCase().includes(search.toLowerCase()) ||
      s.candidateEmail.toLowerCase().includes(search.toLowerCase()) ||
      (s.batchName ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .reduce<Record<string, CompletedSessionDto[]>>((acc, s) => {
      const key = `${s.testId}::${s.testTitle}`;
      (acc[key] ??= []).push(s);
      return acc;
    }, {});

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: '#0F4C75' }}>Completed Tests</h1>
            <p className="text-sm" style={{ color: '#636E72' }}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} completed across all batches
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(15,76,117,0.12)', boxShadow: '0 2px 8px rgba(15,76,117,0.06)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#636E72' }} />
          <input type="text" placeholder="Search by test, candidate or batch..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#2D3436' }} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B9AAA' }} />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(15,76,117,0.08)' }}>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(15,76,117,0.2)' }} />
            <p style={{ color: '#636E72' }}>No completed sessions yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([key, testSessions]) => {
              const testTitle = key.split('::')[1];
              const avgPct = Math.round(testSessions.reduce((a, s) => a + Number(s.percentage), 0) / testSessions.length);
              const passCount = testSessions.filter(s => s.passed).length;
              const batchName = testSessions[0].batchName;

              return (
                <div key={key}>
                  {/* Test group header */}
                  <div className="rounded-2xl p-5 mb-3" style={card}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base mb-1" style={{ color: '#0F4C75' }}>{testTitle}</h2>
                        <div className="flex items-center gap-4 text-xs" style={{ color: '#636E72' }}>
                          {batchName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{batchName}</span>}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{testSessions.length} candidates</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg" style={{ color: '#0F4C75' }}>{avgPct}%</div>
                          <div className="text-xs" style={{ color: '#636E72' }}>Avg score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg" style={{ color: '#22c55e' }}>{passCount}/{testSessions.length}</div>
                          <div className="text-xs" style={{ color: '#636E72' }}>Passed</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Candidate rows */}
                  <div className="space-y-2">
                    {testSessions.map(s => {
                      const pct = Number(s.percentage);
                      const scoreColor = pct >= 80 ? '#22c55e' : pct >= 60 ? '#E8B960' : '#E07A5F';
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
                              <div className="text-sm" style={{ color: '#0F4C75' }}>{s.candidateDisplayName}</div>
                              <div className="text-xs truncate" style={{ color: '#636E72' }}>{s.candidateEmail}</div>
                            </div>

                            {/* Score */}
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg" style={{ color: scoreColor }}>{pct}%</div>
                              <div className="text-xs" style={{ color: '#636E72' }}>{s.score}/{s.totalQuestions}</div>
                            </div>

                            {/* Pass/Fail */}
                            <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1"
                              style={{
                                background: s.passed ? 'rgba(34,197,94,0.1)' : 'rgba(224,122,95,0.1)',
                                color: s.passed ? '#22c55e' : '#E07A5F',
                                border: `1px solid ${s.passed ? 'rgba(34,197,94,0.25)' : 'rgba(224,122,95,0.25)'}`,
                              }}>
                              {s.passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {s.passed ? 'Passed' : 'Failed'}
                            </span>

                            {/* Violations */}
                            {s.violationCount > 0 && (
                              <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
                                style={{ background: 'rgba(232,185,96,0.12)', color: '#E8B960', border: '1px solid rgba(232,185,96,0.25)' }}>
                                <Shield className="w-3 h-3" />{s.violationCount}
                              </span>
                            )}

                            {/* Duration */}
                            <div className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: '#636E72' }}>
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
    </DashboardLayout>
  );
};

export default CompletedTests;
