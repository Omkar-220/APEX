import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle, XCircle, Save } from 'lucide-react';
import { mockExamTests, mockExamQuestionBatches, mockExamTestResults } from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const AssessTest: React.FC = () => {
  const { testId, candidateId } = useParams();
  const navigate = useNavigate();

  const test = mockExamTests.find((t) => t.id === testId);
  const questionBatch = mockExamQuestionBatches.find((qb) => qb.id === test?.questionBatchId);
  const testResult = mockExamTestResults.find((r) => r.testId === testId && r.candidateId === candidateId);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const descriptiveQuestions = questionBatch?.questions.filter((q) => q.type === 'descriptive') || [];

  const handleScoreChange = (questionId: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  const handleFeedbackChange = (questionId: string, text: string) => {
    setFeedback((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmitGrading = () => {
    toast.success('Assessment completed successfully', {
      description: 'Scores have been saved and candidate has been notified',
    });
    setTimeout(() => navigate('/admin/dashboard'), 1500);
  };

  if (!test || !questionBatch || !testResult) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2">Test Not Found</h2>
          <button onClick={() => navigate('/admin/dashboard')} className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

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

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <h1 className="text-3xl mb-2 text-gray-900 dark:text-white">Manual Assessment</h1>
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Test:</span> {test.title}
            </div>
            <div>
              <span className="font-medium">Candidate:</span> Sarah Chen
            </div>
            <div>
              <span className="font-medium">Submitted:</span> {new Date(testResult.completedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Auto-graded Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Auto-graded Questions</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</span>
              </div>
              <div className="text-2xl text-gray-900 dark:text-white">2</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Incorrect Answers</span>
              </div>
              <div className="text-2xl text-gray-900 dark:text-white">0</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Score</span>
              </div>
              <div className="text-2xl text-gray-900 dark:text-white">{testResult.score || 0} points</div>
            </div>
          </div>
        </div>

        {/* Descriptive Questions */}
        <div className="space-y-6">
          <h2 className="text-xl text-gray-900 dark:text-white">Descriptive Questions (Manual Review)</h2>

          {descriptiveQuestions.map((question, idx) => {
            const candidateAnswer = testResult.answers[question.id];
            const maxScore = question.weightage;

            return (
              <div
                key={question.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg text-gray-900 dark:text-white">Question {idx + 1}</h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                      Max: {maxScore} points
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{question.text}</p>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Candidate's Answer:</div>
                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {typeof candidateAnswer === 'string' ? candidateAnswer : 'No answer provided'}
                    </div>
                  </div>
                </div>

                {/* Scoring */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Award Points (0-{maxScore})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxScore}
                      value={scores[question.id] || 0}
                      onChange={(e) => handleScoreChange(question.id, Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Feedback (Optional)</label>
                    <input
                      type="text"
                      value={feedback[question.id] || ''}
                      onChange={(e) => handleFeedbackChange(question.id, e.target.value)}
                      placeholder="e.g., Good explanation, missing key points"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg text-gray-900 dark:text-white mb-1">Final Assessment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Score: {Object.values(scores).reduce((a, b) => a + b, 0) + (testResult.score || 0)} points
              </p>
            </div>
            <button
              onClick={handleSubmitGrading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
            >
              <Save className="w-5 h-5" />
              Submit Assessment
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssessTest;
