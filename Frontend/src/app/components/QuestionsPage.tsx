import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, BookOpen, Search, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { getQuestionBatches, deleteQuestionBatch, QuestionBatchDto } from '../services/apiService';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const difficultyConfig: Record<string, { color: string; bg: string; border: string }> = {
  Beginner:     { color: '#1B9AAA', bg: 'rgba(27,154,170,0.1)',  border: 'rgba(27,154,170,0.25)' },
  Intermediate: { color: '#E8B960', bg: 'rgba(232,185,96,0.1)',  border: 'rgba(232,185,96,0.25)' },
  Advanced:     { color: '#E07A5F', bg: 'rgba(224,122,95,0.1)',  border: 'rgba(224,122,95,0.25)' },
};

const QuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [batches, setBatches] = useState<QuestionBatchDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuestionBatches()
      .then(setBatches)
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = batches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.domain?.toLowerCase().includes(search.toLowerCase()) ||
    b.topic?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (batchId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This will deactivate the question bank.`)) return;
    try {
      await deleteQuestionBatch(batchId);
      setBatches(prev => prev.filter(b => b.questionBatchId !== batchId));
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error('Failed to delete question bank');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: '#0F4C75' }}>Question Banks</h1>
            <p className="text-sm" style={{ color: '#636E72' }}>
              {batches.length} batches · {batches.reduce((a, b) => a + b.questionCount, 0)} total questions
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/questions/create')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)', whiteSpace: 'nowrap' }}
          >
            <Plus className="w-4 h-4" /> Create Question Bank
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(15,76,117,0.12)', boxShadow: '0 2px 8px rgba(15,76,117,0.06)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#636E72' }} />
          <input type="text" placeholder="Search by name, domain or topic..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#2D3436' }} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B9AAA' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(batch => {
              const diff = batch.difficulty ? difficultyConfig[batch.difficulty] : null;
              return (
                <div key={batch.questionBatchId}
                  onClick={() => navigate(`/admin/questions/${batch.questionBatchId}`)}
                  className="rounded-2xl p-5 cursor-pointer transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(15,76,117,0.12)', boxShadow: '0 2px 12px rgba(15,76,117,0.06)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.9)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 20px rgba(15,76,117,0.1)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.7)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 12px rgba(15,76,117,0.06)'; }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(15,76,117,0.08)', border: '1px solid rgba(15,76,117,0.12)' }}>
                      <BookOpen className="w-5 h-5" style={{ color: '#0F4C75' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {diff && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
                          {batch.difficulty}
                        </span>
                      )}
                      {!batch.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,110,114,0.1)', color: '#636E72', border: '1px solid rgba(99,110,114,0.2)' }}>
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm mb-1" style={{ color: '#0F4C75' }}>{batch.name}</h3>
                  <p className="text-xs mb-4" style={{ color: '#636E72' }}>
                    {[batch.domain, batch.topic].filter(Boolean).join(' · ') || 'No domain set'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#636E72' }}>{batch.questionCount} questions</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => handleDelete(batch.questionBatchId, batch.name, e)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: '#E07A5F', background: 'rgba(224,122,95,0.08)', border: '1px solid rgba(224,122,95,0.15)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,122,95,0.18)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,122,95,0.08)'; }}
                        title="Delete batch">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1 text-xs" style={{ color: '#1B9AAA' }}>
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-3 rounded-2xl p-12 text-center"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(15,76,117,0.08)' }}>
                <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(15,76,117,0.2)' }} />
                <p className="text-sm" style={{ color: '#636E72' }}>No question banks found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuestionsPage;
