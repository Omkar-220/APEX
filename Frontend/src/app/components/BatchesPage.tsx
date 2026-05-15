import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Users, Search, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { getBatches, deleteBatch, CandidateBatchDto } from '../services/apiService';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [batches, setBatches] = useState<CandidateBatchDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBatches()
      .then(setBatches)
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = batches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.domain?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (batchId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will deactivate the batch.`)) return;
    try {
      await deleteBatch(batchId);
      setBatches(prev => prev.filter(b => b.batchId !== batchId));
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error('Failed to delete batch');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: '#0F4C75' }}>Candidate Batches</h1>
            <p className="text-sm" style={{ color: '#636E72' }}>
              {filtered.length} batch{filtered.length !== 1 ? 'es' : ''} ·{' '}
              {filtered.reduce((a, b) => a + b.candidateCount, 0)} total candidates
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/batch/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)', whiteSpace: 'nowrap' }}
          >
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(15,76,117,0.12)', boxShadow: '0 2px 8px rgba(15,76,117,0.06)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#636E72' }} />
          <input type="text" placeholder="Search by name or domain..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#2D3436' }} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B9AAA' }} />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(batch => (
              <div key={batch.batchId} className="rounded-2xl p-5 transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(15,76,117,0.12)', boxShadow: '0 2px 12px rgba(15,76,117,0.06)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.9)'; el.style.boxShadow = '0 4px 16px rgba(15,76,117,0.1)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.7)'; el.style.boxShadow = '0 2px 12px rgba(15,76,117,0.06)'; }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(15,76,117,0.08)', border: '1px solid rgba(15,76,117,0.12)' }}>
                      <Users className="w-5 h-5" style={{ color: '#0F4C75' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm" style={{ color: '#0F4C75' }}>{batch.name}</h3>
                        {!batch.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(99,110,114,0.1)', color: '#636E72', border: '1px solid rgba(99,110,114,0.2)' }}>
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#636E72' }}>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{batch.candidateCount} candidates</span>
                        {batch.domain && <span>{batch.domain}</span>}
                        <span>Created {new Date(batch.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => navigate(`/admin/batch/${batch.batchId}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all"
                      style={{ background: 'rgba(15,76,117,0.08)', border: '1px solid rgba(15,76,117,0.15)', color: '#0F4C75' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.14)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.08)'; }}>
                      Manage <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(batch.batchId, batch.name); }}
                      className="p-2 rounded-xl transition-all"
                      style={{ background: 'rgba(224,122,95,0.08)', border: '1px solid rgba(224,122,95,0.2)', color: '#E07A5F' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,122,95,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,122,95,0.08)'; }}
                      title="Delete batch">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl p-12 text-center"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(15,76,117,0.08)' }}>
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(15,76,117,0.2)' }} />
                <p className="text-sm" style={{ color: '#636E72' }}>No batches found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BatchesPage;
