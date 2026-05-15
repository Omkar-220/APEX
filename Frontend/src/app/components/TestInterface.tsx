import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  Check, ChevronLeft, ChevronRight, AlertCircle,
  StickyNote, Pencil, Eraser, Flag, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  initializeExam, getQuestion, getQuestionByPosition, submitAnswer,
  finalizeExam, QuestionDisplayDto,
} from '../services/apiService';
import { setSessionId } from '../services/api';
import { useExamPoll } from '../hooks/useExamPoll';

const TestInterface: React.FC = () => {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignmentId') ?? '';
  const navigate = useNavigate();

  // ── Exam state ──────────────────────────────────────────────────────────────
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [sessionId, setLocalSessionId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDisplayDto | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // position -> selectedOption
  const [questionIds, setQuestionIds] = useState<Record<number, string>>({}); // position -> questionId
  const [idempotencyKeys, setIdempotencyKeys] = useState<Record<string, string>>({}); // questionId -> key
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());

  // ── Lockdown state ──────────────────────────────────────────────────────────
  const [focusWarnings, setFocusWarnings] = useState(0);
  const [showReturnOverlay, setShowReturnOverlay] = useState(false);
  const focusWarningsRef = useRef(0);
  const returnOverlayRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // ── Notes / drawing ─────────────────────────────────────────────────────────
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Polling ─────────────────────────────────────────────────────────────────
  const { status } = useExamPoll({
    sessionId: sessionId ?? '',
    enabled: !!sessionId && !showGuidelines,
  });

  // Sync answered count from poll
  const answeredCount = status?.answeredCount ?? Object.keys(answers).length;

  // ── Initialize exam ─────────────────────────────────────────────────────────
  const handleStartTest = async () => {
    if (!testId || !assignmentId) {
      toast.error('Missing test or assignment ID.');
      return;
    }
    setInitializing(true);
    try {
      const result = await initializeExam(testId, assignmentId);
      if (!result?.sessionId || !result?.firstQuestionId) {
        toast.error('Failed to start exam: invalid server response.');
        return;
      }
      setLocalSessionId(result.sessionId);
      setSessionId(result.sessionId);
      setTotalQuestions(result.totalQuestions);
      setShowGuidelines(false);
      await loadQuestion(result.sessionId, result.firstQuestionId, 0);
      document.documentElement.requestFullscreen().catch(() => {});
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Failed to start exam.';
      const code = err?.response?.data?.error?.code;
      if (code === 'MAX_ATTEMPTS_EXCEEDED') {
        toast.error('You have used all attempts for this test.');
      } else if (code === 'INVALID_TIME_WINDOW') {
        toast.error('This test is not available right now.');
      } else {
        toast.error(msg);
      }
    } finally {
      setInitializing(false);
    }
  };

  // ── Load question ───────────────────────────────────────────────────────────
  const loadQuestion = useCallback(async (sid: string, questionId: string, position: number) => {
    setQuestionLoading(true);
    try {
      const q = await getQuestion(sid, questionId);
      setCurrentQuestion(q);
      setCurrentQuestionIndex(position);
      setQuestionIds((prev) => ({ ...prev, [position]: questionId }));
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';
      toast.error(`Failed to load question. [${status}] ${msg}`);
      console.error('loadQuestion failed', { sid, questionId, status, msg, err });
    } finally {
      setQuestionLoading(false);
    }
  }, []);

  // Navigate to question by position
  const navigateToQuestion = useCallback(async (position: number) => {
    if (!sessionId || position < 0 || position >= totalQuestions) return;
    setQuestionLoading(true);
    try {
      const knownId = questionIds[position];
      let q: QuestionDisplayDto;
      if (knownId) {
        q = await getQuestion(sessionId, knownId);
      } else {
        // Fetch by position — works for any question regardless of visit history
        q = await getQuestionByPosition(sessionId, position + 1); // 1-indexed on backend
      }
      setCurrentQuestion(q);
      setCurrentQuestionIndex(position);
      setQuestionIds(prev => ({ ...prev, [position]: q.id }));
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';
      toast.error(`Failed to load question. [${status}] ${msg}`);
      console.error('navigateToQuestion failed', { position, status, msg, err });
    } finally {
      setQuestionLoading(false);
    }
  }, [sessionId, questionIds, totalQuestions]);

  // ── Submit answer ───────────────────────────────────────────────────────────
  const handleAnswerSelect = async (option: string) => {
    if (!sessionId || !currentQuestion) return;

    const questionId = currentQuestion.id;
    const position = currentQuestionIndex;

    // Generate or reuse idempotency key
    let key = idempotencyKeys[`${questionId}:${option}`];
    if (!key) {
      key = crypto.randomUUID();
      setIdempotencyKeys((prev) => ({ ...prev, [`${questionId}:${option}`]: key }));
    }

    setAnswers((prev) => ({ ...prev, [position]: option }));

    try {
      await submitAnswer(sessionId, questionId, option, key);
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data;
      console.error('submitAnswer failed', { status, body, sessionId, questionId, option, key });
      if (status !== 409) {
        toast.error(`Failed to save answer. [${status}] ${body?.error?.message ?? 'Unknown error'}`);
      }
    }
  };

  // ── Finalize ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!sessionId || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (document.fullscreenElement) document.exitFullscreen();

    try {
      await finalizeExam(sessionId);
      toast.success('Test submitted successfully!');
      setTimeout(() => navigate(`/test-complete/${sessionId}`), 1000);
    } catch {
      toast.error('Failed to submit. Please try again.');
      isSubmittingRef.current = false;
    }
  }, [sessionId, navigate]);

  // ── Lockdown ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showGuidelines) return;

    const handleViolation = (reason: string) => {
      if (isSubmittingRef.current) return;
      focusWarningsRef.current += 1;
      const count = focusWarningsRef.current;
      setFocusWarnings(count);

      if (count >= 3) {
        toast.error('Test auto-submitted: too many violations.');
        setTimeout(handleSubmit, 1500);
        return;
      }
      toast.warning(`Warning ${count}/3: ${reason}. ${3 - count} warning(s) left.`, { duration: 5000 });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmittingRef.current) {
        returnOverlayRef.current = true;
        setShowReturnOverlay(true);
        handleViolation('Fullscreen was exited');
      } else {
        returnOverlayRef.current = false;
        setShowReturnOverlay(false);
      }
    };

    const handleVisibilityChange = () => { if (document.hidden) handleViolation('Tab was switched'); };
    const handleBlur = () => { if (!returnOverlayRef.current) handleViolation('Window lost focus'); };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [showGuidelines, handleSubmit]);

  // ── Canvas drawing ──────────────────────────────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : drawColor;
    ctx.lineWidth = tool === 'eraser' ? 20 : 2;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (idx: number) => {
    if (markedForReview.has(idx)) return 'review';
    if (answers[idx]) return 'answered';
    return 'unanswered';
  };

  // ── Guidelines screen ───────────────────────────────────────────────────────
  if (showGuidelines) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl mb-2 text-gray-900">Test Guidelines</h2>
          </div>

          <div className="space-y-4 mb-8">
            {[
              { n: 1, title: 'Fullscreen Mode', desc: 'The test runs in fullscreen. Exiting triggers a warning. 3 warnings = auto-submit.' },
              { n: 2, title: 'Tab Switching', desc: 'Switching tabs or windows counts as a violation.' },
              { n: 3, title: 'Notes & Drawing', desc: 'Use the notes panel to type or draw rough work.' },
              { n: 4, title: 'Mark for Review', desc: 'Flag questions to revisit before submitting.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">{n}</div>
                <div>
                  <h3 className="text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartTest}
            disabled={initializing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-4 rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
          >
            {initializing ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting...</> : 'I Accept — Start Test'}
          </button>
        </div>
      </div>
    );
  }

  // ── Exam screen ─────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden select-none">

      {/* Fullscreen return overlay */}
      {showReturnOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }}>
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)' }}>
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl text-white mb-3">Fullscreen Required</h2>
            <p className="text-gray-400 mb-2">You exited fullscreen. The exam must run in fullscreen.</p>
            <p className="text-sm text-gray-500 mb-8">
              Warning {focusWarnings}/3 — {3 - focusWarnings} warning(s) remaining.
            </p>
            <button
              onClick={() => {
                document.documentElement.requestFullscreen().then(() => {
                  setShowReturnOverlay(false);
                  returnOverlayRef.current = false;
                }).catch(() => {});
              }}
              className="px-8 py-4 rounded-xl text-white text-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)', boxShadow: '0 0 30px rgba(27,154,170,0.4)' }}
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="text-white text-lg">Exam in Progress</div>

        <div className="flex items-center gap-4">
          {focusWarnings > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-500/40">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm">{focusWarnings}/3 warnings</span>
            </div>
          )}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showNotes ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            <StickyNote className="w-5 h-5" /> Notes
          </button>
          <div
            className={`text-2xl px-4 py-2 rounded-lg ${(status?.timeRemainingSec ?? 9999) < 300 ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}
          >
            {formatTime(status?.timeRemainingSec ?? 0)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question grid sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-white mb-4 text-sm uppercase tracking-wide">
            Questions ({answeredCount}/{totalQuestions})
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalQuestions }, (_, idx) => {
              const s = getQuestionStatus(idx);
              return (
                <button
                  key={idx}
                  onClick={() => navigateToQuestion(idx)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm transition-colors relative ${
                    idx === currentQuestionIndex ? 'bg-blue-600 text-white'
                    : s === 'answered' ? 'bg-green-600 text-white'
                    : s === 'review' ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {s === 'review' && <Flag className="w-3 h-3 absolute top-1 right-1" />}
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 text-xs">
            {[
              { color: 'bg-blue-600', label: 'Current' },
              { color: 'bg-green-600', label: 'Answered' },
              { color: 'bg-orange-500', label: 'Review Later' },
              { color: 'bg-gray-700', label: 'Not Answered' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-gray-400">
                <div className={`w-4 h-4 ${color} rounded`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`${showNotes ? 'w-2/3' : 'w-full'} flex flex-col bg-gray-900 transition-all`}>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-sm text-gray-400 mb-4">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>

                {questionLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : currentQuestion ? (
                  <div className="bg-gray-800 rounded-xl p-8 mb-6">
                    <h3 className="text-xl text-white mb-6">{currentQuestion.content}</h3>
                    <div className="space-y-3">
                      {Object.entries(currentQuestion.options).map(([key, text]) => (
                        <button
                          key={key}
                          onClick={() => handleAnswerSelect(key)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            answers[currentQuestionIndex] === key
                              ? 'border-blue-600 bg-blue-600/20 text-white'
                              : 'border-gray-700 bg-gray-700/50 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              answers[currentQuestionIndex] === key ? 'border-blue-600 bg-blue-600' : 'border-gray-600'
                            }`}>
                              {answers[currentQuestionIndex] === key && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span><strong>{key}.</strong> {text}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bottom nav */}
            <div className="bg-gray-800 border-t border-gray-700 px-8 py-4 flex items-center justify-between">
              <button
                onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={() => {
                  setMarkedForReview((prev) => {
                    const s = new Set(prev);
                    if (s.has(currentQuestionIndex)) { s.delete(currentQuestionIndex); toast.info('Removed from review'); }
                    else { s.add(currentQuestionIndex); toast.info('Marked for review'); }
                    return s;
                  });
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  markedForReview.has(currentQuestionIndex) ? 'bg-orange-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <Flag className="w-4 h-4" />
                {markedForReview.has(currentQuestionIndex) ? 'Unmark' : 'Mark for Review'}
              </button>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <button onClick={handleSubmit} className="px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700">
                  Submit Test
                </button>
              ) : (
                <button
                  onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save & Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notes panel */}
          {showNotes && (
            <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white mb-4">Notes & Rough Work</h3>
                <div className="flex gap-2 mb-4">
                  {(['Type', 'Draw'] as const).map((mode) => (
                    <button key={mode} onClick={() => setIsDrawing(mode === 'Draw')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${(mode === 'Draw') === isDrawing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {!isDrawing ? (
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Type your notes here..."
                    className="w-full h-full p-4 bg-gray-900 text-white rounded-lg border border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setTool('pen')} className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setTool('eraser')} className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}><Eraser className="w-4 h-4" /></button>
                      <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                      <button onClick={() => { const c = canvasRef.current; if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height); }}
                        className="px-3 py-2 bg-red-600 text-white rounded text-sm">Clear</button>
                    </div>
                    <canvas ref={canvasRef} width={400} height={600}
                      onMouseDown={startDrawing} onMouseMove={draw}
                      onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)}
                      className="w-full bg-white rounded-lg cursor-crosshair" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestInterface;
