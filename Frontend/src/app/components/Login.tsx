import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login, loading, error, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      return;
    }
  };

  // Redirect once user is set (role comes from JWT)
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'Candidate' ? '/candidate/dashboard' : '/admin/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
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
          <h1 className="mb-2" style={{ fontSize: '1.75rem', color: '#0F4C75' }}>
            Enterprise Assessment Suite
          </h1>
          <p className="text-sm" style={{ color: '#636E72' }}>Sign in to continue</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(15,76,117,0.12)',
            boxShadow: '0 8px 32px rgba(15,76,117,0.12)',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#0F4C75' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(15,76,117,0.4)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(15,76,117,0.15)',
                    color: '#2D3436',
                  }}
                  onFocus={e => (e.target.style.border = '1px solid rgba(27,154,170,0.5)')}
                  onBlur={e => (e.target.style.border = '1px solid rgba(15,76,117,0.15)')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#0F4C75' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(15,76,117,0.4)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(15,76,117,0.15)',
                    color: '#2D3436',
                  }}
                  onFocus={e => (e.target.style.border = '1px solid rgba(27,154,170,0.5)')}
                  onBlur={e => (e.target.style.border = '1px solid rgba(15,76,117,0.15)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(15,76,117,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(224,122,95,0.1)',
                  border: '1px solid rgba(224,122,95,0.3)',
                  color: '#E07A5F',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)',
                boxShadow: '0 4px 16px rgba(27,154,170,0.3)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-xs mt-5" style={{ color: '#636E72' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium"
              style={{ color: '#1B9AAA', textDecoration: 'none' }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
