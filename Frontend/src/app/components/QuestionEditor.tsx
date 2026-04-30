import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Save,
  Copy,
  ArrowLeft,
  CheckCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { mockQuestionBatches, Question } from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const QuestionEditor: React.FC = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!batchId;
  const existingBatch = mockQuestionBatches.find((b) => b.id === batchId);

  const [batchName, setBatchName] = useState(existingBatch?.name || '');
  const [domain, setDomain] = useState(existingBatch?.domain || '');
  const [topic, setTopic] = useState(existingBatch?.topic || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    existingBatch?.difficulty || 'medium'
  );
  const [questions, setQuestions] = useState<Question[]>(
    existingBatch?.questions || [
      {
        id: `q-${Date.now()}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        difficulty: 'medium',
        type: 'mcq',
        gradingType: 'auto-graded',
        weightage: 1,
      },
    ]
  );

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        difficulty: 'medium',
        type: 'mcq',
        gradingType: 'auto-graded',
        weightage: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
      toast.success('Question removed');
    } else {
      toast.error('Must have at least one question');
    }
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = value;
    newQuestions[questionIndex].options = newOptions;
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length > 2) {
      newQuestions[questionIndex].options.splice(optionIndex, 1);
      setQuestions(newQuestions);
    } else {
      toast.error('Must have at least 2 options');
    }
  };

  const handleTypeChange = (index: number, type: 'mcq' | 'descriptive') => {
    const newQuestions = [...questions];
    newQuestions[index].type = type;
    newQuestions[index].gradingType = type === 'descriptive' ? 'manual-review' : 'auto-graded';
    if (type === 'descriptive') {
      newQuestions[index].options = [];
      delete newQuestions[index].correctAnswer;
    } else if (newQuestions[index].options.length === 0) {
      newQuestions[index].options = ['', '', '', ''];
      newQuestions[index].correctAnswer = 0;
    }
    setQuestions(newQuestions);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',');

      const importedQuestions: Question[] = lines.slice(1).map((line, idx) => {
        const values = line.split(',');
        const type = values[5]?.trim().toLowerCase() === 'descriptive' ? 'descriptive' : 'mcq';

        return {
          id: `q-${Date.now()}-${idx}`,
          text: values[0]?.trim() || '',
          options: type === 'mcq' ? [values[1], values[2], values[3], values[4]].filter((o) => o?.trim()) : [],
          correctAnswer: type === 'mcq' ? parseInt(values[6]) || 0 : undefined,
          difficulty: (values[7]?.trim() as 'easy' | 'medium' | 'hard') || 'medium',
          type,
          gradingType: type === 'descriptive' ? 'manual-review' : 'auto-graded',
          weightage: parseInt(values[8]) || 1,
        };
      });

      setQuestions(importedQuestions);
      toast.success(`Imported ${importedQuestions.length} questions from CSV`);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Question,Option 1,Option 2,Option 3,Option 4,Type,Correct Answer Index,Difficulty,Weightage',
      ...questions.map((q) => {
        const options = q.type === 'mcq' ? q.options : ['', '', '', ''];
        return [
          q.text,
          ...options.slice(0, 4),
          q.type,
          q.correctAnswer !== undefined ? q.correctAnswer : '',
          q.difficulty,
          q.weightage,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batchName || 'questions'}.csv`;
    a.click();
    toast.success('CSV template downloaded');
  };

  const handleSave = (saveAs: 'override' | 'new') => {
    if (!batchName || !domain || !topic) {
      toast.error('Please fill in batch name, domain, and topic');
      return;
    }

    if (questions.some((q) => !q.text)) {
      toast.error('All questions must have text');
      return;
    }

    if (saveAs === 'override') {
      toast.success('Question batch updated successfully');
    } else {
      toast.success('New question batch created successfully');
    }

    setTimeout(() => navigate('/admin/dashboard'), 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Question Bank' : 'Create Question Bank'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add questions with options, set correct answers, and configure grading
          </p>
        </div>

        {/* Batch Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Batch Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Batch Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., React Fundamentals"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Domain <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., Frontend Development"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Topic <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., React.js"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Import/Export */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Bulk Actions</h2>
          <div className="flex gap-4">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              Import from CSV
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>

            <button
              onClick={handleExportCSV}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Download CSV Template
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            CSV Format: Question, Option 1, Option 2, Option 3, Option 4, Type (mcq/descriptive), Correct Answer Index
            (0-3), Difficulty (easy/medium/hard), Weightage
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-gray-900 dark:text-white">Questions ({questions.length})</h2>
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div
              key={question.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-gray-900 dark:text-white">Question {qIndex + 1}</h3>
                <button
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Question Text <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={question.text}
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  placeholder="Enter your question here..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Question Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Question Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={question.type === 'mcq'}
                        onChange={() => handleTypeChange(qIndex, 'mcq')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">MCQ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={question.type === 'descriptive'}
                        onChange={() => handleTypeChange(qIndex, 'descriptive')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Descriptive</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Grading Type</label>
                  <select
                    value={question.gradingType}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, 'gradingType', e.target.value as 'auto-graded' | 'manual-review')
                    }
                    disabled={question.type === 'descriptive'}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                  >
                    <option value="auto-graded">Auto-graded</option>
                    <option value="manual-review">Manual Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Weightage (Points)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={question.weightage}
                    onChange={(e) => handleQuestionChange(qIndex, 'weightage', Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Options (MCQ only) */}
              {question.type === 'mcq' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-gray-700 dark:text-gray-300">
                      Options <span className="text-red-600">*</span>
                    </label>
                    <button
                      onClick={() => handleAddOption(qIndex)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={question.correctAnswer === oIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                          className="w-5 h-5 text-green-600"
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        {question.correctAnswer === oIndex && (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" title="Correct answer" />
                        )}
                        {question.options.length > 2 && (
                          <button
                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.type === 'descriptive' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">This is a descriptive question and will require manual grading.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg text-gray-900 dark:text-white mb-1">Ready to save?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose to {isEditMode ? 'update the existing batch or save as a new one' : 'create a new question bank'}
              </p>
            </div>
            <div className="flex gap-3">
              {isEditMode && (
                <button
                  onClick={() => handleSave('override')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Update Existing
                </button>
              )}
              <button
                onClick={() => handleSave('new')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Copy className="w-5 h-5" />
                Save as New
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuestionEditor;
