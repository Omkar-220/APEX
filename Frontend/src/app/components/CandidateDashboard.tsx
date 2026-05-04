import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Calendar, Trophy, TrendingUp, Award, ChevronRight, Clock,
  Target, BookOpen, Zap, ArrowUpRight, CheckCircle2, Circle,
  TrendingDown, Minus,
} from 'lucide-react';
import { mockTests, mockAchievements, mockLeaderboard } from '../data/mockData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import DashboardLayout from './DashboardLayout';

const difficultyConfig = {
  easy:   { label: 'Easy',   color: '#1B9AAA', bg: 'rgba(27,154,170,0.12)',  border: 'rgba(27,154,170,0.25)' },
  medium: { label: 'Medium', color: '#E8B960', bg: 'rgba(232,185,96,0.12)',  border: 'rgba(232,185,96,0.25)' },
  hard:   { label: 'Hard',   color: '#E07A5F', bg: 'rgba(224,122,95,0.12)',  border: 'rgba(224,122,95,0.25)' },
};

const domainColors: Record<string, string> = {
  'Frontend Development': '#0F4C75',
  'Programming': '#E8B960',
  'Database': '#1B9AAA',
  'Data Science': '#E07A5F',
  'Architecture': '#0F4C75',
};

const StatCard: React.FC<{
  icon: React.ReactNode; value: string | number; label: string;
  gradient: string; glow: string; trend?: string;
}> = ({ icon, value, label, gradient, glow, trend }) => (
  <div className="rounded-2xl p-5 relative overflow-hidden" style={{
    background: 'rgba(255,255,255,0.65)',
    border: '1px solid rgba(15,76,117,0.1)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 4px 16px rgba(15,76,117,0.07)',
  }}>
    <div className="absolute inset-0 pointer-events-none opacity-8" style={{ background: gradient }} />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: gradient, boxShadow: `0 0 16px ${glow}` }}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs px-2 py-1 rounded-full"
            style={{ background: 'rgba(27,154,170,0.1)', color: '#1B9AAA', border: '1px solid rgba(27,154,170,0.2)' }}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl mb-0.5" style={{ color: '#0F4C75' }}>{value}</div>
      <div className="text-xs" style={{ color: '#636E72' }}>{label}</div>
    </div>
  </div>
);

const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'achievements'>('upcoming');

  const upcomingTests = mockTests.filter((t) => t.status === 'upcoming');
  const completedTests = mockTests.filter((t) => t.status === 'completed');

  const scoreData = [
    { name: 'Sys. Design', score: 85 },
    { name: 'SQL Adv.', score: 72 },
    { name: 'JS Basics', score: 90 },
  ];

  const tabs = [
    { id: 'upcoming', label: 'Upcoming Tests', count: upcomingTests.length },
    { id: 'history', label: 'History & Analytics' },
    { id: 'achievements', label: 'Achievements' },
  ] as const;

  return (
    <DashboardLayout>
      {/* Full height flex column — nothing overflows the viewport */}
      <div className="max-w-7xl mx-auto flex flex-col" style={{ height: '100%' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}>
              👋
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', color: '#0F4C75' }}>
                Welcome back, <span style={{ color: '#1B9AAA' }}>Alex</span>
              </h1>
              <p className="text-xs" style={{ color: '#636E72' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Target className="w-5 h-5 text-white" />} value={upcomingTests.length}
            label="Upcoming Tests" gradient="linear-gradient(135deg, #0F4C75, #1B9AAA)" glow="rgba(27,154,170,0.4)" />
          <StatCard icon={<Trophy className="w-5 h-5 text-white" />} value={completedTests.length}
            label="Completed" gradient="linear-gradient(135deg, #E8B960, #d4a843)" glow="rgba(232,185,96,0.4)"
            trend="+2 this month" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-white" />}
            value={completedTests.length > 0
              ? Math.round(completedTests.reduce((a, t) => a + (t.score || 0), 0) / completedTests.length) + '%'
              : '0%'}
            label="Average Score" gradient="linear-gradient(135deg, #1B9AAA, #0F4C75)" glow="rgba(27,154,170,0.4)"
            trend="↑ 6.2%" />
          <StatCard icon={<Award className="w-5 h-5 text-white" />} value="1,720"
            label="XP Points" gradient="linear-gradient(135deg, #E07A5F, #c96a50)" glow="rgba(224,122,95,0.4)" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit flex-shrink-0"
          style={{ background: 'rgba(15,76,117,0.06)', border: '1px solid rgba(15,76,117,0.1)' }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
              style={{
                background: activeTab === tab.id ? 'rgba(15,76,117,0.12)' : 'transparent',
                color: activeTab === tab.id ? '#0F4C75' : '#636E72',
                border: activeTab === tab.id ? '1px solid rgba(15,76,117,0.2)' : '1px solid transparent',
              }}>
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                  background: activeTab === tab.id ? 'rgba(15,76,117,0.15)' : 'rgba(15,76,117,0.07)',
                  color: activeTab === tab.id ? '#0F4C75' : '#636E72',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content — fills remaining height, scrolls internally */}
        <div className="flex-1 min-h-0">

        {/* UPCOMING TESTS */}
        {activeTab === 'upcoming' && (
          <div className="h-full flex flex-col">
            {upcomingTests.length === 0 ? (
              <div className="rounded-2xl p-12 text-center"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(15,76,117,0.08)' }}>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(15,76,117,0.2)' }} />
                <p style={{ color: '#636E72' }}>No upcoming tests scheduled</p>
              </div>
            ) : (
              <div className="overflow-y-auto pr-1 space-y-4 h-full">
                {upcomingTests.map((test) => {
                  const diff = test.difficulty ? difficultyConfig[test.difficulty] : difficultyConfig.medium;
                  const domainColor = test.domain ? domainColors[test.domain] || '#0F4C75' : '#0F4C75';
                  const scheduledDate = new Date(test.scheduledDate);
                  const daysUntil = Math.ceil((scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={test.id} className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300"
                      style={{
                        background: 'rgba(255,255,255,0.65)',
                        border: '1px solid rgba(15,76,117,0.1)',
                        backdropFilter: 'blur(14px)',
                        boxShadow: '0 4px 16px rgba(15,76,117,0.06)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(15,76,117,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.65)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(15,76,117,0.06)';
                      }}>
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: domainColor }} />
                      <div className="flex items-start justify-between pl-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 style={{ fontSize: '1rem', color: '#0F4C75' }}>{test.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
                              {diff.label}
                            </span>
                            {daysUntil <= 3 && daysUntil > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                style={{ background: 'rgba(224,122,95,0.12)', color: '#E07A5F', border: '1px solid rgba(224,122,95,0.25)' }}>
                                <Zap className="w-3 h-3" /> Soon
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-5 text-xs mb-2" style={{ color: '#636E72' }}>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{test.duration} min</div>
                            <div className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{test.totalQuestions} questions</div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: domainColor }} />
                              {test.domain}
                            </div>
                          </div>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>{test.batchName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3 ml-4 flex-shrink-0">
                          <div className="text-center px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(15,76,117,0.07)', border: '1px solid rgba(15,76,117,0.12)' }}>
                            <div className="text-lg leading-none" style={{ color: '#0F4C75' }}>{daysUntil}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#636E72' }}>{daysUntil === 1 ? 'day' : 'days'}</div>
                          </div>
                          <button onClick={() => navigate(`/test/${test.id}`)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white transition-all duration-200"
                            style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)', boxShadow: '0 0 16px rgba(27,154,170,0.3)' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(27,154,170,0.5)';
                              (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(27,154,170,0.3)';
                              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                            }}>
                            Start <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <div className="h-full flex flex-col gap-4">
            {/* Chart — compact, fixed height */}
            <div className="flex-shrink-0 rounded-2xl p-5" style={{
              background: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(15,76,117,0.1)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 4px 16px rgba(15,76,117,0.06)',
            }}>
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ color: '#0F4C75' }}>Score Trend</h3>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{ background: 'rgba(27,154,170,0.1)', color: '#1B9AAA', border: '1px solid rgba(27,154,170,0.2)' }}>
                  ↑ Improving
                </span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={scoreData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B9AAA" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1B9AAA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,76,117,0.06)" />
                  <XAxis dataKey="name" stroke="#636E72" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#636E72" domain={[50, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{
                    background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(15,76,117,0.15)',
                    borderRadius: '12px', color: '#2D3436', boxShadow: '0 8px 32px rgba(15,76,117,0.12)',
                  }} formatter={(v: number) => [`${v}%`, 'Score']} />
                  <Area type="monotone" dataKey="score" stroke="#1B9AAA" strokeWidth={2.5}
                    fill="url(#scoreGrad)" dot={{ fill: '#1B9AAA', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#0F4C75' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Past Tests — fills remaining space, scrolls */}
            <div className="flex-1 min-h-0 flex flex-col">
              <h3 className="mb-3 flex-shrink-0" style={{ color: '#0F4C75' }}>Past Tests</h3>
              <div className="overflow-y-auto pr-1 space-y-3 flex-1 min-h-0">
                {completedTests.map((test) => {
                  const diff = test.difficulty ? difficultyConfig[test.difficulty] : difficultyConfig.medium;
                  const score = test.score || 0;
                  const scoreColor = score >= 80 ? '#1B9AAA' : score >= 60 ? '#E8B960' : '#E07A5F';

                  return (
                    <div key={test.id} onClick={() => navigate(`/test-review/${test.id}`)}
                      className="rounded-2xl p-5 cursor-pointer transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(15,76,117,0.1)', backdropFilter: 'blur(14px)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.65)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm" style={{ color: '#0F4C75' }}>{test.title}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
                              {diff.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs" style={{ color: '#636E72' }}>
                            <span>{new Date(test.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>{test.totalQuestions} questions</span>
                            <span>{test.domain}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-2xl" style={{ color: scoreColor }}>{score}%</div>
                            <div className="text-xs" style={{ color: '#9ca3af' }}>
                              {Math.round((score / 100) * (test.totalQuestions || 0))}/{test.totalQuestions}
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4" style={{ color: 'rgba(15,76,117,0.3)' }} />
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full" style={{ background: 'rgba(15,76,117,0.08)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${score}%`, background: scoreColor,
                          boxShadow: `0 0 8px ${scoreColor}60`, transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{
              background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(15,76,117,0.1)', backdropFilter: 'blur(14px)',
            }}>
              <h3 className="mb-5" style={{ color: '#0F4C75' }}>Your Achievements</h3>
              <div className="space-y-3">
                {mockAchievements.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
                    style={{
                      background: a.earned ? 'rgba(232,185,96,0.08)' : 'rgba(15,76,117,0.03)',
                      border: a.earned ? '1px solid rgba(232,185,96,0.2)' : '1px solid rgba(15,76,117,0.06)',
                      opacity: a.earned ? 1 : 0.5,
                    }}>
                    <div className="text-2xl w-10 text-center">{a.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm" style={{ color: '#0F4C75' }}>{a.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#636E72' }}>{a.description}</div>
                    </div>
                    {a.earned
                      ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#E8B960' }} />
                      : <Circle className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(15,76,117,0.2)' }} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{
              background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(15,76,117,0.1)', backdropFilter: 'blur(14px)',
            }}>
              <div className="flex items-center justify-between mb-5">
                <h3 style={{ color: '#0F4C75' }}>Leaderboard</h3>
                <span className="text-xs" style={{ color: '#636E72' }}>This Month</span>
              </div>
              <div className="space-y-2">
                {mockLeaderboard.map((entry) => {
                  const isYou = entry.name === 'Alex Johnson';
                  const rankColors = ['#E8B960', '#9ca3af', '#E07A5F'];
                  const rankColor = entry.rank <= 3 ? rankColors[entry.rank - 1] : 'rgba(15,76,117,0.2)';
                  const trendIcon = entry.trend === 'up'
                    ? <TrendingUp className="w-3 h-3" style={{ color: '#1B9AAA' }} />
                    : entry.trend === 'down'
                    ? <TrendingDown className="w-3 h-3" style={{ color: '#E07A5F' }} />
                    : <Minus className="w-3 h-3" style={{ color: '#636E72' }} />;

                  return (
                    <div key={entry.rank} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                      style={{
                        background: isYou ? 'rgba(15,76,117,0.08)' : entry.rank <= 3 ? 'rgba(15,76,117,0.03)' : 'transparent',
                        border: isYou ? '1px solid rgba(15,76,117,0.15)' : '1px solid transparent',
                      }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                        style={{
                          background: entry.rank <= 3 ? `radial-gradient(circle, ${rankColor}30, ${rankColor}10)` : 'rgba(15,76,117,0.06)',
                          border: `1px solid ${rankColor}`,
                          color: entry.rank <= 3 ? rankColor : '#636E72',
                        }}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: isYou ? '#0F4C75' : '#2D3436' }}>{entry.name}</span>
                          {isYou && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(15,76,117,0.1)', color: '#0F4C75' }}>You</span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#636E72' }}>{entry.tests} tests</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {trendIcon}
                        <div className="text-sm" style={{ color: '#1B9AAA' }}>{entry.score.toLocaleString()} XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        )}

        </div> {/* end tab content */}
      </div>
    </DashboardLayout>
  );
};

export default CandidateDashboard;
