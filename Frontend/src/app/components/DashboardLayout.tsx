import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut,
  Moon,
  Sun,
  Home,
  LayoutDashboard,
  Users,
  BookOpen,
  Bell,
  ChevronDown,
  Shield,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isCandidate = user?.role === 'candidate';

  const navItems = isCandidate
    ? [
        { icon: Home, label: 'Dashboard', path: '/candidate/dashboard' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Batches', path: '/admin/batches' },
        { icon: BookOpen, label: 'Questions', path: '/admin/questions' },
      ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
      }}
    >
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(244,247,246,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(15,76,117,0.12)',
          boxShadow: '0 4px 24px rgba(15,76,117,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate(isCandidate ? '/candidate/dashboard' : '/admin/dashboard')}
                className="flex items-center gap-2.5 group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)',
                    boxShadow: '0 0 16px rgba(27,154,170,0.4)',
                  }}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span
                  className="hidden sm:block font-semibold"
                  style={{ color: '#0F4C75' }}
                >
                  AssessmentSuite
                </span>
              </button>

              {/* Nav items */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm"
                      style={{
                        background: active ? 'rgba(15,76,117,0.12)' : 'transparent',
                        color: active ? '#0F4C75' : '#636E72',
                        border: active ? '1px solid rgba(15,76,117,0.2)' : '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.06)';
                          (e.currentTarget as HTMLElement).style.color = '#0F4C75';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#636E72';
                        }
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all duration-200"
                style={{
                  background: 'rgba(15,76,117,0.06)',
                  border: '1px solid rgba(15,76,117,0.12)',
                  color: '#636E72',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.12)';
                  (e.currentTarget as HTMLElement).style.color = '#0F4C75';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.06)';
                  (e.currentTarget as HTMLElement).style.color = '#636E72';
                }}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Notifications */}
              <button
                className="p-2 rounded-lg relative transition-all duration-200"
                style={{
                  background: 'rgba(15,76,117,0.06)',
                  border: '1px solid rgba(15,76,117,0.12)',
                  color: '#636E72',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.12)';
                  (e.currentTarget as HTMLElement).style.color = '#0F4C75';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.06)';
                  (e.currentTarget as HTMLElement).style.color = '#636E72';
                }}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }}
                />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(15,76,117,0.06)',
                    border: '1px solid rgba(15,76,117,0.12)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.06)';
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs leading-none mb-0.5" style={{ color: '#2D3436' }}>{user?.name}</div>
                    <div className="text-xs capitalize" style={{ color: '#636E72' }}>
                      {user?.role?.replace('-', ' ')}
                    </div>
                  </div>
                  <ChevronDown
                    className="w-3 h-3 transition-transform duration-200"
                    style={{
                      color: '#636E72',
                      transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-xl py-1 z-50"
                      style={{
                        background: 'rgba(244,247,246,0.97)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(15,76,117,0.12)',
                        boxShadow: '0 20px 60px rgba(15,76,117,0.15)',
                      }}
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                        style={{ color: '#E07A5F' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(224,122,95,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
