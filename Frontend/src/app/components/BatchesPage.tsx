import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Users, Search, ChevronRight, Shield } from 'lucide-react';
import { mockCandidateBatches } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';

const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const isSuperAdmin = user?.role === 'SuperAdmin';

  // Admins only see batches they manage; SuperAdmins see all
  const visibleBatches = isSuperAdmin
    ? mockCandidateBatches
    : mockCandidateBatches.filter((b) => b.adminEmails.includes(user?.email || ''));

  const filtered = visibleBatches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.domain?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: '#0F4C75', fontWeight: 600 }}>
              Candidate Batches
            </h1>
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
            <Plus className="w-4 h-4" />
            Create Batch
          </button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(15,76,117,0.12)',
            boxShadow: '0 2px 8px rgba(15,76,117,0.06)',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#636E72' }} />
          <input
            type="text"
            placeholder="Search by name or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#2D3436' }}
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((batch) => {
            const isAdmin = batch.adminEmails.includes(user?.email || '');
            return (
              <div
                key={batch.id}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(15,76,117,0.12)',
                  boxShadow: '0 2px 12px rgba(15,76,117,0.06)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(15,76,117,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.7)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(15,76,117,0.06)';
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(15,76,117,0.08)', border: '1px solid rgba(15,76,117,0.12)' }}
                    >
                      <Users className="w-5 h-5" style={{ color: '#0F4C75' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm" style={{ color: '#0F4C75', fontWeight: 600 }}>
                          {batch.name}
                        </h3>
                        {isAdmin && (
                          <span
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(15,76,117,0.08)',
                              color: '#0F4C75',
                              border: '1px solid rgba(15,76,117,0.15)',
                            }}
                          >
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {!batch.isActive && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(99,110,114,0.1)', color: '#636E72', border: '1px solid rgba(99,110,114,0.2)' }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#636E72' }}>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {batch.candidateCount} candidates
                        </span>
                        {batch.domain && <span>{batch.domain}</span>}
                        <span>{batch.adminEmails.length} admin{batch.adminEmails.length !== 1 ? 's' : ''}</span>
                        <span>Created {new Date(batch.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/admin/batch/${batch.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all flex-shrink-0"
                    style={{
                      background: 'rgba(15,76,117,0.08)',
                      border: '1px solid rgba(15,76,117,0.15)',
                      color: '#0F4C75',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.14)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.08)';
                    }}
                  >
                    Manage
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(15,76,117,0.08)' }}
            >
              <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(15,76,117,0.2)' }} />
              <p className="text-sm" style={{ color: '#636E72' }}>No batches found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchesPage;
