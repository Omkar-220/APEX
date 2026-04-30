import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Upload, UserPlus, UserMinus, Share2, AlertCircle, Download } from 'lucide-react';
import { mockCandidateBatches } from '../data/mockData';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../context/AuthContext';

const BatchEditor: React.FC = () => {
  const { batchId } = useParams();
  const { user } = useAuth();
  const batch = mockCandidateBatches.find((b) => b.id === batchId);

  const [candidates, setCandidates] = useState([
    'alex.johnson@company.com',
    'sarah.chen@company.com',
    'michael.brown@company.com',
    'emma.davis@company.com',
  ]);
  const [newEmail, setNewEmail] = useState('');
  const [coOwnerEmail, setCoOwnerEmail] = useState('');

  const handleAddCandidate = () => {
    if (newEmail && newEmail.includes('@')) {
      setCandidates([...candidates, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveCandidate = (email: string) => {
    setCandidates(candidates.filter((c) => c !== email));
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`File "${file.name}" uploaded successfully. Processing...`);
    }
  };

  const handleShareBatch = () => {
    if (coOwnerEmail && coOwnerEmail.includes('@')) {
      alert(`Batch shared with ${coOwnerEmail} as co-owner. They can view and edit but cannot delete the batch.`);
      setCoOwnerEmail('');
    }
  };

  const isCoOwner = user?.role === 'co-owner';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-900 dark:text-white">Edit Candidate Batch</h1>
          <p className="text-gray-600 dark:text-gray-400">{batch?.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Candidate */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Add Candidates</h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="email"
                  placeholder="candidate@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCandidate()}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddCandidate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Bulk Upload from CSV/Excel
                  </span>
                  <input type="file" accept=".csv,.xlsx" onChange={handleBulkUpload} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                  Upload a file with email addresses (one per row)
                </p>
              </div>
            </div>

            {/* Candidate List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-900 dark:text-white">
                Candidates ({candidates.length})
              </h2>
              <div className="space-y-2">
                {candidates.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white">{email}</span>
                    <button
                      onClick={() => handleRemoveCandidate(email)}
                      disabled={isCoOwner}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share Batch */}
            {!isCoOwner && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg mb-4 text-gray-900 dark:text-white">Share Batch</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Assign a co-owner who can view and edit this batch but cannot delete it.
                </p>
                <input
                  type="email"
                  placeholder="coowner@company.com"
                  value={coOwnerEmail}
                  onChange={(e) => setCoOwnerEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />
                <button
                  onClick={handleShareBatch}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share as Co-owner
                </button>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-blue-900 dark:text-blue-400 mb-1">Batch Management</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-500">
                    {isCoOwner
                      ? 'As a co-owner, you can add/edit candidates but cannot delete this batch.'
                      : 'You are the owner of this batch. Share access with co-owners to collaborate.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 text-gray-900 dark:text-white">Batch Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Candidates</span>
                  <span className="text-gray-900 dark:text-white">{candidates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created</span>
                  <span className="text-gray-900 dark:text-white">
                    {batch?.createdOn ? new Date(batch.createdOn).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Role</span>
                  <span className="text-gray-900 dark:text-white capitalize">
                    {isCoOwner ? 'Co-owner' : 'Owner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Download Template */}
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Download CSV Template
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchEditor;
