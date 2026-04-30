export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number; // undefined for descriptive questions
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'mcq' | 'descriptive';
  gradingType: 'auto-graded' | 'manual-review';
  weightage: number;
}

export interface QuestionBatch {
  id: string;
  name: string;
  domain: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  lastUsed: string;
  createdOn: string;
  createdBy: string;
  questions: Question[];
}

export interface CandidateBatch {
  id: string;
  name: string;
  candidateCount: number;
  createdOn: string;
  createdBy: string; // Batch Admin
  candidates: string[];
  sharedAdmins: string[]; // Other admins who can manage this batch
}

export interface Test {
  id: string;
  title: string;
  questionBatchId: string;
  candidateBatchId?: string;
  scheduledDate: string;
  duration: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'scheduled';
  score?: number;
  totalQuestions?: number;
  batchName?: string;
  domain?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface CandidateTestStatus {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  testId: string;
  status: 'not-started' | 'in-progress' | 'finished' | 'ended-by-admin';
  score?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface TestResult {
  testId: string;
  candidateId: string;
  answers: Record<string, number | string>; // question ID -> answer (index or text)
  score?: number;
  completedAt: string;
  needsManualReview: boolean;
  reviewedBy?: string;
  reviewStatus: 'pending' | 'in-review' | 'completed';
}

export interface TestAssignment {
  id: string;
  testId: string;
  testName: string;
  batchId: string;
  batchName: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  totalCandidates: number;
  completedCount: number;
  averageScore?: number;
  domain?: string;
  duration?: number;
}

export const mockQuestionBatches: QuestionBatch[] = [
  {
    id: 'qb-1',
    name: 'React Fundamentals',
    domain: 'Frontend Development',
    topic: 'React.js',
    difficulty: 'medium',
    questionCount: 20,
    lastUsed: '2026-04-30',
    createdOn: '2026-03-01',
    createdBy: 'admin@company.com',
    questions: [
      {
        id: 'q1',
        text: 'What is the primary purpose of React hooks?',
        options: [
          'To replace class components entirely',
          'To allow state and lifecycle features in functional components',
          'To improve performance of all components',
          'To enable server-side rendering',
        ],
        correctAnswer: 1,
        difficulty: 'medium',
        type: 'mcq',
        gradingType: 'auto-graded',
        weightage: 2,
      },
      {
        id: 'q2',
        text: 'Which hook would you use to perform side effects in a functional component?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 1,
        difficulty: 'easy',
        type: 'mcq',
        gradingType: 'auto-graded',
        weightage: 1,
      },
      {
        id: 'q3',
        text: 'Explain the Virtual DOM in React and how it improves performance.',
        options: [],
        difficulty: 'medium',
        type: 'descriptive',
        gradingType: 'manual-review',
        weightage: 5,
      },
    ],
  },
  {
    id: 'qb-2',
    name: 'Python Data Structures',
    domain: 'Programming',
    topic: 'Python',
    difficulty: 'hard',
    questionCount: 15,
    lastUsed: '2026-04-29',
    createdOn: '2026-02-20',
    createdBy: 'admin@company.com',
    questions: [],
  },
  {
    id: 'qb-3',
    name: 'SQL Queries Advanced',
    domain: 'Database',
    topic: 'SQL',
    difficulty: 'hard',
    questionCount: 25,
    lastUsed: '2026-04-05',
    createdOn: '2026-01-15',
    createdBy: 'admin@company.com',
    questions: [],
  },
  {
    id: 'qb-4',
    name: 'TypeScript Deep Dive',
    domain: 'Frontend Development',
    topic: 'TypeScript',
    difficulty: 'medium',
    questionCount: 18,
    lastUsed: '2026-04-20',
    createdOn: '2026-03-10',
    createdBy: 'admin@company.com',
    questions: [],
  },
  {
    id: 'qb-5',
    name: 'Machine Learning Basics',
    domain: 'Data Science',
    topic: 'ML Concepts',
    difficulty: 'hard',
    questionCount: 22,
    lastUsed: '2026-04-18',
    createdOn: '2026-02-28',
    createdBy: 'admin@company.com',
    questions: [],
  },
  {
    id: 'qb-6',
    name: 'System Design Principles',
    domain: 'Architecture',
    topic: 'System Design',
    difficulty: 'hard',
    questionCount: 12,
    lastUsed: '2026-04-22',
    createdOn: '2026-03-15',
    createdBy: 'admin@company.com',
    questions: [],
  },
];

export const mockCandidateBatches: CandidateBatch[] = [
  {
    id: 'cb-1',
    name: 'Frontend Team Q2 2026',
    candidateCount: 12,
    createdOn: '2026-03-01',
    createdBy: 'alex.johnson@company.com',
    candidates: [
      'sarah.chen@company.com',
      'michael.brown@company.com',
      'emma.davis@company.com',
      'james.wilson@company.com',
    ],
    sharedAdmins: ['sarah.chen@company.com'],
  },
  {
    id: 'cb-2',
    name: 'Data Science Interns',
    candidateCount: 8,
    createdOn: '2026-02-15',
    createdBy: 'john.doe@company.com',
    candidates: ['intern1@company.com', 'intern2@company.com'],
    sharedAdmins: [],
  },
  {
    id: 'cb-3',
    name: 'Backend Engineers Cohort',
    candidateCount: 10,
    createdOn: '2026-03-20',
    createdBy: 'alex.johnson@company.com',
    candidates: ['dev1@company.com', 'dev2@company.com'],
    sharedAdmins: [],
  },
];

export const mockTests: Test[] = [
  {
    id: 't-1',
    title: 'React Fundamentals Assessment',
    questionBatchId: 'qb-1',
    candidateBatchId: 'cb-1',
    scheduledDate: '2026-05-05T10:00:00',
    duration: 60,
    status: 'upcoming',
    totalQuestions: 20,
    batchName: 'Frontend Team Q2 2026',
    domain: 'Frontend Development',
    difficulty: 'medium',
  },
  {
    id: 't-2',
    title: 'Python Mastery Test',
    questionBatchId: 'qb-2',
    candidateBatchId: 'cb-2',
    scheduledDate: '2026-04-29T14:00:00',
    duration: 45,
    status: 'in-progress',
    totalQuestions: 15,
    batchName: 'Data Science Interns',
    domain: 'Programming',
    difficulty: 'hard',
  },
  {
    id: 't-3',
    title: 'JavaScript Basics',
    questionBatchId: 'qb-1',
    candidateBatchId: 'cb-1',
    scheduledDate: '2026-04-10T09:00:00',
    duration: 30,
    status: 'completed',
    score: 85,
    totalQuestions: 20,
    batchName: 'Frontend Team Q2 2026',
    domain: 'Frontend Development',
    difficulty: 'easy',
  },
  {
    id: 't-4',
    title: 'TypeScript Proficiency Test',
    questionBatchId: 'qb-4',
    candidateBatchId: 'cb-1',
    scheduledDate: '2026-05-08T11:00:00',
    duration: 55,
    status: 'upcoming',
    totalQuestions: 18,
    batchName: 'Frontend Team Q2 2026',
    domain: 'Frontend Development',
    difficulty: 'medium',
  },
  {
    id: 't-5',
    title: 'Machine Learning Fundamentals',
    questionBatchId: 'qb-5',
    candidateBatchId: 'cb-2',
    scheduledDate: '2026-05-12T14:30:00',
    duration: 75,
    status: 'upcoming',
    totalQuestions: 22,
    batchName: 'Data Science Interns',
    domain: 'Data Science',
    difficulty: 'hard',
  },
  {
    id: 't-6',
    title: 'System Design Interview Prep',
    questionBatchId: 'qb-6',
    candidateBatchId: 'cb-3',
    scheduledDate: '2026-05-15T09:30:00',
    duration: 90,
    status: 'upcoming',
    totalQuestions: 12,
    batchName: 'Backend Engineers Cohort',
    domain: 'Architecture',
    difficulty: 'hard',
  },
  {
    id: 't-7',
    title: 'SQL Advanced Queries',
    questionBatchId: 'qb-3',
    candidateBatchId: 'cb-2',
    scheduledDate: '2026-04-15T10:00:00',
    duration: 60,
    status: 'completed',
    score: 72,
    totalQuestions: 25,
    batchName: 'Data Science Interns',
    domain: 'Database',
    difficulty: 'hard',
  },
];

export const mockTestAssignments: TestAssignment[] = [
  {
    id: 'ta-1',
    testId: 't-2',
    testName: 'Python Mastery Test',
    batchId: 'cb-2',
    batchName: 'Data Science Interns',
    scheduledDate: '2026-04-29T14:00:00',
    status: 'in-progress',
    totalCandidates: 8,
    completedCount: 3,
    averageScore: 78,
    domain: 'Programming',
    duration: 45,
  },
  {
    id: 'ta-2',
    testId: 't-1',
    testName: 'React Fundamentals Assessment',
    batchId: 'cb-1',
    batchName: 'Frontend Team Q2 2026',
    scheduledDate: '2026-05-05T10:00:00',
    status: 'scheduled',
    totalCandidates: 12,
    completedCount: 0,
    domain: 'Frontend Development',
    duration: 60,
  },
  {
    id: 'ta-3',
    testId: 't-3',
    testName: 'JavaScript Basics',
    batchId: 'cb-1',
    batchName: 'Frontend Team Q2 2026',
    scheduledDate: '2026-04-10T09:00:00',
    status: 'completed',
    totalCandidates: 12,
    completedCount: 12,
    averageScore: 85,
    domain: 'Frontend Development',
    duration: 30,
  },
  {
    id: 'ta-4',
    testId: 't-4',
    testName: 'TypeScript Proficiency Test',
    batchId: 'cb-1',
    batchName: 'Frontend Team Q2 2026',
    scheduledDate: '2026-05-08T11:00:00',
    status: 'scheduled',
    totalCandidates: 12,
    completedCount: 0,
    domain: 'Frontend Development',
    duration: 55,
  },
  {
    id: 'ta-5',
    testId: 't-5',
    testName: 'Machine Learning Fundamentals',
    batchId: 'cb-2',
    batchName: 'Data Science Interns',
    scheduledDate: '2026-05-12T14:30:00',
    status: 'scheduled',
    totalCandidates: 8,
    completedCount: 0,
    domain: 'Data Science',
    duration: 75,
  },
  {
    id: 'ta-6',
    testId: 't-6',
    testName: 'System Design Interview Prep',
    batchId: 'cb-3',
    batchName: 'Backend Engineers Cohort',
    scheduledDate: '2026-05-15T09:30:00',
    status: 'scheduled',
    totalCandidates: 10,
    completedCount: 0,
    domain: 'Architecture',
    duration: 90,
  },
  {
    id: 'ta-7',
    testId: 't-7',
    testName: 'SQL Advanced Queries',
    batchId: 'cb-2',
    batchName: 'Data Science Interns',
    scheduledDate: '2026-04-15T10:00:00',
    status: 'completed',
    totalCandidates: 8,
    completedCount: 8,
    averageScore: 72,
    domain: 'Database',
    duration: 60,
  },
];

export const mockCandidateTestStatuses: CandidateTestStatus[] = [
  {
    candidateId: 'c1',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@company.com',
    testId: 't-2',
    status: 'finished',
    score: 92,
    startedAt: '2026-04-29T14:05:00',
    finishedAt: '2026-04-29T14:45:00',
  },
  {
    candidateId: 'c2',
    candidateName: 'Michael Brown',
    candidateEmail: 'michael.brown@company.com',
    testId: 't-2',
    status: 'in-progress',
    startedAt: '2026-04-29T14:10:00',
  },
  {
    candidateId: 'c3',
    candidateName: 'Emma Davis',
    candidateEmail: 'emma.davis@company.com',
    testId: 't-2',
    status: 'not-started',
  },
];

export const mockTestResults: TestResult[] = [
  {
    testId: 't-3',
    candidateId: 'c1',
    answers: { q1: 1, q2: 1, q3: 'The Virtual DOM is a lightweight copy...' },
    score: 8,
    completedAt: '2026-04-10T09:30:00',
    needsManualReview: true,
    reviewStatus: 'pending',
  },
  {
    testId: 't-3',
    candidateId: 'c2',
    answers: { q1: 1, q2: 1, q3: 'Virtual DOM explanation here...' },
    score: 7,
    completedAt: '2026-04-10T09:28:00',
    needsManualReview: true,
    reviewStatus: 'in-review',
    reviewedBy: 'admin@company.com',
  },
];

export const mockAchievements = [
  { id: '1', name: 'Perfect Score', icon: '🏆', earned: true, description: 'Score 100% on any test' },
  { id: '2', name: 'Fast Finisher', icon: '⚡', earned: true, description: 'Complete a test in under 15 mins' },
  { id: '3', name: 'Streak Master', icon: '🔥', earned: false, description: 'Complete 5 tests in a row' },
  { id: '4', name: 'Night Owl', icon: '🦉', earned: false, description: 'Take a test after midnight' },
  { id: '5', name: 'Top 3', icon: '🥉', earned: true, description: 'Rank in the top 3 on any leaderboard' },
  { id: '6', name: 'Consistent', icon: '📈', earned: false, description: 'Improve score 3 tests in a row' },
];

export const mockLeaderboard = [
  { rank: 1, name: 'Sarah Chen', score: 1850, tests: 12, trend: 'up' },
  { rank: 2, name: 'Alex Johnson', score: 1720, tests: 10, trend: 'same' },
  { rank: 3, name: 'Michael Brown', score: 1680, tests: 11, trend: 'up' },
  { rank: 4, name: 'Emma Davis', score: 1590, tests: 9, trend: 'down' },
  { rank: 5, name: 'James Wilson', score: 1520, tests: 8, trend: 'up' },
];
