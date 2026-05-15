import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, Clock, Users, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { getAssignments, AdminAssignmentDto } from '../services/apiService';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(15,76,117,0.2)',
  color: '#2D3436',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.70)',
  border: '1px solid rgba(15,76,117,0.12)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 4px 16px rgba(15,76,117,0.08)',
};

const UpcomingTestManager: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<AdminAssignmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    getAssignments()
      .then(list => {
        const found = list.find(a => a.testId === testId && a.status === 'Pending') ?? list.find(a => a.testId === testId) ?? null;
        setAssignment(found);
        if (found) {
          const d = new Date(found.scheduledStart);
          setScheduledDate(d.toISOString().split('T')[0]);
          setScheduledTime(d.toISOString().split('T')[1].substring(0, 5));
        }
      })
      .catch(() => setAssignment(null))
      .finally(() => setLoading(false));
  }, [testId]);

  const handlePostpone = () => {
    if (!scheduledDate || !scheduledTime) { toast.error('Please select both date and time'); return; }
    toast.success('Schedule updated', {
      description: `New schedule: ${new Date(scheduledDate + 'T' + scheduledTime).toLocaleString()}`,
    });
  };

  const handleCancel = () => {
    if (confirm('Cancel this test? This cannot be undone.')) {
      toast.success('Test cancelled');
      setTimeout(() => navigate('/admin/dashboard'), 1200);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B9AAA' }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(15,76,117,0.25)' }} />
          <h2 className="text-xl mb-3" style={{ color: '#0F4C75' }}>Assignment Not Found</h2>
          <button onClick={() => navigate('/admin/dashboard')} className="text-sm" style={{ color: '#1B9AAA' }}>
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

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

        <div className="mb-6">
          <h1 className="text-xl mb-1" style={{ color: '#0F4C75' }}>Manage Upcoming Test</h1>
          <p className="text-sm" style={{ color: '#636E72' }}>{assignment.testTitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: controls */}
          <div className="lg:col-span-2 space-y-5">

            {/* Reschedule */}
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-sm mb-4 flex items-center gap-2" style={{ color: '#0F4C75' }}>
                <Calendar className="w-4 h-4" /> Reschedule Test
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>New Date</label>
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>New Time</label>
                  <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <button onClick={handlePostpone}
                className="w-full py-2.5 rounded-xl text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(27,154,170,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                Update Schedule
              </button>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(224,122,95,0.06)', border: '1px solid rgba(224,122,95,0.2)', backdropFilter: 'blur(16px)' }}>
              <h2 className="text-sm mb-2 flex items-center gap-2" style={{ color: '#E07A5F' }}>
                <AlertCircle className="w-4 h-4" /> Danger Zone
              </h2>
              <p className="text-xs mb-4" style={{ color: '#636E72' }}>
                Cancel this test. All candidates will be notified. This cannot be undone.
              </p>
              <button onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #E07A5F, #c96a50)' }}>
                Cancel Test
              </button>
            </div>
          </div>

          {/* Right: info */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="text-sm mb-4" style={{ color: '#0F4C75' }}>Assignment Details</h3>
            <div className="space-y-4 text-xs">
              {[
                { label: 'Test', value: assignment.testTitle },
                { label: 'Batch', value: assignment.batchName ?? assignment.candidateEmail ?? '—', icon: <Users className="w-3 h-3" /> },
                { label: 'Scheduled', value: new Date(assignment.scheduledStart).toLocaleString(), icon: <Calendar className="w-3 h-3" /> },
                { label: 'Deadline', value: new Date(assignment.deadline).toLocaleString() },
                { label: 'Questions', value: `${assignment.questionCount}` },
                { label: 'Max Attempts', value: `${assignment.maxAttempts}` },
                { label: 'Question Bank', value: assignment.questionBatchName, icon: <Clock className="w-3 h-3" /> },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <div className="mb-0.5" style={{ color: '#636E72' }}>{label}</div>
                  <div className="flex items-center gap-1" style={{ color: '#2D3436' }}>{icon}{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UpcomingTestManager;
