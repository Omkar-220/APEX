import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Clock, Users, BookOpen, Send, AlertCircle } from 'lucide-react';
import { mockQuestionBatches, mockCandidateBatches } from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const CreateTest: React.FC = () => {
  const navigate = useNavigate();
  const [testTitle, setTestTitle] = useState('');
  const [selectedQuestionBatch, setSelectedQuestionBatch] = useState('');
  const [selectedCandidateBatch, setSelectedCandidateBatch] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [assignmentType, setAssignmentType] = useState<'batch' | 'individual'>('batch');
  const [individualEmail, setIndividualEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!testTitle || !selectedQuestionBatch || !scheduledDate || !scheduledTime || !duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (assignmentType === 'batch' && !selectedCandidateBatch) {
      toast.error('Please select a candidate batch');
      return;
    }

    if (assignmentType === 'individual' && !individualEmail) {
      toast.error('Please enter a candidate email');
      return;
    }

    toast.success('Test assignment created successfully!', {
      description: 'Notifications will be sent to candidates via Teams',
    });

    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 1500);
  };

  const selectedQBatch = mockQuestionBatches.find((qb) => qb.id === selectedQuestionBatch);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-900 dark:text-white">Create Test Assignment</h1>
          <p className="text-gray-600 dark:text-gray-400">Schedule and assign tests to candidates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Test Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Test Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g., React Fundamentals Assessment"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Question Batch <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedQuestionBatch}
                  onChange={(e) => setSelectedQuestionBatch(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a question batch</option>
                  {mockQuestionBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} - {batch.questionCount} questions ({batch.difficulty})
                    </option>
                  ))}
                </select>

                {selectedQBatch && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        Domain: {selectedQBatch.domain} | Topic: {selectedQBatch.topic}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Scheduled Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Scheduled Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Duration (minutes) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="300"
                  placeholder="60"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Assignment Target */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Assign To</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAssignmentType('batch')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    assignmentType === 'batch'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-gray-900 dark:text-white">Candidate Batch</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignmentType('individual')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    assignmentType === 'individual'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-gray-900 dark:text-white">Individual Candidate</div>
                </button>
              </div>

              {assignmentType === 'batch' ? (
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Select Candidate Batch <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={selectedCandidateBatch}
                    onChange={(e) => setSelectedCandidateBatch(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={assignmentType === 'batch'}
                  >
                    <option value="">Select a candidate batch</option>
                    {mockCandidateBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} - {batch.candidateCount} candidates
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Candidate Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={individualEmail}
                    onChange={(e) => setIndividualEmail(e.target.value)}
                    placeholder="candidate@company.com"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={assignmentType === 'individual'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Teams Integration Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-900 dark:text-blue-400 mb-1">Automatic Notifications</h3>
                <p className="text-sm text-blue-800 dark:text-blue-500">
                  Test invitations will be sent via Microsoft Teams adaptive cards 5 minutes before the scheduled
                  start time. The test will also be added to candidates' Teams calendars.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
            >
              <Send className="w-5 h-5" />
              Create & Schedule Test
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateTest;
