import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { getAdminSessions, AdminSessionDto } from '../services/apiService';
import DashboardLayout from './DashboardLayout';

const statusConfig = {
  Active:    { label: 'In Progress', color: '#1B9AAA', bg: 'rgba(27,154,170,0.12)',  border: 'rgba(27,154,170,0.25)',  Icon: Clock },
  Completed: { label: 'Completed',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   Icon: CheckCircle2 },
  Expired:   { label: 'Expired',     color: '#E07A5F', bg: 'rgba(224,122,95,0.12)',  border: 'rgba(224,122,95,0.25)',  Icon: XCircle },
} as const;

const TestStatusDetail: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AdminSessionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;
    getAdminSessions(testId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [testId]);

  const completed = sessions.filter(s => s.status === 'Completed').length;
  const active    = sessions.filter(s => s.status === 'Active').length;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#636E72' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0F4C75')}
          onMouseLeave={e => (e.currentTarget.style.color = '#636E72')}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header card */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(15,76,117,0.12)',
            backdropFilter: 'blur(16px)', boxShadow: '0 4px 16px rgba(15,76,117,0.08)' }}>
          <h1 className="text-xl mb-1" style={{ color: '#0F4C75' }}>Test Session Monitor</h1>
          <p className="text-xs mb-5" style={{ color: '#636E72' }}>Test ID: {testId}</p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Sessions', value: sessions.length },
              { label: 'Completed',      value: completed },
              { label: 'In Progress',    value: active },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(15,76,117,0.05)', border: '1px solid rgba(15,76,117,0.1)' }}>
                <div className="text-2xl mb-0.5" style={{ color: '#0F4C75' }}>{value}</div>
                <div className="text-xs" style={{ color: '#636E72' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(15,76,117,0.12)',
            backdropFilter: 'blur(16px)', boxShadow: '0 4px 16px rgba(15,76,117,0.08)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(15,76,117,0.08)' }}>
            <h2 className="text-sm" style={{ color: '#0F4C75' }}>Candidate Sessions</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B9AAA' }} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(15,76,117,0.2)' }} />
              <p className="text-sm" style={{ color: '#636E72' }}>No sessions found for this test</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(15,76,117,0.08)' }}>
                    {['Candidate', 'Status', 'Score', 'Started At'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs" style={{ color: '#636E72' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const sc = statusConfig[s.status as keyof typeof statusConfig] ?? statusConfig.Expired;
                    return (
                      <tr key={s.sessionId} style={{ borderBottom: '1px solid rgba(15,76,117,0.05)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,76,117,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-6 py-4 text-sm" style={{ color: '#2D3436' }}>{s.candidateEmail}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            <sc.Icon className="w-3 h-3" />{sc.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#2D3436' }}>
                          {s.score != null ? `${s.score}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-xs" style={{ color: '#636E72' }}>
                          {new Date(s.startTime).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestStatusDetail;
