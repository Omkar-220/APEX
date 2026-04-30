import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CheckCircle, ArrowRight, BarChart2 } from 'lucide-react';

const TestComplete: React.FC = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Stagger animations
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setShowButtons(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'transparent' }}
    >
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
              background: 'rgba(27,154,170,0.12)',
              border: '2px solid rgba(27,154,170,0.3)',
              boxShadow: '0 0 40px rgba(27,154,170,0.2)',
              animation: visible ? 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' : 'none',
            }}
          >
            <CheckCircle className="w-12 h-12" style={{ color: '#1B9AAA' }} />
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
          Test Submitted!
        </h1>
        <p
          style={{
            color: '#636E72',
            marginBottom: '2rem',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.45s',
          }}
        >
          Your answers have been recorded. Great work completing the assessment.
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
                background: i === 1 ? '#1B9AAA' : 'rgba(27,154,170,0.3)',
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
          <button
            onClick={() => navigate(`/test-review/${testId}`)}
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
            View Results & Review
            <ArrowRight className="w-4 h-4" />
          </button>

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
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default TestComplete;
