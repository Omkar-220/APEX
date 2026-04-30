import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth, UserRole } from '../context/AuthContext';
import { Shield, Users, Settings, Crown, ArrowRight, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate(role === 'candidate' ? '/candidate/dashboard' : '/admin/dashboard');
  };

  const roles = [
    {
      id: 'candidate',
      label: 'Candidate',
      subtitle: 'Take assessments & track progress',
      icon: Users,
      gradient: 'linear-gradient(135deg, #0F4C75, #1B9AAA)',
      glow: 'rgba(27,154,170,0.35)',
      badge: 'Participant',
    },
    {
      id: 'root-admin',
      label: 'Root Admin',
      subtitle: 'Full platform control & oversight',
      icon: Crown,
      gradient: 'linear-gradient(135deg, #E8B960, #d4a843)',
      glow: 'rgba(232,185,96,0.35)',
      badge: 'Full Access',
    },
    {
      id: 'batch-admin',
      label: 'Batch Admin',
      subtitle: 'Manage assigned candidate batches',
      icon: Settings,
      gradient: 'linear-gradient(135deg, #1B9AAA, #0F4C75)',
      glow: 'rgba(15,76,117,0.35)',
      badge: 'Manager',
    },
    {
      id: 'shared-admin',
      label: 'Shared Admin',
      subtitle: 'Co-manage batches with teams',
      icon: Users,
      gradient: 'linear-gradient(135deg, #E07A5F, #c96a50)',
      glow: 'rgba(224,122,95,0.35)',
      badge: 'Collaborator',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)',
                boxShadow: '0 0 40px rgba(27,154,170,0.35), 0 0 80px rgba(15,76,117,0.15)',
              }}
            >
              <Shield className="w-8 h-8 text-white" />
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
            </div>
          </div>
          <h1 className="mb-3" style={{ fontSize: '2rem', color: '#0F4C75' }}>
            Enterprise Assessment Suite
          </h1>
          <p className="text-sm" style={{ color: '#636E72' }}>Select your role to continue</p>
        </div>

        {/* Role cards */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(15,76,117,0.12)',
            boxShadow: '0 8px 32px rgba(15,76,117,0.12)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {roles.map((role) => {
              const isHovered = hovered === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleLogin(role.id as UserRole)}
                  onMouseEnter={() => setHovered(role.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative text-left p-5 rounded-2xl transition-all duration-300 overflow-hidden"
                  style={{
                    background: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                    border: isHovered ? '1px solid rgba(15,76,117,0.2)' : '1px solid rgba(15,76,117,0.08)',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHovered ? `0 12px 40px ${role.glow}` : '0 2px 8px rgba(15,76,117,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: role.gradient,
                        boxShadow: isHovered ? `0 0 20px ${role.glow}` : 'none',
                        transition: 'box-shadow 0.3s',
                      }}
                    >
                      <role.icon className="w-5 h-5 text-white" />
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background: 'rgba(15,76,117,0.07)',
                        color: '#636E72',
                        border: '1px solid rgba(15,76,117,0.1)',
                      }}
                    >
                      {role.badge}
                    </span>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2" style={{ color: '#0F4C75' }}>
                      {role.label}
                      <ArrowRight
                        className="w-4 h-4 transition-all duration-300"
                        style={{
                          opacity: isHovered ? 1 : 0,
                          transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: '#636E72' }}>{role.subtitle}</p>
                  </div>
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${role.glow} 0%, transparent 60%)`,
                      opacity: isHovered ? 0.12 : 0,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4"
            style={{ borderTop: '1px solid rgba(15,76,117,0.08)' }}>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: 'rgba(15,76,117,0.3)' }} />
              <span className="text-xs" style={{ color: '#636E72' }}>
                Secure · On-Premise · Enterprise
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
