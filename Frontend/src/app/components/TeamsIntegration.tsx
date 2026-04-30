import React from 'react';
import { Calendar, Bell, MessageSquare, ExternalLink } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const TeamsIntegration: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-900 dark:text-white">Microsoft Teams Integration</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Seamless integration with Microsoft Teams for test notifications and scheduling
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adaptive Card Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl text-gray-900 dark:text-white">Teams Message Card</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Test invitations sent as adaptive cards 5 minutes before start time
            </p>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-l-4 border-blue-600">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">📝</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 dark:text-white mb-1">Assessment Suite</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Test starting soon</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3">
                <h4 className="text-gray-900 dark:text-white mb-2">React Fundamentals Assessment</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Starting: April 25, 2026 at 10:00 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center">⏱️</span>
                    <span>Duration: 60 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center">❓</span>
                    <span>20 questions</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                <ExternalLink className="w-4 h-4" />
                Start Test
              </button>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl text-gray-900 dark:text-white">Calendar Sync</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tests automatically added to Microsoft Teams calendar
            </p>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 dark:text-white">April 2026</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400">
                    Today
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-blue-600">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-gray-900 dark:text-white text-sm">React Assessment</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">10:00 AM</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Friday, April 25</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-green-600">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-gray-900 dark:text-white text-sm">Python Test</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2:00 PM</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tuesday, April 22</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification System */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl text-gray-900 dark:text-white">Smart Notifications</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Timely reminders sent via Teams notifications
            </p>

            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-blue-900 dark:text-blue-400 text-sm mb-1">Test Reminder</h4>
                    <p className="text-xs text-blue-800 dark:text-blue-500">
                      Your React assessment starts in 5 minutes
                    </p>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Just now</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-green-900 dark:text-green-400 text-sm mb-1">New Test Assigned</h4>
                    <p className="text-xs text-green-800 dark:text-green-500">
                      Python Mastery Test scheduled for April 22
                    </p>
                    <span className="text-xs text-green-600 dark:text-green-400">2 hours ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-purple-900 dark:text-purple-400 text-sm mb-1">Results Available</h4>
                    <p className="text-xs text-purple-800 dark:text-purple-500">
                      Your JavaScript test results are ready to view
                    </p>
                    <span className="text-xs text-purple-600 dark:text-purple-400">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl text-gray-900 dark:text-white">Teams Workflow</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Export scores and reports directly to Teams channels
            </p>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-gray-900 dark:text-white mb-3 text-sm">Export Options</h3>
              <div className="space-y-2">
                <button className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-sm">📊</span>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-900 dark:text-white">Download Excel</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Export locally</p>
                    </div>
                  </div>
                </button>

                <button className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-900 dark:text-white">Share to Teams Channel</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Post report to channel</p>
                    </div>
                  </div>
                </button>

                <button className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-900 dark:text-white">Schedule Workflow</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Automate exports</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Integration Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white text-sm mb-1">Automatic Calendar Sync</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tests added to Teams calendar with reminders
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white text-sm mb-1">Rich Adaptive Cards</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Interactive test invitations in Teams chat
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white text-sm mb-1">Smart Notifications</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Timely reminders 5 minutes before test start
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white text-sm mb-1">Results Export</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Share scores to Teams channels or download
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamsIntegration;
