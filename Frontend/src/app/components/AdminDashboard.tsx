import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Users,
  BookOpen,
  Calendar,
  Clock,
  ClipboardCheck,
  ChevronRight,
  Zap,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  LayoutGrid,
} from 'lucide-react';
import {
  mockQuestionBatches,
  mockCandidateBatches,
  mockTestAssignments,
  mockTestResults,
} from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  scheduled: {
    label: 'Scheduled',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    border: 'rgba(139,92,246,0.25)',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.25)',
    icon: PlayCircle,
  },
  completed: {
    label: 'Completed',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.25)',
    icon: CheckCircle2,
  },
};

const reviewStatusConfig = {
  pending: { label: 'Pending Review', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.25)' },
  'in-review': { label: 'In Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' },
  completed: { label: 'Reviewed', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.25)' },
};

const domainColors: Record<string, string> = {
  'Frontend Development': '#6366f1',
  Programming: '#f59e0b',
  Database: '#10b981',
  'Data Science': '#8b5cf6',
  Architecture: '#3b82f6',
};

const GlassStatCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  gradient: string;
  glow: string;
  badge?: { text: string; color: string; bg: string };
  onClick?: () => void;
}> = ({ icon, value, label, gradient, glow, badge, onClick }) => (
  <div
    className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200"
    style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(16px)',
      cursor: onClick ? 'pointer' : 'default',
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      if (onClick) {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }
    }}
  >
    <div
      className="absolute inset-0 pointer-events-none opacity-15"
      style={{ background: gradient }}
    />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: gradient, boxShadow: `0 0 20px ${glow}` }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}40` }}
          >
            {badge.text}
          </span>
        )}
      </div>
      <div className="text-2xl text-white mb-0.5">{value}</div>
      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'test-status' | 'upcoming' | 'assess' | 'overview'>('test-status');

  const isRootAdmin = user?.role === 'root-admin';
  const pendingReviews = mockTestResults.filter((r) => r.needsManualReview && r.reviewStatus === 'pending').length;

  const visibleBatches = isRootAdmin
    ? mockCandidateBatches
    : mockCandidateBatches.filter(
        (b) => b.createdBy === user?.email || b.sharedAdmins.includes(user?.email || '')
      );

  const upcomingTests = mockTestAssignments.filter((t) => t.status === 'scheduled');
  const inProgressTests = mockTestAssignments.filter((t) => t.status === 'in-progress');

  const tabs = [
    { id: 'test-status', label: 'Assignments & Status', icon: LayoutGrid },
    { id: 'upcoming', label: 'Upcoming Tests', icon: Clock, count: upcomingTests.length },
    { id: 'assess', label: 'Assess Tests', icon: ClipboardCheck, count: pendingReviews, urgent: pendingReviews > 0 },
    { id: 'overview', label: 'Batch Overview', icon: Users },
  ] as const;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isRootAdmin
                    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                }}
              >
                {isRootAdmin ? '👑' : '⚙️'}
              </div>
              <h1 className="text-white" style={{ fontSize: '1.4rem' }}>
                {isRootAdmin ? 'Root Admin' : 'Batch Admin'} Dashboard
              </h1>
            </div>
            <p className="text-xs pl-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isRootAdmin ? 'Full platform control & oversight' : 'Manage your assigned batches & tests'}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/create-test')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(99,102,241,0.5)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(99,102,241,0.3)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <Plus className="w-4 h-4" />
            Assign New Test
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassStatCard
            icon={<BookOpen className="w-5 h-5 text-white" />}
            value={mockQuestionBatches.length}
            label="Question Banks"
            gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
            glow="rgba(99,102,241,0.5)"
            onClick={() => navigate('/admin/questions')}
          />
          <GlassStatCard
            icon={<Users className="w-5 h-5 text-white" />}
            value={visibleBatches.length}
            label="Candidate Batches"
            gradient="linear-gradient(135deg, #10b981, #059669)"
            glow="rgba(16,185,129,0.5)"
            onClick={() => navigate('/admin/batches')}
          />
          <GlassStatCard
            icon={<Clock className="w-5 h-5 text-white" />}
            value={upcomingTests.length}
            label="Upcoming Tests"
            gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
            glow="rgba(139,92,246,0.5)"
            badge={
              inProgressTests.length > 0
                ? { text: `${inProgressTests.length} live`, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' }
                : undefined
            }
            onClick={() => setSelectedTab('upcoming')}
          />
          <GlassStatCard
            icon={<ClipboardCheck className="w-5 h-5 text-white" />}
            value={pendingReviews}
            label="Pending Reviews"
            gradient="linear-gradient(135deg, #ef4444, #dc2626)"
            glow="rgba(239,68,68,0.5)"
            badge={
              pendingReviews > 0
                ? { text: 'Needs attention', color: '#f87171', bg: 'rgba(239,68,68,0.15)' }
                : undefined
            }
            onClick={() => setSelectedTab('assess')}
          />
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}
        >
          {tabs.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200"
                style={{
                  background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                  color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                  border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'urgent' in tab && tab.urgent
                        ? 'rgba(239,68,68,0.3)'
                        : active
                        ? 'rgba(99,102,241,0.4)'
                        : 'rgba(255,255,255,0.1)',
                      color: 'urgent' in tab && tab.urgent ? '#fca5a5' : active ? '#c7d2fe' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TEST ASSIGNMENTS & STATUS */}
        {selectedTab === 'test-status' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white">All Test Assignments</h2>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {mockTestAssignments.length} total
              </span>
            </div>

            {mockTestAssignments.map((assignment) => {
              const sc = statusConfig[assignment.status];
              const domainColor = assignment.domain ? domainColors[assignment.domain] || '#6366f1' : '#6366f1';
              const progress = (assignment.completedCount / assignment.totalCandidates) * 100;

              return (
                <div
                  key={assignment.id}
                  onClick={() => navigate(`/admin/test-status/${assignment.testId}`)}
                  className="rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Left accent */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: domainColor }}
                  />

                  <div className="pl-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-white text-sm">{assignment.testName}</h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              background: sc.bg,
                              color: sc.color,
                              border: `1px solid ${sc.border}`,
                            }}
                          >
                            <sc.icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                          <div>
                            <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Batch</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)' }}>{assignment.batchName}</div>
                          </div>
                          <div>
                            <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Scheduled</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                              {new Date(assignment.scheduledDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Progress</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                              {assignment.completedCount}/{assignment.totalCandidates} candidates
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Avg Score</div>
                            <div
                              style={{
                                color: assignment.averageScore
                                  ? assignment.averageScore >= 80
                                    ? '#10b981'
                                    : '#f59e0b'
                                  : 'rgba(255,255,255,0.4)',
                              }}
                            >
                              {assignment.averageScore ? `${assignment.averageScore}%` : '—'}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${progress}%`,
                              background:
                                assignment.status === 'completed'
                                  ? '#10b981'
                                  : assignment.status === 'in-progress'
                                  ? '#3b82f6'
                                  : '#8b5cf6',
                              boxShadow:
                                assignment.status === 'in-progress' ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
                            }}
                          />
                        </div>
                      </div>

                      <ArrowUpRight
                        className="w-4 h-4 flex-shrink-0 mt-1"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* UPCOMING TESTS */}
        {selectedTab === 'upcoming' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white">Scheduled Tests</h2>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {upcomingTests.length} upcoming
              </span>
            </div>

            {upcomingTests.map((test) => {
              const domainColor = test.domain ? domainColors[test.domain] || '#6366f1' : '#6366f1';
              const scheduledDate = new Date(test.scheduledDate);
              const daysUntil = Math.ceil((scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={test.id}
                  className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {/* Left accent */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: domainColor }}
                  />

                  <div className="pl-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-white text-sm">{test.testName}</h3>
                        {daysUntil <= 3 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              background: 'rgba(239,68,68,0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239,68,68,0.3)',
                            }}
                          >
                            <Zap className="w-3 h-3" />
                            Soon
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Batch</div>
                          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            <Users className="w-3 h-3" />
                            {test.batchName}
                          </div>
                        </div>
                        <div>
                          <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Date & Time</div>
                          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            <Calendar className="w-3 h-3" />
                            {scheduledDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Duration</div>
                          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            <Clock className="w-3 h-3" />
                            {test.duration} min
                          </div>
                        </div>
                        <div>
                          <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Candidates</div>
                          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            <Users className="w-3 h-3" />
                            {test.totalCandidates}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Days countdown */}
                      <div
                        className="text-center px-3 py-2 rounded-xl"
                        style={{
                          background: 'rgba(139,92,246,0.12)',
                          border: '1px solid rgba(139,92,246,0.2)',
                        }}
                      >
                        <div className="text-xl text-white leading-none">{daysUntil}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(196,181,253,0.7)' }}>
                          days
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/upcoming-test/${test.testId}`)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white transition-all duration-200"
                        style={{
                          background: 'rgba(99,102,241,0.2)',
                          border: '1px solid rgba(99,102,241,0.3)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.35)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.2)';
                        }}
                      >
                        Manage
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ASSESS TESTS */}
        {selectedTab === 'assess' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white">Tests Requiring Manual Review</h2>
              {pendingReviews > 0 && (
                <span
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {pendingReviews} need review
                </span>
              )}
            </div>

            {mockTestResults
              .filter((r) => r.needsManualReview)
              .map((result) => {
                const rs = reviewStatusConfig[result.reviewStatus];
                return (
                  <div
                    key={`${result.testId}-${result.candidateId}`}
                    onClick={() => navigate(`/admin/assess/${result.testId}/${result.candidateId}`)}
                    className="rounded-2xl p-5 cursor-pointer transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="text-white text-sm">React Fundamentals Assessment</h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: rs.bg,
                              color: rs.color,
                              border: `1px solid ${rs.border}`,
                            }}
                          >
                            {rs.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Candidate</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                              {result.candidateId === 'c1' ? 'Sarah Chen' : 'Michael Brown'}
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Batch</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)' }}>Frontend Team Q2 2026</div>
                          </div>
                          <div>
                            <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Submitted</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                              {new Date(result.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 ml-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* BATCH OVERVIEW */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Question Banks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white">Question Banks</h2>
                <button
                  onClick={() => navigate('/admin/questions/create')}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)';
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mockQuestionBatches.map((batch) => {
                  const diffColors = {
                    easy: '#10b981',
                    medium: '#f59e0b',
                    hard: '#ef4444',
                  };
                  const color = diffColors[batch.difficulty];

                  return (
                    <div
                      key={batch.id}
                      onClick={() => navigate(`/admin/questions/${batch.id}`)}
                      className="rounded-2xl p-5 cursor-pointer transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                        >
                          <BookOpen className="w-4 h-4" style={{ color }} />
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: `${color}15`,
                            color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {batch.difficulty}
                        </span>
                      </div>

                      <h3 className="text-white text-sm mb-1">{batch.name}</h3>
                      <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {batch.domain} · {batch.topic}
                      </p>

                      <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <span>{batch.questionCount} questions</span>
                        <span>Last used {new Date(batch.lastUsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Candidate Batches */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white">Candidate Batches</h2>
                <button
                  onClick={() => navigate('/admin/batch/new')}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.15)';
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
              </div>

              <div className="space-y-3">
                {visibleBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="rounded-2xl p-5 transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white text-sm">{batch.name}</h3>
                          {batch.createdBy === user?.email && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(139,92,246,0.15)',
                                color: '#c4b5fd',
                                border: '1px solid rgba(139,92,246,0.25)',
                              }}
                            >
                              Owner
                            </span>
                          )}
                          {batch.sharedAdmins.includes(user?.email || '') && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(16,185,129,0.15)',
                                color: '#6ee7b7',
                                border: '1px solid rgba(16,185,129,0.25)',
                              }}
                            >
                              Shared Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {batch.candidateCount} candidates
                          </span>
                          <span>Created {new Date(batch.createdOn).toLocaleDateString()}</span>
                          {batch.sharedAdmins.length > 0 && (
                            <span>{batch.sharedAdmins.length} co-admin(s)</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/admin/batch/${batch.id}`)}
                        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all duration-200"
                        style={{
                          background: 'rgba(99,102,241,0.15)',
                          color: '#a5b4fc',
                          border: '1px solid rgba(99,102,241,0.25)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.25)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)';
                        }}
                      >
                        Manage
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
