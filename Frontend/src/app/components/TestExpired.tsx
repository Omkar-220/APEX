import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Clock, BarChart2, ArrowRight } from 'lucide-react';

const TestExpired: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setShowButtons(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="max-w-md w-full text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(224,122,95,0.12)',
              border: '2px solid rgba(224,122,95,0.3)',
              boxShadow: '0 0 40px rgba(224,122,95,0.2)',
              animation: visible ? 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' : 'none',
            }}
          >
            <Clock className="w-12 h-12" style={{ color: '#E07A5F' }} />
          </div>
        </div>

        {/* Text */}
        <h1
          className="mb-3"
          style={{
            fontSize: '2rem',
            color: '#0F4C75',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s',
          }}
        >
          Time's Up
        </h1>
        <p
          style={{
            color: '#636E72',
            marginBottom: '0.5rem',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.45s',
          }}
        >
          Your exam time has expired. Your answers have been automatically submitted.
        </p>
        <p
          style={{
            color: '#9ca3af',
            fontSize: '0.85rem',
            marginBottom: '2rem',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.5s',
          }}
        >
          Results will be available shortly once grading is complete.
        </p>

        {/* Divider dots */}
        <div
          className="flex justify-center gap-2 mb-8"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.55s',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i === 1 ? '#E07A5F' : 'rgba(224,122,95,0.3)',
                animation: visible ? `bounce 1.2s ease ${0.6 + i * 0.15}s infinite` : 'none',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div
          className="flex flex-col gap-3"
          style={{
            opacity: showButtons ? 1 : 0,
            transform: showButtons ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          {sessionId && (
            <button
              onClick={() => navigate(`/test-review/${sessionId}`)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-medium transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)',
                boxShadow: '0 4px 20px rgba(15,76,117,0.25)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(15,76,117,0.4)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(15,76,117,0.25)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <BarChart2 className="w-4 h-4" />
              View Results
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-all duration-200"
            style={{
              background: 'rgba(15,76,117,0.06)',
              color: '#0F4C75',
              border: '1px solid rgba(15,76,117,0.15)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.06)';
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default TestExpired;
