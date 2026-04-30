import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Video,
  Mic,
  StickyNote,
  Pencil,
  Eraser,
  Flag,
} from 'lucide-react';
import { mockTests, mockQuestionBatches } from '../data/mockData';
import { toast } from 'sonner';

const TestInterface: React.FC = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [focusWarnings, setFocusWarnings] = useState(0);
  const focusWarningsRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  const test = mockTests.find((t) => t.id === testId);
  const questionBatch = mockQuestionBatches.find((qb) => qb.id === test?.questionBatchId);
  const questions = questionBatch?.questions || [];

  useEffect(() => {
    if (!showGuidelines && test) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          if (prev === 300) {
            toast.warning('5 minutes remaining!');
          }
          if (prev === 60) {
            toast.error('1 minute remaining!');
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showGuidelines, test]);

  // Warn on focus loss (covers split-screen, alt-tab, other apps)
  useEffect(() => {
    if (showGuidelines) return;

    const handleFocusLoss = () => {
      if (isSubmittingRef.current) return;
      focusWarningsRef.current += 1;
      const remaining = 3 - focusWarningsRef.current;
      setFocusWarnings(focusWarningsRef.current);

      if (focusWarningsRef.current >= 3) {
        toast.error('Test auto-submitted: focus left the exam 3 times.');
        setTimeout(handleSubmit, 1500);
      } else {
        toast.warning(
          `Warning ${focusWarningsRef.current}/3: Stay in the exam window. ${remaining} warning${remaining === 1 ? '' : 's'} left before auto-submit.`,
          { duration: 5000 }
        );
      }
    };

    // visibilitychange catches tab switch
    const handleVisibilityChange = () => {
      if (document.hidden) handleFocusLoss();
    };

    // window blur catches split-screen / other app focus
    window.addEventListener('blur', handleFocusLoss);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Re-enter fullscreen if user exits it
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleFocusLoss();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('blur', handleFocusLoss);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [showGuidelines]);

  // Canvas drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleStartTest = () => {
    setShowGuidelines(false);
    // Request fullscreen on test start
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
        toast.info('Removed from review queue');
      } else {
        newSet.add(currentQuestionIndex);
        toast.info('Marked for review');
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    isSubmittingRef.current = true;
    if (document.fullscreenElement) document.exitFullscreen();
    toast.success('Test submitted successfully!');
    setTimeout(() => {
      navigate(`/test-complete/${testId}`);
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (idx: number) => {
    if (markedForReview.has(idx)) return 'review';
    if (answers[idx] !== undefined) return 'answered';
    return 'unanswered';
  };

  if (showGuidelines) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl mb-2 text-gray-900 dark:text-white">Test Guidelines</h2>
            <p className="text-gray-600 dark:text-gray-400">{test?.title}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                1
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">Fullscreen Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The test will run in fullscreen. Exiting or switching tabs will auto-submit your test.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                2
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">Notes & Drawing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use the notes panel to type, draw, or scribble. Your notes are saved automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                3
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">Mark for Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mark questions to review later using the flag button. They'll be highlighted in orange.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition-colors text-lg"
          >
            I Accept - Start Test
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div ref={containerRef} className="h-screen bg-gray-900 flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-lg">{test?.title}</h2>
        </div>
        {focusWarnings > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-500/40">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm">{focusWarnings}/3 warnings</span>
          </div>
        )}

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showNotes ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <StickyNote className="w-5 h-5" />
            Notes
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <Video className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <Mic className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div
            className={`text-2xl px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'
            }`}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Question Grid */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-white mb-4 text-sm uppercase tracking-wide">Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((_, idx) => {
              const status = getQuestionStatus(idx);
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm transition-colors relative ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : status === 'answered'
                        ? 'bg-green-600 text-white'
                        : status === 'review'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status === 'review' && <Flag className="w-3 h-3 absolute top-1 right-1" />}
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              Current
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              Answered
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 bg-orange-500 rounded relative">
                <Flag className="w-2 h-2 absolute top-0.5 right-0.5 text-white" />
              </div>
              Review Later
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 bg-gray-700 rounded"></div>
              Not Answered
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`${showNotes ? 'w-2/3' : 'w-full'} flex flex-col bg-gray-900 transition-all`}>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-sm text-gray-400 mb-4">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>

                <div className="bg-gray-800 rounded-xl p-8 mb-6">
                  <h3 className="text-xl text-white mb-6">{currentQuestion?.text}</h3>

                  <div className="space-y-3">
                    {currentQuestion?.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          answers[currentQuestionIndex] === idx
                            ? 'border-blue-600 bg-blue-600/20 text-white'
                            : 'border-gray-700 bg-gray-700/50 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              answers[currentQuestionIndex] === idx
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-600'
                            }`}
                          >
                            {answers[currentQuestionIndex] === idx && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bg-gray-800 border-t border-gray-700 px-8 py-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleMarkForReview}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  markedForReview.has(currentQuestionIndex)
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <Flag className="w-4 h-4" />
                {markedForReview.has(currentQuestionIndex) ? 'Unmark' : 'Mark for Review'}
              </button>

              <div className="flex items-center gap-4">
                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Save & Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes Panel */}
          {showNotes && (
            <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white mb-4">Notes & Rough Work</h3>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setIsDrawing(false)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      !isDrawing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    Type
                  </button>
                  <button
                    onClick={() => setIsDrawing(true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      isDrawing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    Draw
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!isDrawing ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Type your notes here..."
                    className="w-full h-full p-4 bg-gray-900 text-white rounded-lg border border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setTool('pen')}
                        className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTool('eraser')}
                        className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        <Eraser className="w-4 h-4" />
                      </button>
                      <input
                        type="color"
                        value={drawColor}
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <button
                        onClick={clearCanvas}
                        className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Clear
                      </button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={600}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full bg-white rounded-lg cursor-crosshair"
                    />
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
