import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, Clock, Users, AlertCircle, X, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { mockTests, mockCandidateBatches } from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const UpcomingTestManager: React.FC = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const test = mockTests.find((t) => t.id === testId);
  const batch = mockCandidateBatches.find((b) => b.id === test?.candidateBatchId);

  const [scheduledDate, setScheduledDate] = useState(
    test?.scheduledDate ? test.scheduledDate.split('T')[0] : ''
  );
  const [scheduledTime, setScheduledTime] = useState(
    test?.scheduledDate ? test.scheduledDate.split('T')[1].substring(0, 5) : ''
  );
  const [selectedBatch, setSelectedBatch] = useState(test?.candidateBatchId || '');
  const [tempCandidates, setTempCandidates] = useState<string[]>(batch?.candidates || []);
  const [newCandidate, setNewCandidate] = useState('');
  const [applyChanges, setApplyChanges] = useState<'permanent' | 'temporary'>('temporary');

  const handlePostpone = () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select both date and time');
      return;
    }
    toast.success('Test postponed successfully', {
      description: `New schedule: ${new Date(scheduledDate + 'T' + scheduledTime).toLocaleString()}`,
    });
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this test? This action cannot be undone.')) {
      toast.success('Test cancelled successfully');
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    }
  };

  const handleReassign = () => {
    if (!selectedBatch) {
      toast.error('Please select a batch');
      return;
    }
    toast.success('Test reassigned successfully', {
      description: `Assigned to: ${mockCandidateBatches.find((b) => b.id === selectedBatch)?.name}`,
    });
  };

  const handleAddCandidate = () => {
    if (newCandidate && newCandidate.includes('@')) {
      setTempCandidates([...tempCandidates, newCandidate]);
      setNewCandidate('');
      toast.success('Candidate added');
    }
  };

  const handleRemoveCandidate = (email: string) => {
    setTempCandidates(tempCandidates.filter((c) => c !== email));
    toast.success('Candidate removed');
  };

  const handleApplyBatchChanges = () => {
    if (applyChanges === 'permanent') {
      toast.success('Batch updated permanently', {
        description: 'Changes will apply to all future tests',
      });
    } else {
      toast.success('Changes applied to this test only', {
        description: 'Original batch remains unchanged',
      });
    }
  };

  if (!test) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2">Test Not Found</h2>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-900 dark:text-white">Manage Upcoming Test</h1>
          <p className="text-gray-600 dark:text-gray-400">{test.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Postpone Test */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Postpone Test
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">New Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">New Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handlePostpone}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                Update Schedule
              </button>
            </div>

            {/* Reassign to Batch */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Reassign to Different Batch
              </h2>

              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-3 mb-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a batch</option>
                {mockCandidateBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batch.candidateCount} candidates)
                  </option>
                ))}
              </select>

              <button
                onClick={handleReassign}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                Reassign Test
              </button>
            </div>

            {/* Edit Batch Candidates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-green-600" />
                Edit Candidates for This Test
              </h2>

              <div className="flex gap-3 mb-4">
                <input
                  type="email"
                  placeholder="candidate@company.com"
                  value={newCandidate}
                  onChange={(e) => setNewCandidate(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCandidate()}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCandidate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {tempCandidates.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white text-sm">{email}</span>
                    <button
                      onClick={() => handleRemoveCandidate(email)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Apply Changes</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applyChanges"
                      value="temporary"
                      checked={applyChanges === 'temporary'}
                      onChange={() => setApplyChanges('temporary')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">For this test only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applyChanges"
                      value="permanent"
                      checked={applyChanges === 'permanent'}
                      onChange={() => setApplyChanges('permanent')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Update batch permanently</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleApplyBatchChanges}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Current Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 text-gray-900 dark:text-white">Current Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Test Name</span>
                  <div className="text-gray-900 dark:text-white">{test.title}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Current Batch</span>
                  <div className="text-gray-900 dark:text-white">{test.batchName}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
                  <div className="text-gray-900 dark:text-white">
                    {new Date(test.scheduledDate).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Duration</span>
                  <div className="text-gray-900 dark:text-white">{test.duration} minutes</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Questions</span>
                  <div className="text-gray-900 dark:text-white">{test.totalQuestions}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Candidates</span>
                  <div className="text-gray-900 dark:text-white">{tempCandidates.length}</div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h3 className="text-lg mb-4 text-red-900 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Danger Zone
              </h3>
              <p className="text-sm text-red-800 dark:text-red-400 mb-4">
                Cancel this test. This action cannot be undone. All candidates will be notified.
              </p>
              <button
                onClick={handleCancel}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Cancel Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UpcomingTestManager;
