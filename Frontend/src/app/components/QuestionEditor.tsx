import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Save,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import { mockQuestionBatches } from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface QuestionForm {
  id: string;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
}

const emptyQuestion = (): QuestionForm => ({
  id: crypto.randomUUID(),
  content: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
});

const optionLabels = ['A', 'B', 'C', 'D'] as const;

const QuestionEditor: React.FC = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const existingBatch = mockQuestionBatches.find((b) => b.id === batchId);
  const isEditMode = !!existingBatch;

  // Batch mode: 'existing' = add to existing batch, 'new' = create new batch
  const [batchMode, setBatchMode] = useState<'existing' | 'new'>(
    isEditMode ? 'existing' : 'new'
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batchId || '');

  // New batch fields
  const [batchName, setBatchName] = useState('');
  const [domain, setDomain] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');

  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);

  const selectedBatch = mockQuestionBatches.find((b) => b.id === selectedBatchId);

  const handleAddQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('Must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof QuestionForm, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n').filter((line) => line.trim()).slice(1);

      const imported: QuestionForm[] = lines.map((line) => {
        const [content, optionA, optionB, optionC, optionD, correctOption] = line.split(',');
        const correct = correctOption?.trim().toUpperCase();
        return {
          id: crypto.randomUUID(),
          content: content?.trim() || '',
          optionA: optionA?.trim() || '',
          optionB: optionB?.trim() || '',
          optionC: optionC?.trim() || '',
          optionD: optionD?.trim() || '',
          correctOption: (['A', 'B', 'C', 'D'].includes(correct) ? correct : 'A') as 'A' | 'B' | 'C' | 'D',
        };
      });

      setQuestions(imported);
      toast.success(`Imported ${imported.length} questions`);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const rows = [
      'Content,Option A,Option B,Option C,Option D,Correct Option (A/B/C/D)',
      ...questions.map((q) =>
        [q.content, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption].join(',')
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-template.csv`;
    a.click();
    toast.success('CSV template downloaded');
  };

  const validate = (): boolean => {
    if (batchMode === 'new') {
      if (!batchName.trim()) { toast.error('Batch name is required'); return false; }
    } else {
      if (!selectedBatchId) { toast.error('Please select a batch'); return false; }
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) { toast.error(`Question ${i + 1}: content is required`); return false; }
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        toast.error(`Question ${i + 1}: all options are required`); return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    toast.success(
      batchMode === 'new'
        ? `Created batch "${batchName}" with ${questions.length} questions`
        : `Added ${questions.length} questions to "${selectedBatch?.name}"`
    );
    setTimeout(() => navigate('/admin/questions'), 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/questions')}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#636E72' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0F4C75')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#636E72')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </button>

        <div className="mb-8">
          <h1 className="text-2xl mb-1" style={{ color: '#0F4C75', fontWeight: 600 }}>
            {isEditMode ? 'Add Questions to Batch' : 'Create Questions'}
          </h1>
          <p className="text-sm" style={{ color: '#636E72' }}>
            Questions must belong to a batch. Select an existing batch or create a new one.
          </p>
        </div>

        {/* STEP 1 — Batch Selection */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(15,76,117,0.12)',
            boxShadow: '0 2px 12px rgba(15,76,117,0.06)',
          }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F4C75' }}>
            Step 1 — Select or Create a Batch
          </h2>

          {/* Toggle */}
          <div
            className="flex gap-1 p-1 rounded-xl mb-5"
            style={{ background: 'rgba(15,76,117,0.06)', width: 'fit-content' }}
          >
            {(['existing', 'new'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBatchMode(mode)}
                className="px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{
                  background: batchMode === mode ? 'rgba(15,76,117,0.12)' : 'transparent',
                  color: batchMode === mode ? '#0F4C75' : '#636E72',
                  border: batchMode === mode ? '1px solid rgba(15,76,117,0.2)' : '1px solid transparent',
                  fontWeight: batchMode === mode ? 600 : 400,
                }}
              >
                {mode === 'existing' ? 'Add to Existing Batch' : 'Create New Batch'}
              </button>
            ))}
          </div>

          {batchMode === 'existing' ? (
            <div className="relative">
              <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>
                Select Batch <span style={{ color: '#E07A5F' }}>*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(15,76,117,0.2)',
                    color: selectedBatchId ? '#2D3436' : '#636E72',
                  }}
                >
                  <option value="">— Choose a batch —</option>
                  {mockQuestionBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.questionCount} questions)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 pointer-events-none" style={{ color: '#636E72' }} />
              </div>
              {selectedBatch && (
                <p className="text-xs mt-2" style={{ color: '#1B9AAA' }}>
                  {selectedBatch.domain} · {selectedBatch.topic} · {selectedBatch.difficulty}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>
                  Batch Name <span style={{ color: '#E07A5F' }}>*</span>
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., Python Fundamentals Q3 2025"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(15,76,117,0.2)',
                    color: '#2D3436',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., Backend Development"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(15,76,117,0.2)',
                    color: '#2D3436',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Python"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(15,76,117,0.2)',
                    color: '#2D3436',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Difficulty</label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full px-4 py-3 rounded-xl text-sm appearance-none"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(15,76,117,0.2)',
                      color: '#2D3436',
                    }}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 pointer-events-none" style={{ color: '#636E72' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 — Questions */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(15,76,117,0.12)',
            boxShadow: '0 2px 12px rgba(15,76,117,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold" style={{ color: '#0F4C75' }}>
              Step 2 — Add Questions ({questions.length})
            </h2>
            <div className="flex gap-2">
              <label
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all"
                style={{
                  background: 'rgba(27,154,170,0.1)',
                  border: '1px solid rgba(27,154,170,0.25)',
                  color: '#1B9AAA',
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
                style={{
                  background: 'rgba(27,154,170,0.1)',
                  border: '1px solid rgba(27,154,170,0.25)',
                  color: '#1B9AAA',
                }}
              >
                <Download className="w-3.5 h-3.5" />
                CSV Template
              </button>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all text-white"
                style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {questions.map((question, qIndex) => (
              <div
                key={question.id}
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(15,76,117,0.03)',
                  border: '1px solid rgba(15,76,117,0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold" style={{ color: '#0F4C75' }}>
                    Question {qIndex + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: '#E07A5F' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>
                    Question Content <span style={{ color: '#E07A5F' }}>*</span>
                  </label>
                  <textarea
                    value={question.content}
                    onChange={(e) => handleQuestionChange(qIndex, 'content', e.target.value)}
                    placeholder="Enter your question here..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(15,76,117,0.15)',
                      color: '#2D3436',
                    }}
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {optionLabels.map((label) => {
                    const field = `option${label}` as keyof QuestionForm;
                    const isCorrect = question.correctOption === label;
                    return (
                      <div
                        key={label}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                        style={{
                          background: isCorrect ? 'rgba(27,154,170,0.08)' : 'rgba(255,255,255,0.9)',
                          border: isCorrect
                            ? '1px solid rgba(27,154,170,0.3)'
                            : '1px solid rgba(15,76,117,0.12)',
                        }}
                      >
                        <button
                          onClick={() => handleQuestionChange(qIndex, 'correctOption', label)}
                          className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                          style={{
                            borderColor: isCorrect ? '#1B9AAA' : '#B2BEC3',
                            background: isCorrect ? '#1B9AAA' : 'transparent',
                          }}
                          title="Mark as correct answer"
                        >
                          {isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <span
                          className="text-xs font-semibold w-4 flex-shrink-0"
                          style={{ color: isCorrect ? '#1B9AAA' : '#636E72' }}
                        >
                          {label}
                        </span>
                        <input
                          type="text"
                          value={question[field] as string}
                          onChange={(e) => handleQuestionChange(qIndex, field, e.target.value)}
                          placeholder={`Option ${label}`}
                          className="flex-1 text-sm bg-transparent outline-none"
                          style={{ color: '#2D3436' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => navigate('/admin/questions')}
            className="px-5 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: 'rgba(15,76,117,0.06)',
              border: '1px solid rgba(15,76,117,0.12)',
              color: '#636E72',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}
          >
            <Save className="w-4 h-4" />
            {batchMode === 'new' ? 'Create Batch & Save Questions' : 'Add Questions to Batch'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuestionEditor;
