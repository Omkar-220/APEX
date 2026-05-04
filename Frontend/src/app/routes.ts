import { createBrowserRouter } from 'react-router';
import { RootLayout, RootErrorBoundary } from './components/RootLayout';
import Login from './components/Login';
import CandidateDashboard from './components/CandidateDashboard';
import AdminDashboard from './components/AdminDashboard';
import TestInterface from './components/TestInterface';
import TestReview from './components/TestReview';
import BatchEditor from './components/BatchEditor';
import BatchesPage from './components/BatchesPage';
import QuestionsPage from './components/QuestionsPage';
import CreateTest from './components/CreateTest';
import UpcomingTestManager from './components/UpcomingTestManager';
import TestStatusDetail from './components/TestStatusDetail';
import AssessTest from './components/AssessTest';
import QuestionEditor from './components/QuestionEditor';
import TestComplete from './components/TestComplete';
import NotFound from './components/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: Login },

      // Candidate
      { path: 'candidate/dashboard', Component: CandidateDashboard },
      { path: 'test/:testId', Component: TestInterface },
      { path: 'test-review/:testId', Component: TestReview },
      { path: 'test-complete/:testId', Component: TestComplete },

      // Admin
      { path: 'admin/dashboard', Component: AdminDashboard },
      { path: 'admin/batches', Component: BatchesPage },
      { path: 'admin/batch/new', Component: BatchEditor },
      { path: 'admin/batch/:batchId', Component: BatchEditor },
      { path: 'admin/questions', Component: QuestionsPage },
      { path: 'admin/questions/create', Component: QuestionEditor },
      { path: 'admin/questions/:batchId', Component: QuestionEditor },
      { path: 'admin/create-test', Component: CreateTest },
      { path: 'admin/upcoming-test/:testId', Component: UpcomingTestManager },
      { path: 'admin/test-status/:testId', Component: TestStatusDetail },
      { path: 'admin/assess/:testId/:candidateId', Component: AssessTest },

      { path: '*', Component: NotFound },
    ],
  },
]);
