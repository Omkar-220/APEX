import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Clock, Users, BookOpen, Send, Loader2, ChevronDown } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';
import {
  getQuestionBatches, getBatches, getAdminUsers, createTest, createAssignment,
  QuestionBatchDto, CandidateBatchDto, CandidateDto,
} from '../services/apiService';

const inputCss: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(15,76,117,0.18)',
  color: '#2D3436',
  outline: 'none',
};

const cardCss: React.CSSProperties = {
  background: 'rgba(255,255,255,0.70)',
  border: '1px solid rgba(15,76,117,0.12)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 4px 16px rgba(15,76,117,0.08)',
};

// Today's date in YYYY-MM-DD for min attribute
const todayDate = () => new Date().toISOString().split('T')[0];
// Current time HH:MM for min attribute on time inputs (only relevant when date = today)
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const CreateTest: React.FC = () => {
  const navigate = useNavigate();

  const [questionBatches,  setQuestionBatches]  = useState<QuestionBatchDto[]>([]);
  const [candidateBatches, setCandidateBatches] = useState<CandidateBatchDto[]>([]);
  const [candidates,       setCandidates]       = useState<CandidateDto[]>([]);
  const [saving,           setSaving]           = useState(false);

  // Form fields
  const [testTitle,             setTestTitle]             = useState('');
  const [description,           setDescription]           = useState('');
  const [selectedQuestionBatch, setSelectedQuestionBatch] = useState('');
  const [scheduledDate,         setScheduledDate]         = useState('');
  const [scheduledTime,         setScheduledTime]         = useState('');
  const [deadlineDate,          setDeadlineDate]          = useState('');
  const [deadlineTime,          setDeadlineTime]          = useState('');
  const [duration,              setDuration]              = useState('60');
  const [passingScore,          setPassingScore]          = useState('70');
  const [maxAttempts,           setMaxAttempts]           = useState('1');
  const [assignmentType,        setAssignmentType]        = useState<'batch' | 'individual'>('batch');
  const [selectedBatch,         setSelectedBatch]         = useState('');
  const [selectedCandidateId,   setSelectedCandidateId]   = useState('');

  const selectedQBatch = questionBatches.find(qb => qb.questionBatchId === selectedQuestionBatch);
  // Question count is derived from the selected batch — not editable
  const questionCount = selectedQBatch?.questionCount ?? 0;

  useEffect(() => {
    getQuestionBatches().then(setQuestionBatches).catch(() => {});
    getBatches().then(setCandidateBatches).catch(() => {});
    getAdminUsers().then(cs => setCandidates(cs.filter(c => c.role === 'Candidate'))).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testTitle || !selectedQuestionBatch || !scheduledDate || !scheduledTime || !deadlineDate || !deadlineTime) {
      toast.error('Please fill in all required fields'); return;
    }
    if (assignmentType === 'batch' && !selectedBatch) {
      toast.error('Please select a candidate batch'); return;
    }
    if (assignmentType === 'individual' && !selectedCandidateId) {
      toast.error('Please select a candidate'); return;
    }
    if (questionCount === 0) {
      toast.error('Selected question batch has no questions'); return;
    }

    const scheduledStart = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    const deadline       = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();

    if (new Date(deadline) <= new Date(scheduledStart)) {
      toast.error('Deadline must be after scheduled start'); return;
    }

    setSaving(true);
    try {
      const { testId } = await createTest({
        title: testTitle,
        durationMinutes: parseInt(duration),
        passingScorePercent: parseFloat(passingScore),
        description: description || undefined,
      });

      await createAssignment({
        testId,
        questionBatchId: selectedQuestionBatch,
        questionCount,
        scheduledStart,
        deadline,
        maxAttempts: parseInt(maxAttempts),
        batchId:     assignmentType === 'batch'      ? selectedBatch       : undefined,
        candidateId: assignmentType === 'individual' ? selectedCandidateId : undefined,
      });

      toast.success('Test created and assigned!');
      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Failed to create test.');
    } finally {
      setSaving(false);
    }
  };

  const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
    <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>
      {text}{required && <span style={{ color: '#E07A5F' }}> *</span>}
    </label>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl mb-1" style={{ color: '#0F4C75' }}>Create Test Assignment</h1>
          <p className="text-sm" style={{ color: '#636E72' }}>Schedule and assign a test to candidates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Test Details ── */}
          <div className="rounded-2xl p-6" style={cardCss}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: '#0F4C75' }}>Test Details</h2>

            <div className="space-y-4">
              <div>
                <Label text="Test Title" required />
                <input type="text" value={testTitle} onChange={e => setTestTitle(e.target.value)}
                  placeholder="e.g., React Fundamentals Assessment"
                  className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputCss} required />
              </div>

              <div>
                <Label text="Description" />
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputCss} />
              </div>

              <div>
                <Label text="Question Batch" required />
                <div className="relative">
                  <select value={selectedQuestionBatch} onChange={e => setSelectedQuestionBatch(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none" style={inputCss} required>
                    <option value="">— Select a question batch —</option>
                    {questionBatches.map(b => (
                      <option key={b.questionBatchId} value={b.questionBatchId}>
                        {b.name} — {b.questionCount} questions{b.difficulty ? ` (${b.difficulty})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#636E72' }} />
                </div>
                {selectedQBatch && (
                  <div className="mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(27,154,170,0.08)', color: '#1B9AAA' }}>
                    <BookOpen className="w-3.5 h-3.5" />
                    {[selectedQBatch.domain, selectedQBatch.topic, selectedQBatch.difficulty].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>

              {/* Question count — read only, derived from batch */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label text="Questions" />
                  <div className="px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
                    style={{ background: 'rgba(15,76,117,0.05)', border: '1px solid rgba(15,76,117,0.12)', color: '#0F4C75' }}>
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#1B9AAA' }} />
                    {questionCount > 0 ? questionCount : <span style={{ color: '#B2BEC3' }}>—</span>}
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#B2BEC3' }}>From batch</p>
                </div>
                <div>
                  <Label text="Duration (min)" required />
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
                    min="1" max="300" className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputCss} required />
                </div>
                <div>
                  <Label text="Passing Score %" required />
                  <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)}
                    min="0" max="100" className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputCss} required />
                </div>
              </div>

              <div>
                <Label text="Max Attempts" />
                <input type="number" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)}
                  min="1" max="5" className="w-32 px-4 py-2.5 rounded-xl text-sm" style={inputCss} />
              </div>
            </div>
          </div>

          {/* ── Schedule ── */}
          <div className="rounded-2xl p-6" style={cardCss}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: '#0F4C75' }}>Schedule</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label text="Start Date" required />
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#B2BEC3' }} />
                  <input type="date" value={scheduledDate}
                    min={todayDate()}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" style={inputCss} required />
                </div>
              </div>
              <div>
                <Label text="Start Time" required />
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#B2BEC3' }} />
                  <input type="time" value={scheduledTime}
                    min={scheduledDate === todayDate() ? nowTime() : undefined}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" style={inputCss} required />
                </div>
              </div>
              <div>
                <Label text="Deadline Date" required />
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#B2BEC3' }} />
                  <input type="date" value={deadlineDate}
                    min={scheduledDate || todayDate()}
                    onChange={e => setDeadlineDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" style={inputCss} required />
                </div>
              </div>
              <div>
                <Label text="Deadline Time" required />
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#B2BEC3' }} />
                  <input type="time" value={deadlineTime}
                    min={deadlineDate === scheduledDate ? scheduledTime || undefined : undefined}
                    onChange={e => setDeadlineTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" style={inputCss} required />
                </div>
              </div>
            </div>
          </div>

          {/* ── Assign To ── */}
          <div className="rounded-2xl p-6" style={cardCss}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: '#0F4C75' }}>Assign To</h2>

            {/* Toggle */}
            <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit"
              style={{ background: 'rgba(15,76,117,0.06)' }}>
              {(['batch', 'individual'] as const).map(t => (
                <button key={t} type="button" onClick={() => setAssignmentType(t)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: assignmentType === t ? 'rgba(15,76,117,0.12)' : 'transparent',
                    color: assignmentType === t ? '#0F4C75' : '#636E72',
                    border: assignmentType === t ? '1px solid rgba(15,76,117,0.2)' : '1px solid transparent',
                  }}>
                  <Users className="w-4 h-4" />
                  {t === 'batch' ? 'Candidate Batch' : 'Individual'}
                </button>
              ))}
            </div>

            {assignmentType === 'batch' ? (
              <div>
                <Label text="Select Candidate Batch" required />
                <div className="relative">
                  <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none" style={inputCss} required>
                    <option value="">— Choose a batch —</option>
                    {candidateBatches.map(b => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name} — {b.candidateCount} candidates
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#636E72' }} />
                </div>
              </div>
            ) : (
              <div>
                <Label text="Select Candidate" required />
                <div className="relative">
                  <select value={selectedCandidateId} onChange={e => setSelectedCandidateId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none" style={inputCss} required>
                    <option value="">— Choose a candidate —</option>
                    {candidates.map(c => (
                      <option key={c.candidateId} value={c.candidateId}>
                        {c.displayName} — {c.email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#636E72' }} />
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/admin/dashboard')}
              className="px-5 py-2.5 rounded-xl text-sm"
              style={{ background: 'rgba(15,76,117,0.06)', border: '1px solid rgba(15,76,117,0.12)', color: '#636E72' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)', boxShadow: '0 4px 16px rgba(27,154,170,0.3)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateTest;
