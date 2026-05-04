import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Upload, UserPlus, UserMinus, ArrowLeft, Save, Plus, X, Shield } from 'lucide-react';
import { mockCandidateBatches, type Difficulty } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const BatchEditor: React.FC = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isNew = batchId === 'new';
  const existing = isNew ? null : mockCandidateBatches.find((b) => b.id === batchId);

  // Batch metadata
  const [name, setName] = useState(existing?.name || '');
  const [domain, setDomain] = useState(existing?.domain || '');
  const [topic, setTopic] = useState(existing?.topic || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty || 'Intermediate');

  // Candidates (email-based on frontend)
  const [candidates, setCandidates] = useState<string[]>(existing?.candidates || []);
  const [newEmail, setNewEmail] = useState('');

  // Admins — all have equal ownership
  const [admins, setAdmins] = useState<string[]>(
    existing?.adminEmails || (user?.email ? [user.email] : [])
  );
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const handleAddCandidate = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes('@')) { toast.error('Invalid email'); return; }
    if (candidates.includes(email)) { toast.error('Candidate already in batch'); return; }
    setCandidates([...candidates, email]);
    setNewEmail('');
  };

  const handleAddAdmin = () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email.includes('@')) { toast.error('Invalid email'); return; }
    if (admins.includes(email)) { toast.error('Already an admin'); return; }
    setAdmins([...admins, email]);
    setNewAdminEmail('');
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).split('\n').map((l) => l.trim().toLowerCase()).filter((l) => l.includes('@'));
      const newOnes = lines.filter((e) => !candidates.includes(e));
      setCandidates([...candidates, ...newOnes]);
      toast.success(`Added ${newOnes.length} candidates`);
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Batch name is required'); return; }
    if (admins.length === 0) { toast.error('At least one admin is required'); return; }
    toast.success(isNew ? `Batch "${name}" created` : `Batch "${name}" updated`);
    setTimeout(() => navigate('/admin/batches'), 1500);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(15,76,117,0.2)',
    color: '#2D3436',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(15,76,117,0.12)',
    boxShadow: '0 2px 12px rgba(15,76,117,0.06)',
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/batches')}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#636E72' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0F4C75')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#636E72')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Batches
        </button>

        <div className="mb-8">
          <h1 className="text-2xl mb-1" style={{ color: '#0F4C75', fontWeight: 600 }}>
            {isNew ? 'Create Candidate Batch' : `Edit — ${existing?.name}`}
          </h1>
          <p className="text-sm" style={{ color: '#636E72' }}>
            All admins listed have equal management privileges over this batch.
          </p>
        </div>

        <div className="space-y-6">
          {/* Batch Info */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F4C75' }}>Batch Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>
                  Batch Name <span style={{ color: '#E07A5F' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Frontend Team Q3 2026"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., Frontend Development"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., React.js"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none"
                  style={inputStyle}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" style={{ color: '#0F4C75' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#0F4C75' }}>
                Batch Admins ({admins.length})
              </h2>
            </div>
            <p className="text-xs mb-4" style={{ color: '#636E72' }}>
              All admins have equal ownership — they can add/remove candidates and manage tests for this batch.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="admin@company.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
              <button
                onClick={handleAddAdmin}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {admins.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(15,76,117,0.04)', border: '1px solid rgba(15,76,117,0.08)' }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" style={{ color: '#1B9AAA' }} />
                    <span className="text-sm" style={{ color: '#2D3436' }}>{email}</span>
                    {email === user?.email && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(15,76,117,0.1)', color: '#0F4C75' }}>
                        You
                      </span>
                    )}
                  </div>
                  {admins.length > 1 && (
                    <button onClick={() => setAdmins(admins.filter((a) => a !== email))}>
                      <X className="w-4 h-4" style={{ color: '#E07A5F' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Candidates */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F4C75' }}>
              Candidates ({candidates.length})
            </h2>

            <div className="flex gap-2 mb-3">
              <input
                type="email"
                placeholder="candidate@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCandidate()}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
              <button
                onClick={handleAddCandidate}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}
              >
                <UserPlus className="w-4 h-4" />
                Add
              </button>
            </div>

            <label
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm cursor-pointer mb-4 transition-all"
              style={{
                background: 'rgba(27,154,170,0.06)',
                border: '1px dashed rgba(27,154,170,0.3)',
                color: '#1B9AAA',
              }}
            >
              <Upload className="w-4 h-4" />
              Bulk Upload from CSV (one email per row)
              <input type="file" accept=".csv,.txt" onChange={handleBulkUpload} className="hidden" />
            </label>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {candidates.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(15,76,117,0.03)', border: '1px solid rgba(15,76,117,0.07)' }}
                >
                  <span className="text-sm" style={{ color: '#2D3436' }}>{email}</span>
                  <button onClick={() => setCandidates(candidates.filter((c) => c !== email))}>
                    <UserMinus className="w-4 h-4" style={{ color: '#E07A5F' }} />
                  </button>
                </div>
              ))}
              {candidates.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: '#636E72' }}>
                  No candidates added yet
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => navigate('/admin/batches')}
              className="px-5 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(15,76,117,0.06)', border: '1px solid rgba(15,76,117,0.12)', color: '#636E72' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}
            >
              <Save className="w-4 h-4" />
              {isNew ? 'Create Batch' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchEditor;
