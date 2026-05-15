import api from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CandidateDto {
  candidateId: string;
  displayName: string;
  role: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  candidateId: string;
  displayName: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  token: string;
  candidateId: string;
  displayName: string;
  email: string;
  role: string;
}

export interface AssignmentDto {
  assignmentId: string;
  testId: string;
  testTitle: string;
  scheduledStart: string;
  deadline: string;
  status: string;
  durationMinutes: number;
  questionCount: number;
  maxAttempts: number;
  score: number | null;
  percentage: number | null;
}

export interface InitializeExamDto {
  sessionId: string;
  firstQuestionId: string;
  timeRemainingSec: number;
  totalQuestions: number;
}

export interface TestStatusDto {
  sessionId: string;
  timeRemainingSec: number;
  status: string;
  currentQuestionId: string | null;
  answeredCount: number;
  totalQuestions: number;
  violationCount: number;
}

export interface QuestionDisplayDto {
  id: string;
  content: string;
  options: Record<string, string>;
  position: number;
  totalQuestions: number;
}

export interface FinalizeResultDto {
  ok: boolean;
  score: number;
  totalQuestions: number;
  passed: boolean;
  percentage: number;
}

export interface TestResultDto {
  score: number;
  totalQuestions: number;
  passed: boolean;
  percentage: number;
  completedAt: string;
}

export interface AdminSessionDto {
  sessionId: string;
  candidateEmail: string;
  status: string;
  score: number | null;
  startTime: string;
}

export interface QuestionBatchDto {
  questionBatchId: string;
  name: string;
  domain: string | null;
  topic: string | null;
  difficulty: string | null;
  questionCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface TestDto {
  testId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  passingScorePercent: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAssignmentDto {
  assignmentId: string;
  testId: string;
  testTitle: string;
  questionBatchId: string;
  questionBatchName: string;
  batchId: string | null;
  batchName: string | null;
  candidateId: string | null;
  candidateEmail: string | null;
  questionCount: number;
  scheduledStart: string;
  deadline: string;
  status: string;
  maxAttempts: number;
  createdAt: string;
}

export interface CandidateBatchDto {
  batchId: string;
  name: string;
  domain: string | null;
  topic: string | null;
  difficulty: string | null;
  candidateCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface QuestionDto {
  questionId: string;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  weightage: number;
}



export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { email, password }).then(r => r.data);

export const register = (email: string, password: string, displayName: string) =>
  api.post<RegisterResponse>('/auth/register', { email, password, displayName }).then(r => r.data);

// ── Candidate endpoints ───────────────────────────────────────────────────────

export const getMe = () =>
  api.get<CandidateDto>('/me').then(r => r.data);

export const getMyAssignments = () =>
  api.get<AssignmentDto[]>('/my-assignments').then(r => r.data);

// ── Exam endpoints ────────────────────────────────────────────────────────────

export const initializeExam = (testId: string, assignmentId: string) =>
  api.post<InitializeExamDto>(`/tests/${testId}/initialize`, { assignmentId }).then(r => r.data);

export const getSessionStatus = (sessionId: string) =>
  api.get<TestStatusDto>(`/sessions/${sessionId}/status`).then(r => r.data);

export const getQuestion = (sessionId: string, questionId: string) =>
  api.get<QuestionDisplayDto>(`/sessions/${sessionId}/questions/${questionId}`).then(r => r.data);

export const getQuestionByPosition = (sessionId: string, position: number) =>
  api.get<QuestionDisplayDto>(`/sessions/${sessionId}/questions/position/${position}`).then(r => r.data);

export const submitAnswer = (
  sessionId: string,
  questionId: string,
  selectedOption: string,
  idempotencyKey: string
) =>
  api.put(
    `/sessions/${sessionId}/answers`,
    { questionId, selectedOption },
    { headers: { 'X-Idempotency-Key': idempotencyKey } }
  ).then(r => r.data);

export const finalizeExam = (sessionId: string) =>
  api.post<FinalizeResultDto>(`/sessions/${sessionId}/finalize`, {}).then(r => r.data);

export const getTestResult = (sessionId: string) =>
  api.get<TestResultDto>(`/sessions/${sessionId}/result`).then(r => r.data);

export const recordAuditEvent = (sessionId: string, type: string, payload?: string) =>
  api.post('/audit', { type, payload }, { headers: { 'X-Session-Id': sessionId } }).then(r => r.data);

// ── Admin endpoints ───────────────────────────────────────────────────────────

export const getAdminUsers = () =>
  api.get<CandidateDto[]>('/admin/users').then(r => r.data);

export const getQuestionBatches = () =>
  api.get<QuestionBatchDto[]>('/admin/question-batches').then(r => r.data);

export const getTests = () =>
  api.get<TestDto[]>('/admin/tests').then(r => r.data);

export const getAssignments = () =>
  api.get<AdminAssignmentDto[]>('/admin/assignments').then(r => r.data);

export const getBatches = () =>
  api.get<CandidateBatchDto[]>('/admin/batches').then(r => r.data);

export const getAdminSessions = (testId: string, status?: string) =>
  api.get<AdminSessionDto[]>('/admin/sessions', { params: { testId, status } }).then(r => r.data);

export const getQuestionsInBatch = (batchId: string) =>
  api.get<QuestionDto[]>(`/admin/question-batches/${batchId}/questions`).then(r => r.data);

export const updateQuestion = (questionId: string, data: {
  content: string; optionA: string; optionB: string; optionC: string; optionD: string;
  correctOption: string; weightage: number;
}) => api.put(`/admin/questions/${questionId}`, data).then(r => r.data);

export interface CompletedSessionDto {
  sessionId: string;
  testId: string;
  testTitle: string;
  assignmentId: string;
  batchName: string | null;
  candidateEmail: string;
  candidateDisplayName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  violationCount: number;
  startTime: string;
  endTime: string;
  durationSeconds: number;
}

export interface ScorecardAnswerDto {
  questionId: string;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  selectedOption: string | null;
  isCorrect: boolean;
  weightage: number;
}

export interface AuditEventDto {
  eventType: string;
  payload: string | null;
  occurredAt: string;
}

export interface SessionScorecardDto {
  sessionId: string;
  candidateEmail: string;
  candidateDisplayName: string;
  testTitle: string;
  batchName: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passingScorePercent: number;
  violationCount: number;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  answers: ScorecardAnswerDto[];
  auditEvents: AuditEventDto[];
}

export const getCompletedSessions = () =>
  api.get<CompletedSessionDto[]>('/admin/completed-sessions').then(r => r.data);

export const getSessionScorecard = (sessionId: string) =>
  api.get<SessionScorecardDto>(`/admin/sessions/${sessionId}/scorecard`).then(r => r.data);

export const deleteBatch = (batchId: string) =>
  api.delete(`/admin/batches/${batchId}`).then(r => r.data);

export const deleteQuestionBatch = (batchId: string) =>
  api.delete(`/admin/question-batches/${batchId}`).then(r => r.data);

export const createQuestionBatch = (data: {
  name: string; domain?: string; topic?: string; difficulty?: string;
}) => api.post<{ questionBatchId: string }>('/admin/question-batches', data).then(r => r.data);

export const createQuestionsInBatch = (batchId: string, questions: {
  content: string; optionA: string; optionB: string; optionC: string; optionD: string;
  correctOption: string; weightage?: number;
}[]) =>
  api.post<{ added: number; questionIds: string[] }>(
    `/admin/question-batches/${batchId}/questions`, { questions }
  ).then(r => r.data);

export const addCandidatesToBatch = (batchId: string, candidateIds: string[]) =>
  api.post(`/admin/batches/${batchId}/members`, { candidateIds }).then(r => r.data);

export const createBatch = (data: {
  name: string; domain?: string; topic?: string; difficulty?: string;
}) => api.post<{ batchId: string }>('/admin/batches', data).then(r => r.data);

export const createTest = (data: {
  title: string; durationMinutes: number; passingScorePercent: number; description?: string;
}) => api.post<{ testId: string }>('/admin/tests', data).then(r => r.data);

export const createAssignment = (data: {
  testId: string; questionBatchId: string; questionCount: number;
  scheduledStart: string; deadline: string; maxAttempts?: number;
  batchId?: string; candidateId?: string;
}) => api.post<{ assignmentId: string }>('/admin/assignments', data).then(r => r.data);

export const updateCandidateRole = (candidateId: string, role: string) =>
  api.put(`/admin/users/${candidateId}/role`, { role }).then(r => r.data);
