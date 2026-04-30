import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, CheckCircle, Clock, XCircle, Ban } from 'lucide-react';
import { mockTestAssignments, mockCandidateTestStatuses, mockTests } from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';

const TestStatusDetail: React.FC = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const assignment = mockTestAssignments.find((a) => a.testId === testId);
  const test = mockTests.find((t) => t.id === testId);
  const candidateStatuses = mockCandidateTestStatuses.filter((s) => s.testId === testId);

  const handleEndTest = (candidateEmail: string) => {
    if (confirm(`Are you sure you want to end the test for ${candidateEmail}? The test will be auto-submitted.`)) {
      toast.success('Test ended for candidate', {
        description: `${candidateEmail}'s test has been submitted. They have been notified.`,
      });
    }
  };

  if (!assignment || !test) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2">Test Not Found</h2>
          <button onClick={() => navigate('/admin/dashboard')} className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'ended-by-admin':
        return <Ban className="w-5 h-5 text-orange-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ended-by-admin':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <h1 className="text-3xl mb-2 text-gray-900 dark:text-white">{assignment.testName}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{assignment.batchName}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <div className="text-lg text-gray-900 dark:text-white capitalize">{assignment.status}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
              <div className="text-lg text-gray-900 dark:text-white">
                {assignment.completedCount}/{assignment.totalCandidates}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Average Score</span>
              <div className="text-lg text-gray-900 dark:text-white">
                {assignment.averageScore ? `${assignment.averageScore}%` : '-'}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Scheduled</span>
              <div className="text-lg text-gray-900 dark:text-white">
                {new Date(assignment.scheduledDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${(assignment.completedCount / assignment.totalCandidates) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Candidate Status Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl text-gray-900 dark:text-white">Candidate Status</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-gray-900 dark:text-white">Candidate</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-900 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-900 dark:text-white">Score</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-900 dark:text-white">Started At</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-900 dark:text-white">Finished At</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {candidateStatuses.map((status) => (
                  <tr key={status.candidateId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-gray-900 dark:text-white">{status.candidateName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{status.candidateEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status.status)}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${getStatusColor(status.status)}`}>
                          {status.status === 'not-started' && 'Not Started'}
                          {status.status === 'in-progress' && 'In Progress'}
                          {status.status === 'finished' && 'Finished'}
                          {status.status === 'ended-by-admin' && 'Ended by Admin'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {status.score !== undefined ? `${status.score}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {status.startedAt ? new Date(status.startedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {status.finishedAt ? new Date(status.finishedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {status.status === 'in-progress' && (
                        <button
                          onClick={() => handleEndTest(status.candidateEmail)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center gap-1"
                        >
                          <Ban className="w-4 h-4" />
                          End Test
                        </button>
                      )}
                      {status.status === 'finished' && (
                        <button
                          onClick={() => navigate(`/admin/assess/${testId}/${status.candidateId}`)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          View Results
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestStatusDetail;
