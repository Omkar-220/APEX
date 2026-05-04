// ─── Component-facing types (used by TestInterface, TestReview, AssessTest) ───

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[]; // index 0=A, 1=B, 2=C, 3=D
  correctAnswer: number; // index into options[]
  type: 'mcq' | 'descriptive';
  weightage: number;
}

export interface ExamTest {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScorePercent: number;
  questionBatchId: string;
  scheduledDate: string;
  score?: number;        // percentage, set after completion
  totalQuestions?: number;
}

export interface ExamQuestionBatch {
  id: string;
  name: string;
  questions: ExamQuestion[];
}

export interface ExamTestResult {
  sessionId: string;
  testId: string;
  candidateId: string;
  candidateEmail: string;
  testTitle: string;
  score: number;         // raw points (MCQ auto-graded)
  totalWeightage: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  needsManualReview: boolean;
  answers: Record<string, string | number>; // questionId -> candidate answer
}

// ─── Exam mock data ────────────────────────────────────────────────────────────

export const mockExamQuestionBatches: ExamQuestionBatch[] = [
  {
    id: 'eqb-1',
    name: 'React Fundamentals',
    questions: [
      {
        id: 'eq1',
        text: 'What is the primary purpose of React hooks?',
        options: [
          'To replace class components entirely',
          'To allow state and lifecycle features in functional components',
          'To improve performance of all components',
          'To enable server-side rendering',
        ],
        correctAnswer: 1,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'eq2',
        text: 'Which hook would you use to perform side effects in a functional component?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 1,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'eq3',
        text: 'What does the second argument to useEffect control?',
        options: [
          'The cleanup function',
          'The dependency array that determines when the effect re-runs',
          'The initial state value',
          'The component render priority',
        ],
        correctAnswer: 1,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'eq4',
        text: 'Which of the following correctly describes React\'s Virtual DOM?',
        options: [
          'A direct copy of the browser DOM stored in a database',
          'A lightweight in-memory representation of the real DOM used to compute minimal updates',
          'A server-side rendering technique',
          'A browser API for faster DOM manipulation',
        ],
        correctAnswer: 1,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'eq5',
        text: 'What is the correct way to update state based on the previous state in React?',
        options: [
          'setState(state + 1)',
          'setState(prev => prev + 1)',
          'state = state + 1',
          'setState({ value: state.value + 1 })',
        ],
        correctAnswer: 1,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'eq6',
        text: 'Explain the Virtual DOM in React and how it improves performance.',
        options: ['', '', '', ''],
        correctAnswer: 0,
        type: 'descriptive',
        weightage: 3,
      },
    ],
  },
  {
    id: 'eqb-2',
    name: 'Python Data Structures',
    questions: [
      {
        id: 'pq1',
        text: 'Which Python data structure uses key-value pairs?',
        options: ['List', 'Tuple', 'Dictionary', 'Set'],
        correctAnswer: 2,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'pq2',
        text: 'What is the time complexity of accessing an element in a Python list by index?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctAnswer: 2,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'pq3',
        text: 'Which of the following is immutable in Python?',
        options: ['List', 'Dictionary', 'Set', 'Tuple'],
        correctAnswer: 3,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'pq4',
        text: 'What does the pop() method do on a Python list?',
        options: [
          'Adds an element to the end',
          'Removes and returns the last element (or element at given index)',
          'Returns the last element without removing it',
          'Clears the entire list',
        ],
        correctAnswer: 1,
        type: 'mcq',
        weightage: 1,
      },
      {
        id: 'pq5',
        text: 'Describe the difference between a list and a tuple in Python.',
        options: ['', '', '', ''],
        correctAnswer: 0,
        type: 'descriptive',
        weightage: 3,
      },
    ],
  },
];

export const mockExamTests: ExamTest[] = [
  {
    id: 't-1',
    title: 'React Fundamentals Assessment',
    description: 'Core React concepts and hooks',
    durationMinutes: 60,
    passingScorePercent: 70,
    questionBatchId: 'eqb-1',
    scheduledDate: '2026-05-05T10:00:00Z',
    score: 85,
    totalQuestions: 6,
  },
  {
    id: 't-2',
    title: 'Python Mastery Test',
    durationMinutes: 45,
    passingScorePercent: 65,
    questionBatchId: 'eqb-2',
    scheduledDate: '2026-04-29T14:00:00Z',
    score: 78,
    totalQuestions: 5,
  },
  {
    id: 't-3',
    title: 'JavaScript Basics',
    durationMinutes: 30,
    passingScorePercent: 60,
    questionBatchId: 'eqb-1',
    scheduledDate: '2026-04-10T09:00:00Z',
    score: 90,
    totalQuestions: 6,
  },
];

export const mockExamTestResults: ExamTestResult[] = [
  {
    sessionId: 'sess-1',
    testId: 't-1',
    candidateId: 'c-1',
    candidateEmail: 'sarah.chen@company.com',
    testTitle: 'React Fundamentals Assessment',
    score: 4,
    totalWeightage: 8,
    percentage: 90,
    passed: true,
    completedAt: '2026-05-05T10:48:00Z',
    needsManualReview: true,
    answers: {
      eq1: 1,
      eq2: 1,
      eq3: 1,
      eq4: 1,
      eq5: 0, // wrong
      eq6: 'The Virtual DOM is a lightweight copy of the real DOM. React uses it to diff changes and apply only the minimal set of updates to the actual DOM, avoiding expensive full re-renders.',
    },
  },
  {
    sessionId: 'sess-4',
    testId: 't-2',
    candidateId: 'c-4',
    candidateEmail: 'intern1@company.com',
    testTitle: 'Python Mastery Test',
    score: 3,
    totalWeightage: 7,
    percentage: 78,
    passed: true,
    completedAt: '2026-04-29T14:50:00Z',
    needsManualReview: true,
    answers: {
      pq1: 2,
      pq2: 2,
      pq3: 3,
      pq4: 0, // wrong
      pq5: 'A list is mutable — you can change its elements after creation. A tuple is immutable — once created, its elements cannot be changed. Tuples are generally faster and used for fixed data.',
    },
  },
];

// ─── Enums (aligned to backend) ──────────────────────────────────────────────

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type AssignmentStatus = 'Pending' | 'Active' | 'Completed' | 'Expired';

export type SessionStatus = 'Active' | 'Completed' | 'Expired';

export type QuestionType = 'mcq' | 'descriptive';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  type: QuestionType;
  weightage: number; // default 1, configurable
  createdBy: string;
  createdAt: string;
}

export interface QuestionBatch {
  id: string;
  name: string;
  domain?: string;
  topic?: string;
  difficulty?: Difficulty;
  questionCount: number;
  lastUsed: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  questions: Question[];
}

export interface CandidateBatch {
  id: string;
  name: string;
  domain?: string;
  topic?: string;
  difficulty?: Difficulty;
  candidateCount: number;
  createdAt: string;
  isActive: boolean;
  // Admins who manage this batch — all have equal ownership privileges
  adminEmails: string[];
  // Candidate emails (frontend uses email, backend uses GUID)
  candidates: string[];
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScorePercent: number;
  isActive: boolean;
  createdAt: string;
}

export interface TestAssignment {
  id: string;
  testId: string;
  testTitle: string;
  questionBatchId: string;
  questionBatchName: string;
  // Either batchId or candidateEmail — not both
  batchId?: string;
  batchName?: string;
  candidateEmail?: string;
  questionCount: number;
  scheduledStart: string;
  deadline: string;
  status: AssignmentStatus;
  maxAttempts: number;
  createdAt: string;
  // Computed fields for display
  totalCandidates: number;
  completedCount: number;
  // Active sessions count (candidates currently taking the test)
  activeSessions: number;
  averageScore?: number;
  domain?: string;
  durationMinutes: number;
}

export interface TestSession {
  sessionId: string;
  assignmentId: string;
  candidateEmail: string;
  candidateName: string;
  testTitle: string;
  attemptNumber: number;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  score?: number;
  totalQuestions: number;
}

export interface TestResult {
  sessionId: string;
  candidateEmail: string;
  testTitle: string;
  score: number; // weighted score (float)
  totalWeightage: number;
  percentage: number; // float
  passed: boolean;
  completedAt: string;
  // Descriptive answers needing manual review (v2 feature, kept as placeholder)
  needsManualReview: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockQuestionBatches: QuestionBatch[] = [
  {
    id: 'qb-1',
    name: 'React Fundamentals',
    domain: 'Frontend Development',
    topic: 'React.js',
    difficulty: 'Intermediate',
    questionCount: 20,
    lastUsed: '2026-04-30',
    createdAt: '2026-03-01',
    createdBy: 'admin@company.com',
    isActive: true,
    questions: [
      {
        id: 'q1',
        content: 'What is the primary purpose of React hooks?',
        optionA: 'To replace class components entirely',
        optionB: 'To allow state and lifecycle features in functional components',
        optionC: 'To improve performance of all components',
        optionD: 'To enable server-side rendering',
        correctOption: 'B',
        type: 'mcq',
        weightage: 1,
        createdBy: 'admin@company.com',
        createdAt: '2026-03-01',
      },
      {
        id: 'q2',
        content: 'Which hook would you use to perform side effects in a functional component?',
        optionA: 'useState',
        optionB: 'useEffect',
        optionC: 'useContext',
        optionD: 'useReducer',
        correctOption: 'B',
        type: 'mcq',
        weightage: 1,
        createdBy: 'admin@company.com',
        createdAt: '2026-03-01',
      },
      {
        id: 'q3',
        content: 'Explain the Virtual DOM in React and how it improves performance.',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        type: 'descriptive',
        weightage: 3,
        createdBy: 'admin@company.com',
        createdAt: '2026-03-01',
      },
    ],
  },
  {
    id: 'qb-2',
    name: 'Python Data Structures',
    domain: 'Programming',
    topic: 'Python',
    difficulty: 'Advanced',
    questionCount: 15,
    lastUsed: '2026-04-29',
    createdAt: '2026-02-20',
    createdBy: 'admin@company.com',
    isActive: true,
    questions: [],
  },
  {
    id: 'qb-3',
    name: 'SQL Queries Advanced',
    domain: 'Database',
    topic: 'SQL',
    difficulty: 'Advanced',
    questionCount: 25,
    lastUsed: '2026-04-05',
    createdAt: '2026-01-15',
    createdBy: 'admin@company.com',
    isActive: true,
    questions: [],
  },
  {
    id: 'qb-4',
    name: 'TypeScript Deep Dive',
    domain: 'Frontend Development',
    topic: 'TypeScript',
    difficulty: 'Intermediate',
    questionCount: 18,
    lastUsed: '2026-04-20',
    createdAt: '2026-03-10',
    createdBy: 'admin@company.com',
    isActive: true,
    questions: [],
  },
  {
    id: 'qb-5',
    name: 'Machine Learning Basics',
    domain: 'Data Science',
    topic: 'ML Concepts',
    difficulty: 'Advanced',
    questionCount: 22,
    lastUsed: '2026-04-18',
    createdAt: '2026-02-28',
    createdBy: 'admin@company.com',
    isActive: true,
    questions: [],
  },
  {
    id: 'qb-6',
    name: 'System Design Principles',
    domain: 'Architecture',
    topic: 'System Design',
    difficulty: 'Advanced',
    questionCount: 12,
    lastUsed: '2026-04-22',
    createdAt: '2026-03-15',
    createdBy: 'admin@company.com',
    isActive: true,
    questions: [],
  },
];

export const mockCandidateBatches: CandidateBatch[] = [
  {
    id: 'cb-1',
    name: 'Frontend Team Q2 2026',
    domain: 'Frontend Development',
    candidateCount: 12,
    createdAt: '2026-03-01',
    isActive: true,
    adminEmails: ['alex.johnson@company.com', 'sarah.chen@company.com'],
    candidates: [
      'sarah.chen@company.com',
      'michael.brown@company.com',
      'emma.davis@company.com',
      'james.wilson@company.com',
    ],
  },
  {
    id: 'cb-2',
    name: 'Data Science Interns',
    domain: 'Data Science',
    candidateCount: 8,
    createdAt: '2026-02-15',
    isActive: true,
    adminEmails: ['john.doe@company.com'],
    candidates: ['intern1@company.com', 'intern2@company.com'],
  },
  {
    id: 'cb-3',
    name: 'Backend Engineers Cohort',
    domain: 'Architecture',
    candidateCount: 10,
    createdAt: '2026-03-20',
    isActive: true,
    adminEmails: ['alex.johnson@company.com'],
    candidates: ['dev1@company.com', 'dev2@company.com'],
  },
];

export const mockAdminTests: Test[] = [
  {
    id: 't-1',
    title: 'React Fundamentals Assessment',
    description: 'Core React concepts and hooks',
    durationMinutes: 60,
    passingScorePercent: 70,
    isActive: true,
    createdAt: '2026-03-01',
  },
  {
    id: 't-2',
    title: 'Python Mastery Test',
    durationMinutes: 45,
    passingScorePercent: 65,
    isActive: true,
    createdAt: '2026-02-20',
  },
  {
    id: 't-3',
    title: 'JavaScript Basics',
    durationMinutes: 30,
    passingScorePercent: 60,
    isActive: true,
    createdAt: '2026-01-15',
  },
];

export const mockTestAssignments: TestAssignment[] = [
  {
    id: 'ta-1',
    testId: 't-2',
    testTitle: 'Python Mastery Test',
    questionBatchId: 'qb-2',
    questionBatchName: 'Python Data Structures',
    batchId: 'cb-2',
    batchName: 'Data Science Interns',
    questionCount: 15,
    scheduledStart: '2026-04-29T14:00:00Z',
    deadline: '2026-04-29T16:00:00Z',
    status: 'Active',
    maxAttempts: 1,
    createdAt: '2026-04-01',
    totalCandidates: 8,
    completedCount: 3,
    activeSessions: 2,
    averageScore: 78,
    domain: 'Programming',
    durationMinutes: 45,
  },
  {
    id: 'ta-2',
    testId: 't-1',
    testTitle: 'React Fundamentals Assessment',
    questionBatchId: 'qb-1',
    questionBatchName: 'React Fundamentals',
    batchId: 'cb-1',
    batchName: 'Frontend Team Q2 2026',
    questionCount: 20,
    scheduledStart: '2026-05-05T10:00:00Z',
    deadline: '2026-05-05T12:00:00Z',
    status: 'Pending',
    maxAttempts: 1,
    createdAt: '2026-04-01',
    totalCandidates: 12,
    completedCount: 0,
    activeSessions: 0,
    domain: 'Frontend Development',
    durationMinutes: 60,
  },
  {
    id: 'ta-3',
    testId: 't-3',
    testTitle: 'JavaScript Basics',
    questionBatchId: 'qb-1',
    questionBatchName: 'React Fundamentals',
    batchId: 'cb-1',
    batchName: 'Frontend Team Q2 2026',
    questionCount: 20,
    scheduledStart: '2026-04-10T09:00:00Z',
    deadline: '2026-04-10T11:00:00Z',
    status: 'Completed',
    maxAttempts: 1,
    createdAt: '2026-03-20',
    totalCandidates: 12,
    completedCount: 12,
    activeSessions: 0,
    averageScore: 85,
    domain: 'Frontend Development',
    durationMinutes: 30,
  },
];

export const mockSessions: TestSession[] = [
  {
    sessionId: 'sess-1',
    assignmentId: 'ta-1',
    candidateEmail: 'sarah.chen@company.com',
    candidateName: 'Sarah Chen',
    testTitle: 'Python Mastery Test',
    attemptNumber: 1,
    startTime: '2026-04-29T14:05:00Z',
    status: 'Completed',
    score: 13.5,
    totalQuestions: 15,
  },
  {
    sessionId: 'sess-2',
    assignmentId: 'ta-1',
    candidateEmail: 'michael.brown@company.com',
    candidateName: 'Michael Brown',
    testTitle: 'Python Mastery Test',
    attemptNumber: 1,
    startTime: '2026-04-29T14:10:00Z',
    status: 'Active',
    totalQuestions: 15,
  },
  {
    sessionId: 'sess-3',
    assignmentId: 'ta-1',
    candidateEmail: 'intern1@company.com',
    candidateName: 'Intern One',
    testTitle: 'Python Mastery Test',
    attemptNumber: 1,
    startTime: '2026-04-29T14:08:00Z',
    status: 'Active',
    totalQuestions: 15,
  },
];

export const mockTestResults: TestResult[] = [
  {
    sessionId: 'sess-1',
    candidateEmail: 'sarah.chen@company.com',
    testTitle: 'Python Mastery Test',
    score: 13.5,
    totalWeightage: 15,
    percentage: 90.0,
    passed: true,
    completedAt: '2026-04-29T14:45:00Z',
    needsManualReview: false,
  },
];

// ─── Candidate dashboard tests ────────────────────────────────────────────────────────────

export interface CandidateTest {
  id: string;
  title: string;
  status: 'upcoming' | 'completed';
  scheduledDate: string;
  duration: number;
  totalQuestions: number;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  batchName: string;
  score?: number; // percentage, only for completed
}

export const mockTests: CandidateTest[] = [
  {
    id: 't-1',
    title: 'React Fundamentals Assessment',
    status: 'upcoming',
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    totalQuestions: 6,
    domain: 'Frontend Development',
    difficulty: 'medium',
    batchName: 'Frontend Team Q2 2026',
  },
  {
    id: 't-2',
    title: 'Python Mastery Test',
    status: 'upcoming',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    totalQuestions: 5,
    domain: 'Programming',
    difficulty: 'hard',
    batchName: 'Data Science Interns',
  },
  {
    id: 't-4',
    title: 'TypeScript Deep Dive',
    status: 'upcoming',
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    totalQuestions: 18,
    domain: 'Frontend Development',
    difficulty: 'hard',
    batchName: 'Frontend Team Q2 2026',
  },
  {
    id: 't-3',
    title: 'JavaScript Basics',
    status: 'completed',
    scheduledDate: '2026-04-10T09:00:00Z',
    duration: 30,
    totalQuestions: 6,
    domain: 'Frontend Development',
    difficulty: 'easy',
    batchName: 'Frontend Team Q2 2026',
    score: 90,
  },
  {
    id: 't-5',
    title: 'SQL Queries Advanced',
    status: 'completed',
    scheduledDate: '2026-03-22T10:00:00Z',
    duration: 40,
    totalQuestions: 25,
    domain: 'Database',
    difficulty: 'hard',
    batchName: 'Backend Engineers Cohort',
    score: 72,
  },
  {
    id: 't-6',
    title: 'System Design Principles',
    status: 'completed',
    scheduledDate: '2026-02-15T14:00:00Z',
    duration: 60,
    totalQuestions: 12,
    domain: 'Architecture',
    difficulty: 'hard',
    batchName: 'Backend Engineers Cohort',
    score: 85,
  },
];

// Candidate-facing mock data
export const mockCandidateAssignments = [
  {
    assignmentId: 'ta-2',
    testId: 't-1',
    testTitle: 'React Fundamentals Assessment',
    scheduledStart: '2026-05-05T10:00:00Z',
    deadline: '2026-05-05T12:00:00Z',
    status: 'Pending' as AssignmentStatus,
    durationMinutes: 60,
    questionCount: 20,
  },
  {
    assignmentId: 'ta-3',
    testId: 't-3',
    testTitle: 'JavaScript Basics',
    scheduledStart: '2026-04-10T09:00:00Z',
    deadline: '2026-04-10T11:00:00Z',
    status: 'Completed' as AssignmentStatus,
    durationMinutes: 30,
    questionCount: 20,
  },
];

export interface CandidateTestStatus {
  candidateId: string;
  testId: string;
  candidateName: string;
  candidateEmail: string;
  status: 'not-started' | 'in-progress' | 'finished' | 'ended-by-admin';
  score?: number;
  startedAt?: string;
  finishedAt?: string;
}

export const mockCandidateTestStatuses: CandidateTestStatus[] = [
  {
    candidateId: 'c-1',
    testId: 't-1',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@company.com',
    status: 'finished',
    score: 90,
    startedAt: '2026-05-05T10:02:00Z',
    finishedAt: '2026-05-05T10:48:00Z',
  },
  {
    candidateId: 'c-2',
    testId: 't-1',
    candidateName: 'Michael Brown',
    candidateEmail: 'michael.brown@company.com',
    status: 'in-progress',
    startedAt: '2026-05-05T10:05:00Z',
  },
  {
    candidateId: 'c-3',
    testId: 't-1',
    candidateName: 'Emma Davis',
    candidateEmail: 'emma.davis@company.com',
    status: 'not-started',
  },
  {
    candidateId: 'c-4',
    testId: 't-2',
    candidateName: 'Intern One',
    candidateEmail: 'intern1@company.com',
    status: 'finished',
    score: 78,
    startedAt: '2026-04-29T14:08:00Z',
    finishedAt: '2026-04-29T14:50:00Z',
  },
  {
    candidateId: 'c-5',
    testId: 't-2',
    candidateName: 'Intern Two',
    candidateEmail: 'intern2@company.com',
    status: 'in-progress',
    startedAt: '2026-04-29T14:10:00Z',
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
