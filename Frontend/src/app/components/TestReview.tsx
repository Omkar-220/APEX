import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { CheckCircle, XCircle, Lock, ArrowLeft } from 'lucide-react';
import { mockExamTests, mockExamQuestionBatches, mockExamTestResults } from '../data/mockData';
import DashboardLayout from './DashboardLayout';

const TestReview: React.FC = () => {
  const { testId } = useParams(); // kept for backward compat — will be sessionId when API is wired
  const navigate = useNavigate();

  // Find result — by sessionId or testId
  const result = mockExamTestResults.find(
    (r) => r.sessionId === testId || r.testId === testId
  );
  const test = mockExamTests.find(
    (t) => t.id === (result?.testId ?? testId)
  );
  const questionBatch = mockExamQuestionBatches.find(
    (qb) => qb.id === test?.questionBatchId
  );
  const questions = questionBatch?.questions ?? [];

  if (!result || !test) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <p style={{ color: '#636E72' }}>Result not found.</p>
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="mt-4 text-sm"
            style={{ color: '#1B9AAA' }}
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const scorePercent = result.percentage;
  const passed = result.passed;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/candidate/dashboard')}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#636E72' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0F4C75')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#636E72')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Score banner */}
        <div
          className="rounded-2xl p-8 mb-6 text-white"
          style={{
            background: passed
              ? 'linear-gradient(135deg, #0F4C75, #1B9AAA)'
              : 'linear-gradient(135deg, #E07A5F, #c96a50)',
            boxShadow: passed
              ? '0 8px 32px rgba(15,76,117,0.2)'
              : '0 8px 32px rgba(224,122,95,0.2)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl mb-1">Test Review</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)' }}>{test.title}</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Completed {new Date(result.completedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-light">{scorePercent.toFixed(0)}%</div>
              <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                {result.score}/{result.totalWeightage} points
              </div>
              <div
                className="mt-1 text-sm px-3 py-1 rounded-full inline-block"
                style={{
                  background: passed ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                }}
              >
                {passed ? '✓ Passed' : '✗ Did not pass'}
              </div>
            </div>
          </div>
        </div>

        {/* Locked notice */}
        <div
          className="flex items-start gap-3 rounded-xl p-4 mb-6"
          style={{
            background: 'rgba(232,185,96,0.1)',
            border: '1px solid rgba(232,185,96,0.3)',
          }}
        >
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#E8B960' }} />
          <p className="text-sm" style={{ color: '#636E72' }}>
            This test cannot be retaken. Review your answers below to learn from your mistakes.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, idx) => {
            const candidateAnswer = result.answers[question.id];

            // For MCQ — compare index-based answer
            if (question.type === 'mcq') {
              const candidateIdx = typeof candidateAnswer === 'number' ? candidateAnswer : -1;
              const isCorrect = candidateIdx === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(14px)',
                    border: `1px solid ${isCorrect ? 'rgba(27,154,170,0.3)' : 'rgba(224,122,95,0.3)'}`,
                    boxShadow: '0 4px 16px rgba(15,76,117,0.06)',
                  }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {isCorrect
                      ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1B9AAA' }} />
                      : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#E07A5F' }} />
                    }
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="text-sm font-medium" style={{ color: '#636E72' }}>
                          Question {idx + 1}
                        </span>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            background: isCorrect ? 'rgba(27,154,170,0.12)' : 'rgba(224,122,95,0.12)',
                            color: isCorrect ? '#1B9AAA' : '#E07A5F',
                          }}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="mb-4" style={{ color: '#2D3436' }}>{question.text}</p>

                      <div className="space-y-2">
                        {question.options.map((option, optionIdx) => {
                          const isCorrectOption = optionIdx === question.correctAnswer;
                          const isCandidateAnswer = optionIdx === candidateIdx;
                          return (
                            <div
                              key={optionIdx}
                              className="p-3 rounded-xl flex items-center justify-between"
                              style={{
                                background: isCorrectOption
                                  ? 'rgba(27,154,170,0.08)'
                                  : isCandidateAnswer
                                  ? 'rgba(224,122,95,0.08)'
                                  : 'rgba(15,76,117,0.03)',
                                border: isCorrectOption
                                  ? '1px solid rgba(27,154,170,0.3)'
                                  : isCandidateAnswer
                                  ? '1px solid rgba(224,122,95,0.3)'
                                  : '1px solid rgba(15,76,117,0.08)',
                              }}
                            >
                              <span style={{ color: '#2D3436' }}>{option}</span>
                              <div className="flex gap-2">
                                {isCorrectOption && (
                                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#1B9AAA' }}>
                                    Correct
                                  </span>
                                )}
                                {isCandidateAnswer && !isCorrectOption && (
                                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#E07A5F' }}>
                                    Your answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Descriptive question
            return (
              <div
                key={question.id}
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(15,76,117,0.1)',
                  boxShadow: '0 4px 16px rgba(15,76,117,0.06)',
                }}
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="text-sm font-medium" style={{ color: '#636E72' }}>
                    Question {idx + 1} — Descriptive
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(232,185,96,0.12)',
                      color: '#E8B960',
                      border: '1px solid rgba(232,185,96,0.3)',
                    }}
                  >
                    Pending manual review
                  </span>
                </div>
                <p className="mb-3" style={{ color: '#2D3436' }}>{question.text}</p>
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{
                    background: 'rgba(15,76,117,0.04)',
                    border: '1px solid rgba(15,76,117,0.1)',
                    color: '#636E72',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {typeof candidateAnswer === 'string'
                    ? candidateAnswer
                    : 'No answer provided'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestReview;
