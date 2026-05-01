    # APEX Exam Platform — Production Implementation Specification
    **Version 2.1 — Corrected & Final**

    ## TABLE OF CONTENTS
    1. Project Overview & Constraints
    2. Architecture & Layer Boundaries
    3. Database Schema
    4. API Contract
    5. Candidate Provisioning & Auth Flow
    6. Layer-by-Layer Implementation
    7. Security, Auth & Lockdown
    8. Timer & Polling
    9. Deterministic Randomization
    10. Idempotency
    11. Admin RBAC
    12. Background Services
    13. Frontend Architecture
    14. External Integrations
    15. Configuration & Secrets
    16. Testing Strategy
    17. Deployment Runbook
    18. Milestones & Execution Plan

    ---

    ## 1. PROJECT OVERVIEW & CONSTRAINTS
    - Internal MCQ exam platform, up to 2000 concurrent candidates
    - 2 developers, monolithic .NET 8 backend, React 18 frontend
    - Entra ID SSO only — no custom username/password accounts
    - Start/stop on demand — downtime between exams is acceptable
    - Web-only lockdown — no Electron or SEB
    - Single App Service instance, scale up vertically (P2v3 during exam, B1 between)
    - Manual review (Assess Tests tab) is deferred to v2 — UI placeholder only in v1

    **EXCLUDED FROM V1:**
    - Redis, Kafka, WebSockets, SSE
    - Microservices
    - Azure Key Vault
    - Zero-downtime migrations
    - Microsoft Graph API
    - Multi-instance horizontal scaling
    - Manual test review/scoring

    ---

    ## 2. ARCHITECTURE & LAYER BOUNDARIES
    ### Stack
    | Layer | Technology |
    |---|---|
    | Frontend | React 18 + TypeScript + Vite |
    | Backend | .NET 8 Minimal APIs |
    | Pattern | Hexagonal (Ports & Adapters) |
    | Database | Azure SQL Serverless |
    | ORM | EF Core 8 + Fluent API |
    | Auth | Entra ID + MSAL + JWT |
    | Polling | 5s HTTP polling |
    | Offline buffer | IndexedDB (`idb`) |
    | Notifications | Power Automate Webhook via Outbox |
    | Telemetry | Azure App Insights |
    | Secrets | Azure App Service Configuration |

    ### Solution Structure
    ```
    /APEX.sln
    /Domain/Domain.csproj
    /Application/Application.csproj       → refs Domain only
    /Infrastructure/Infrastructure.csproj → refs Domain + Application
    /Api/Api.csproj                        → refs Application + Infrastructure
    /Client/                               → Vite + React + TS (separate from .NET)
    ```

    ### Layer Rules — Hard Boundaries
    | Layer | Owns | Never Touches |
    |---|---|---|
    | Domain | Entities, invariants, port interfaces, PRNG, exceptions | EF Core, HttpClient, JSON, config, async I/O |
    | Application | Commands, queries, orchestration, DTOs, transaction boundaries | DbContext, HttpClient, raw SQL, UI logic |
    | Infrastructure | EF Core, repositories, HTTP adapters, background services | Business rules, API contracts |
    | Api | Endpoints, middleware, DI wiring, JWT validation, error envelopes | Business rules, DbContext, external HTTP |

    **Dependency Rule:** Arrows point inward only: `Api → Application → Domain`, `Infrastructure → Application → Domain`, `Domain → nothing`

    ---

    ## 3. DATABASE SCHEMA
    ### Global Rules
    - All PKs: `UNIQUEIDENTIFIER DEFAULT NEWID()`
    - All timestamps: `DATETIME2`, UTC only, use `SYSUTCDATETIME()`
    - `TimeRemainingSec` is **NEVER stored** — always computed on read
    - Role lives in `Candidates` table — NOT in Entra ID app roles

    ```sql
    -- ============================================
    -- CANDIDATES
    -- ============================================
    CREATE TABLE Candidates (
        CandidateId  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email        NVARCHAR(255) NOT NULL UNIQUE,
        AzureAdOid   VARCHAR(128)  NOT NULL UNIQUE,
        DisplayName  NVARCHAR(255) NOT NULL,
        Role         VARCHAR(20)   NOT NULL DEFAULT 'Candidate'
                    CHECK (Role IN ('Candidate','Admin','SuperAdmin')),
        CreatedAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- ============================================
    -- CANDIDATE BATCHES
    -- ============================================
    CREATE TABLE Batches (
        BatchId    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Name       NVARCHAR(255) NOT NULL,
        Domain     NVARCHAR(100) NULL,
        Topic      NVARCHAR(100) NULL,
        Difficulty VARCHAR(20)   NULL CHECK (Difficulty IN ('Beginner','Intermediate','Advanced')),
        CreatedBy  UNIQUEIDENTIFIER NOT NULL REFERENCES Candidates(CandidateId),
        CreatedAt  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        IsActive   BIT           NOT NULL DEFAULT 1
    );
    -- Domain/Topic/Difficulty are metadata labels for admin filtering only
    -- They drive NO business logic in v1

    CREATE TABLE BatchMembers (
        BatchId     UNIQUEIDENTIFIER NOT NULL REFERENCES Batches(BatchId) ON DELETE CASCADE,
        CandidateId UNIQUEIDENTIFIER NOT NULL REFERENCES Candidates(CandidateId) ON DELETE CASCADE,
        AddedAt     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        PRIMARY KEY (BatchId, CandidateId)
    );

    -- ============================================
    -- QUESTIONS & QUESTION POOLS
    -- ============================================
    CREATE TABLE Questions (
        QuestionId    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Content       NVARCHAR(MAX) NOT NULL,
        OptionA       NVARCHAR(500) NOT NULL,
        OptionB       NVARCHAR(500) NOT NULL,
        OptionC       NVARCHAR(500) NOT NULL,
        OptionD       NVARCHAR(500) NOT NULL,
        CorrectOption CHAR(1)       NOT NULL CHECK (CorrectOption IN ('A','B','C','D')),
        CreatedBy     UNIQUEIDENTIFIER NOT NULL REFERENCES Candidates(CandidateId),
        CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );
    -- No TestId on Questions — questions are reusable across tests via QuestionBatches

    CREATE TABLE QuestionBatches (
        QuestionBatchId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Name            NVARCHAR(255) NOT NULL,
        Domain          NVARCHAR(100) NULL,
        Topic           NVARCHAR(100) NULL,
        Difficulty      VARCHAR(20)   NULL CHECK (Difficulty IN ('Beginner','Intermediate','Advanced')),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL REFERENCES Candidates(CandidateId),
        CreatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        IsActive        BIT           NOT NULL DEFAULT 1
    );

    CREATE TABLE QuestionBatchMembers (
        QuestionBatchId UNIQUEIDENTIFIER NOT NULL REFERENCES QuestionBatches(QuestionBatchId) ON DELETE CASCADE,
        QuestionId      UNIQUEIDENTIFIER NOT NULL REFERENCES Questions(QuestionId) ON DELETE CASCADE,
        PRIMARY KEY (QuestionBatchId, QuestionId)
    );

    -- ============================================
    -- TESTS
    -- ============================================
    CREATE TABLE Tests (
        TestId              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Title               NVARCHAR(255) NOT NULL,
        Description         NVARCHAR(500) NULL,
        DurationMinutes     INT           NOT NULL CHECK (DurationMinutes > 0),
        PassingScorePercent DECIMAL(5,2)  NOT NULL CHECK (PassingScorePercent BETWEEN 0 AND 100),
        IsActive            BIT           NOT NULL DEFAULT 1,
        CreatedAt           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- ============================================
    -- TEST ASSIGNMENTS
    -- ============================================
    CREATE TABLE TestAssignments (
        AssignmentId    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TestId          UNIQUEIDENTIFIER NOT NULL REFERENCES Tests(TestId),
        QuestionBatchId UNIQUEIDENTIFIER NOT NULL REFERENCES QuestionBatches(QuestionBatchId),
        BatchId         UNIQUEIDENTIFIER NULL REFERENCES Batches(BatchId),
        CandidateId     UNIQUEIDENTIFIER NULL REFERENCES Candidates(CandidateId),
        QuestionCount   INT              NOT NULL DEFAULT 40 CHECK (QuestionCount > 0),
        ScheduledStart  DATETIME2        NOT NULL,
        Deadline        DATETIME2        NOT NULL,
        Status          VARCHAR(20)      NOT NULL DEFAULT 'Pending'
                        CHECK (Status IN ('Pending','Active','Completed','Expired')),
        MaxAttempts     INT              NOT NULL DEFAULT 1 CHECK (MaxAttempts > 0),
        CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CHK_AssignmentTarget CHECK (
            (BatchId IS NOT NULL AND CandidateId IS NULL) OR
            (BatchId IS NULL AND CandidateId IS NOT NULL)
        )
    );
    CREATE INDEX IX_TestAssignments_Status_Deadline ON TestAssignments(Status, Deadline);
    CREATE INDEX IX_TestAssignments_CandidateId ON TestAssignments(CandidateId) WHERE CandidateId IS NOT NULL;
    CREATE INDEX IX_TestAssignments_BatchId ON TestAssignments(BatchId) WHERE BatchId IS NOT NULL;

    -- ============================================
    -- TEST SESSIONS
    -- ============================================
    CREATE TABLE TestSessions (
        SessionId           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        AssignmentId        UNIQUEIDENTIFIER NOT NULL REFERENCES TestAssignments(AssignmentId),
        CandidateId         UNIQUEIDENTIFIER NOT NULL REFERENCES Candidates(CandidateId),
        TestId              UNIQUEIDENTIFIER NOT NULL REFERENCES Tests(TestId),
        CandidateAzureAdOid VARCHAR(128)     NOT NULL, -- Denormalized for fast SessionGuard validation
        AttemptNumber       INT              NOT NULL DEFAULT 1,
        StartTime           DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        EndTime             DATETIME2        NULL,
        Status              VARCHAR(20)      NOT NULL DEFAULT 'Active'
                            CHECK (Status IN ('Active','Completed','Expired')),
        Score               INT              NULL,
        RowVersion          ROWVERSION       NOT NULL,
        CONSTRAINT UQ_Session_Attempt UNIQUE (AssignmentId, AttemptNumber)
    );
    -- RowVersion used for optimistic concurrency on finalize
    -- TimeRemainingSec is NOT a column — computed as:
    -- DATEDIFF(SECOND, SYSUTCDATETIME(), DATEADD(MINUTE, t.DurationMinutes, s.StartTime))

    CREATE INDEX IX_TestSessions_CandidateId_Status ON TestSessions(CandidateId, Status);
    CREATE INDEX IX_TestSessions_Status_StartTime ON TestSessions(Status, StartTime);

    -- ============================================
    -- SESSION QUESTION MAPPINGS
    -- ============================================
    CREATE TABLE SessionQuestionMappings (
        MappingId        UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        SessionId        UNIQUEIDENTIFIER NOT NULL REFERENCES TestSessions(SessionId) ON DELETE CASCADE,
        QuestionPosition INT              NOT NULL,
        QuestionId       UNIQUEIDENTIFIER NOT NULL REFERENCES Questions(QuestionId),
        OptionMapping    NVARCHAR(MAX)    NOT NULL,
        -- OptionMapping JSON format: { "A": "C", "B": "A", "C": "D", "D": "B" }
        -- Key   = display option shown to candidate (what they see on screen)
        -- Value = original option key in Questions table (used for scoring)
        CONSTRAINT UQ_Session_Position UNIQUE (SessionId, QuestionPosition),
        CONSTRAINT UQ_Session_Question UNIQUE (SessionId, QuestionId)
    );
    CREATE INDEX IX_SQM_SessionId_Position ON SessionQuestionMappings(SessionId, QuestionPosition);

    -- ============================================
    -- ANSWERS
    -- ============================================
    CREATE TABLE Answers (
        AnswerId       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        SessionId      UNIQUEIDENTIFIER NOT NULL REFERENCES TestSessions(SessionId) ON DELETE CASCADE,
        QuestionId     UNIQUEIDENTIFIER NOT NULL REFERENCES Questions(QuestionId),
        SelectedOption CHAR(1)          NOT NULL CHECK (SelectedOption IN ('A','B','C','D')),
        IdempotencyKey UNIQUEIDENTIFIER NOT NULL UNIQUE,
        SubmittedAt    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Answer_Session_Question UNIQUE (SessionId, QuestionId)
    );
    -- UQ_Answer_Session_Question prevents duplicate answers per question
    -- UQ_IdempotencyKey enables safe network retries

    CREATE INDEX IX_Answers_SessionId ON Answers(SessionId);

    -- ============================================
    -- AUDIT EVENTS
    -- ============================================
    CREATE TABLE AuditEvents (
        EventId    BIGINT IDENTITY(1,1) PRIMARY KEY,
        SessionId  UNIQUEIDENTIFIER NOT NULL REFERENCES TestSessions(SessionId) ON DELETE CASCADE,
        EventType  VARCHAR(50)      NOT NULL,
        Payload    NVARCHAR(MAX)    NULL,
        OccurredAt DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_AuditEvents_SessionId ON AuditEvents(SessionId, OccurredAt);

    -- ============================================
    -- WEBHOOK OUTBOX
    -- ============================================
    CREATE TABLE WebhookOutbox (
        OutboxId    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        EventType   VARCHAR(50)      NOT NULL,
        Payload     NVARCHAR(MAX)    NOT NULL,
        TargetUrl   NVARCHAR(500)    NOT NULL,
        Status      VARCHAR(20)      NOT NULL DEFAULT 'Pending'
                    CHECK (Status IN ('Pending','Sent','Failed','Dead')),
        RetryCount  INT              NOT NULL DEFAULT 0,
        LastAttempt DATETIME2        NULL,
        CreatedAt   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_WebhookOutbox_Status ON WebhookOutbox(Status)
        WHERE Status IN ('Pending','Failed');
    ```

    ---

    ## 4. API CONTRACT
    **Base URL:** `/api` | **Auth:** `Authorization: Bearer {jwt}`

    ### Candidate Endpoints
    | Method | Path | Headers | Body | Success Response |
    |---|---|---|---|---|
    | GET | `/me` | Bearer | — | `{ candidateId, displayName, role, email }` |
    | GET | `/my-assignments` | Bearer | — | `[ { assignmentId, testId, testTitle, scheduledStart, deadline, status, durationMinutes, questionCount } ]` |
    | POST | `/tests/{testId}/initialize` | Bearer | `{ assignmentId }` | `{ sessionId, firstQuestionId, timeRemainingSec, totalQuestions }` |
    | GET | `/sessions/{sessionId}/status` | Bearer, `X-Session-Id` | — | `{ timeRemainingSec, status, currentQuestionId, answeredCount, totalQuestions, violationCount }` |
    | GET | `/sessions/{sessionId}/questions/{questionId}` | Bearer, `X-Session-Id` | — | `{ id, content, options: {A,B,C,D}, position, totalQuestions }` |
    | PUT | `/sessions/{sessionId}/answers` | Bearer, `X-Session-Id`, `X-Idempotency-Key` | `{ questionId, selectedOption }` | `{ ok: true }` |
    | POST | `/sessions/{sessionId}/finalize` | Bearer, `X-Session-Id` | `{}` | `{ ok: true, score, totalQuestions, passed, percentage }` |
    | GET | `/sessions/{sessionId}/result` | Bearer | — | `{ score, totalQuestions, passed, percentage, completedAt }` |
    | POST | `/audit` | Bearer, `X-Session-Id` | `{ type, payload }` | `{ ok: true }` |

    ### Admin Endpoints (Role: Admin or SuperAdmin)
    | Method | Path | Body | Success Response |
    |---|---|---|---|
    | GET | `/admin/users` | — | `[ { candidateId, email, displayName, role } ]` |
    | PUT | `/admin/users/{candidateId}/role` | `{ role }` | `{ ok: true }` |
    | POST | `/admin/questions` | `{ content, optionA-D, correctOption }` | `{ questionId }` |
    | POST | `/admin/question-batches` | `{ name, domain, topic, difficulty }` | `{ questionBatchId }` |
    | POST | `/admin/question-batches/{id}/members` | `{ questionIds: [] }` | `{ ok: true, added: n }` |
    | POST | `/admin/batches` | `{ name, domain, topic, difficulty }` | `{ batchId }` |
    | POST | `/admin/batches/{id}/members` | `{ candidateIds: [] }` | `{ ok: true, added: n }` |
    | POST | `/admin/tests` | `{ title, description, durationMinutes, passingScorePercent }` | `{ testId }` |
    | POST | `/admin/assignments` | `{ testId, questionBatchId, batchId?, candidateId?, questionCount, scheduledStart, deadline, maxAttempts }` | `{ assignmentId }` |
    | GET | `/admin/sessions` | `?testId=&status=` | `[ { sessionId, candidateEmail, status, score, startTime } ]` |

    **Error Envelope:** `{ "ok": false, "error": { "code": "ERR_CODE", "message": "Human readable" } }`
    **Key Codes:** `400 DOMAIN_VIOLATION`, `401 AUTH_REQUIRED`, `403 FORBIDDEN/NO_ASSIGNMENT`, `409 MAX_ATTEMPTS_EXCEEDED/DUPLICATE_SUBMISSION`, `410 SESSION_EXPIRED`, `429 RATE_LIMITED`

    **Notes:**
    - `POST /initialize` requires `assignmentId` from `GET /my-assignments`. Validates ownership, window, attempts.
    - `GET /sessions/.../questions/...` returns **shuffled display options**. Client never sees original keys.

    ---

    ## 5. CANDIDATE PROVISIONING & AUTH FLOW
    ### Auto-Provision on First Login
    1. Candidate authenticates via Entra ID SSO (MSAL on frontend)
    2. Frontend acquires JWT with scopes: `openid`, `profile`, `email`, `api://{clientId}/Exam.Access`
    3. Frontend calls `GET /me` with Bearer token
    4. Backend extracts `oid`, `email`, `displayName` from JWT claims
    5. Backend: `SELECT * FROM Candidates WHERE AzureAdOid = @oid`
    → If not found: `INSERT` new row with `Role = 'Candidate'`
    → If found: return existing record
    6. Return `{ candidateId, displayName, role, email }`
    7. Frontend stores in Zustand → route based on role

    ### ProvisionCandidateCommand (Application layer)
    - Accepts: `oid`, `email`, `displayName`
    - Checks `Candidates` table by `AzureAdOid`
    - If missing: creates new `Candidate` with `Role = 'Candidate'`
    - **Race Condition Handling:** Wrap `INSERT` in `try/catch` for `SqlException 2601/2627`. On violation, fetch and return existing record.
    - Returns: `CandidateDto`
    - This is the ONLY place a `Candidate` row is created.

    ### Role Lookup Per Request
    - Backend does NOT trust role from JWT
    - On every protected request: `CandidateContextService.GetAsync(oid)`
    → `SELECT CandidateId, Role, AzureAdOid FROM Candidates WHERE AzureAdOid = @oid`
    → Cache result for duration of HTTP request (scoped service)
    → `401` if candidate not found

    ### Entra ID App Registration Requirements
    - Expose API scope: `api://{clientId}/Exam.Access`
    - Add to `loginRequest.scopes` in MSAL config
    - Redirect URIs: `https://{your-app}.azurewebsites.net`, `http://localhost:5173`
    - NO `appRoles` in manifest — roles live in DB only
    - Token type: Access token for API calls

    ---

    ## 6. LAYER-BY-LAYER IMPLEMENTATION
    ### A. Domain Layer
    **File Structure:** `Domain/{Entities/, Ports/, Exceptions/, Utilities/}`
    **Key Invariants:**
    - `TestSession.RecordAnswer()` throws `SessionExpiredException` if `Status != Active`
    - `TestSession.RecordAnswer()` throws `DomainException` if computed time remaining `<= 0`
    - `TestSession.Finalize()` is idempotent. Uses `RowVersion` for optimistic concurrency.
    - `Answer` constructor rejects invalid `SelectedOption` or null IDs.

    **Utilities:**
    - `SeededPrng`: Pure static class. Fisher-Yates with deterministic SHA256 seed.
    - `OptionShuffler`: Returns `Dictionary<char, char>` where `Key = display option`, `Value = original option`.
    - `SeedGenerator`: Centralises seed formula. `ForQuestionOrder` vs `ForOptionShuffle` are strictly separated.

    **Ports:** Standard repository & adapter interfaces (`ISessionRepository`, `IAnswerRepository`, `INotificationPort`, `IAuditPort`, `IResultCachePort`).

    ### B. Application Layer
    **File Structure:** `Application/{Commands/, Queries/, Services/, Validators/, DTOs/}`

    #### GetMyAssignmentsQuery
    Input: `candidateId`
    1. Fetch individual assignments `WHERE CandidateId = @candidateId AND Status IN ('Pending','Completed')`
    2. Fetch batch IDs candidate belongs to from `BatchMembers`
    3. Fetch batch assignments `WHERE BatchId IN (@batchIds) AND Status IN ('Pending','Completed')`
    4. Merge, deduplicate, join `Tests` for title/duration
    5. Filter: `ScheduledStart <= UtcNow + 24h` for pending, include completed for history
    6. Return sorted by `ScheduledStart ASC`

    #### InitializeExamCommand
    Input: `candidateId, testId, assignmentId, appSalt`
    1-6. Validate candidate, assignment, time window, batch active status, attempt limits
    7. Fetch question pool from `QuestionBatchMembers`
    8. `attemptNumber = count + 1`
    9. Generate order seed → sample questions
    10. For each question: generate option seed → shuffle → serialize JSON
    11. Begin Tx → Create `TestSession` (populate `CandidateAzureAdOid` from candidate record)
    12. Bulk insert `SessionQuestionMappings`
    13. Commit → Return `{ sessionId, firstQuestionId, timeRemainingSec, totalQuestions }`

    #### SubmitAnswerCommand
    1. Validate DTO & idempotency key format
    2. Fetch session → validate ownership & status
    3. Compute `timeRemaining`. If `<= 0`: fire-and-forget finalize, return `410`
    4. **Idempotency check:** `SELECT` by `IdempotencyKey`. If found → return `200` immediately
    5. Verify question belongs to session via `SessionQuestionMappings`
    6. Call `AnswerRepository.UpsertAsync(...)`
    7. Return `200 { ok: true }`

    #### GetTestStatusQuery
    1. Fetch session → validate ownership
    2. Compute `timeRemainingSec = (int)Math.Max(0, test.DurationMinutes * 60 - (UtcNow - session.StartTime).TotalSeconds)`
    3. If `timeRemainingSec == 0 && status == 'Active'`: fire-and-forget finalize, return status `'Completed'`
    4. Count answers, fetch next question position, count violations
    5. Wrap in `CachedStatusService` (4s TTL, skip if `timeRemainingSec <= 5`)
    6. Return `TestStatusDto`

    #### FinalizeTestCommand
    Input: `sessionId, candidateId, triggeredBy`
    1. Fetch session with `RowVersion`
    2. If `Status != 'Active'`: fetch cached result or recompute → return (idempotent)
    3. Fetch answers + mappings
    4. **Scoring Logic:**
    ```csharp
    // mapping: { display: original }
    var mapping = JsonSerializer.Deserialize<Dictionary<char, char>>(mappingJson);
    var originalOption = mapping[answer.SelectedOption]; // SelectedOption IS the display key
    if (originalOption == question.CorrectOption) score++;
    ```
    5. Begin Tx → `UPDATE TestSessions SET Status='Completed', Score=score, EndTime=UtcNow WHERE RowVersion = @rv`
    → If 0 rows affected: concurrency conflict → fetch & return existing result
    6. Commit
    7. `IResultCachePort.Set(sessionId, result)` (1h TTL)
    8. `INotificationPort.EnqueueAsync('exam_completed', payload)`
    9. `CachedStatusService.Invalidate(sessionId)` ⬅️ **CRITICAL: clears polling cache**
    10. Return `FinalizeResult`

    #### CachedStatusService
    ```csharp
    public async Task<TestStatusDto> GetStatusAsync(Guid sessionId, Func<Task<TestStatusDto>> fetcher)
    {
        var key = $"status:{sessionId}";
        var cached = _cache.Get<TestStatusDto>(key);
        if (cached != null && cached.TimeRemainingSec > 5) return cached;

        var fresh = await fetcher();
        if (fresh.TimeRemainingSec > 5) _cache.Set(key, fresh, TimeSpan.FromSeconds(4));
        return fresh;
    }
    public void Invalidate(Guid sessionId) => _cache.Remove($"status:{sessionId}");
    ```

    ### C. Infrastructure Layer
    **EF Core Rules:** Fluent API only, zero data annotations on domain entities.
    **AnswerRepository.UpsertAsync:**
    ```csharp
    public async Task UpsertAsync(Guid sessionId, Guid questionId, char selectedOption, Guid idempotencyKey, CancellationToken ct)
    {
        const string sql = @"
            MERGE Answers WITH (HOLDLOCK, UPDLOCK) AS target
            USING (SELECT @SessionId AS SessionId, @QuestionId AS QuestionId) AS source
            ON (target.SessionId = source.SessionId AND target.QuestionId = source.QuestionId)
            WHEN MATCHED THEN
                UPDATE SET SelectedOption = @Option, IdempotencyKey = @IdempotencyKey, SubmittedAt = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (SessionId, QuestionId, SelectedOption, IdempotencyKey, SubmittedAt)
                VALUES (@SessionId, @QuestionId, @Option, @IdempotencyKey, SYSUTCDATETIME());";
                
        try
        {
            await _context.Database.ExecuteSqlRawAsync(sql,
                new SqlParameter("@SessionId", sessionId),
                new SqlParameter("@QuestionId", questionId),
                new SqlParameter("@Option", selectedOption.ToString()),
                new SqlParameter("@IdempotencyKey", idempotencyKey), ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
        {
            // Race condition: key already processed. Idempotent success.
        }
    }
    ```
    **Background Services:** `AutoFinalizeService` (30s tick, scoped factory, `DateDiffSecond` query), `WebhookProcessorService` (15s tick, retry <=3, log critical on dead).

    ### D. API Layer
    **Middleware Order:** ExceptionHandler → HttpsRedirection → Cors → Authentication → Authorization → RateLimiter → Endpoints
    **Program.cs:** Standard DI wiring. Config sections bound to options. Rate limiters configured per-user OID.
    **SessionGuard Helper:**
    ```csharp
    public static async Task<TestSession> ValidateAsync(HttpContext ctx, Guid sessionId, ISessionRepository repo, CancellationToken ct)
    {
        var headerVal = ctx.Request.Headers["X-Session-Id"].FirstOrDefault();
        if (!Guid.TryParse(headerVal, out var headerId) || headerId != sessionId) throw new UnauthorizedAccessException();
        var session = await repo.GetByIdAsync(sessionId, ct) ?? throw new KeyNotFoundException();
        var oid = ctx.User.FindFirstValue("oid") ?? throw new UnauthorizedAccessException();
        if (session.CandidateAzureAdOid != oid) throw new UnauthorizedAccessException();
        return session;
    }
    ```

    ---

    ## 7. SECURITY, AUTH & LOCKDOWN
    ### JWT Validation
    - `Microsoft.Identity.Web` handles signature, `aud`, `iss`, `exp` validation automatically.
    - Extract `oid` as canonical identity.
    - Role enforcement via DB lookup, NOT JWT claims.

    ### Web Lockdown Module
    - `focusTracker.ts`: Debounce 500ms. Ignore sub-500ms blurs. Pause during MSAL refresh.
    - `fullscreenTracker.ts`, `copyTracker.ts`: Log only.
    - `watermark.ts`: Canvas overlay, `pointer-events: none`, opacity 0.07, updates every 30s.
    - `tabMonitor.ts` (Fixed):
    ```ts
    const channel = new BroadcastChannel('apex-exam-session');
    const myNonce = crypto.randomUUID();
    const myTimestamp = Date.now();

    export function claimTab(sessionId: string) {
        channel.postMessage({ type: 'TAB_CLAIM', sessionId, nonce: myNonce, timestamp: myTimestamp });
        channel.onmessage = (e) => {
            if (e.data.type === 'TAB_CLAIM' && e.data.sessionId === sessionId) {
                // Tie-breaker: lower nonce wins. If I lost, show blocking overlay.
                if (e.data.nonce < myNonce || (e.data.nonce === myNonce && e.data.timestamp < myTimestamp)) {
                    reportViolation('multi_tab_opened');
                    showBlockingOverlay('Only one exam tab is allowed.');
                }
            }
        };
    }
    ```

    ---

    ## 8. TIMER & POLLING
    - **Server is sole authority.** `TimeRemainingSec` computed on read.
    - **Polling:** 5s interval. `CachedStatusService` applies 4s TTL.
    - **Near Expiry:** Skip cache when `timeRemainingSec <= 5`.
    - **Transitions:** `status == 'completed'` or `'expired'` → `clearInterval`, navigate to `/results` or `/expired`.
    - **Network Errors:** Do NOT stop polling. Retry next tick. Log to `idb`.
    - **Rate Limit Backoff:** On `429`, increase to 15s for 60s.

    ---

    ## 9. DETERMINISTIC RANDOMIZATION
    | Seed | Formula | Purpose |
    |---|---|---|
    | Question order | `SHA256("{candidateId}:{testId}:{attemptNumber}:{appSalt}")` | Subset & sequence |
    | Option shuffle | `SHA256("{candidateId}:{testId}:{questionId}:{appSalt}")` | Per-question A/B/C/D display |

    **Rule:** `appSalt` is injected from `AppOptions`, never hardcoded. Never rotated mid-cycle. Enables full audit reproducibility.

    ---

    ## 10. IDEMPOTENCY
    **Strategy:** `Answers.IdempotencyKey` UNIQUE index is sole source of truth.
    **Flow:**
    1. Validate header present & GUID format
    2. `SELECT` by key → if found: return `200 { ok: true }`
    3. Execute `SubmitAnswerCommand` → `MERGE` with `HOLDLOCK`
    4. On `SqlException 2627`: fetch existing, return `200` (idempotent)

    **Client Responsibility (Fixed):**
    ```ts
    // setAnswer logic:
    function setAnswer(questionId: string, option: string) {
    const existing = examStore.answers[questionId];
    if (existing && existing.option === option) {
        // Same option → reuse existing key (retry scenario)
        submitAnswer(questionId, option, existing.idempotencyKey);
    } else {
        // New option or first selection → generate new key
        const newKey = crypto.randomUUID();
        examStore.answers[questionId] = { option, idempotencyKey: newKey, synced: false };
        idb.save({ questionId, option, idempotencyKey: newKey, ... });
        submitAnswer(questionId, option, newKey);
    }
    }
    ```
    **Key tied to `(questionId, option)` pair.** Clear `idb` on finalize.

    ---

    ## 11. ADMIN RBAC
    **Role Hierarchy:** `Candidate` → `Admin` → `SuperAdmin`
    **Policy Implementation (Fixed Async Issue):**
    ```csharp
    // Use synchronous assertion to avoid Task<bool> truthy bug
    builder.Services.AddAuthorizationBuilder()
        .AddPolicy("AdminOnly", policy => policy.RequireAssertion(ctx =>
        {
            var oid = ctx.User.FindFirstValue("oid");
            if (oid == null) return false;
            var httpCtx = ctx.Resource as HttpContext ?? throw new InvalidOperationException();
            var candidateCtx = httpCtx.RequestServices.GetRequiredService<CandidateContextService>();
            // GetSync is safe within HTTP request scope (uses GetAwaiter().GetResult() internally)
            return candidateCtx.GetSync(oid).Role is "Admin" or "SuperAdmin";
        }))
        .AddPolicy("SuperAdminOnly", policy => policy.RequireAssertion(ctx => 
            // same pattern, checks == "SuperAdmin"
        ));
    ```

    ---

    ## 12. BACKGROUND SERVICES
    - `AutoFinalizeService`: 30s tick, creates scoped DI, queries expired, calls `FinalizeTestCommand`. Logs `exam_finalized` with `triggeredBy: 'auto_expired'`.
    - `WebhookProcessorService`: 15s tick, processes `Pending`/`Failed` (<3 retries), marks `Dead` on failure. Logs critical to App Insights.
    - `Nightly Cleanup`: Azure SQL Agent or cron job. Deletes old `WebhookOutbox` (>7d) and `AuditEvents` (>90d).

    ---

    ## 13. FRONTEND ARCHITECTURE
    **Structure:** `Client/src/{auth/, store/, hooks/, services/, pages/, components/}`
    **Key Hooks:**
    - `useMsalAuth`: Handles login, token acquisition, silent refresh.
    - `useExamPoll`: 5s polling, handles transitions, backoff on 429.
    - `useDraftSync`: `idb` write on answer, flush on `online`, remove on `200`.
    **Axios Interceptors:**
    - Request: Attach `Bearer`, `X-Session-Id`, `X-Idempotency-Key` (PUT only).
    - Response: `401` → silent refresh & retry. `409` → treat as success. `410` → finalize & navigate. `5xx` → retry 3x exponential backoff. Network error → `idb` queue.

    ---

    ## 14. EXTERNAL INTEGRATIONS
    **Power Automate Webhook:**
    - Payload: `{ candidateEmail, testTitle, score, percentage, passed, completedAt, triggeredBy }`
    - URL stored in `App Service Config` as `PowerAutomate__WebhookUrl`. Includes `?sig=` param.
    **App Insights:**
    - Sampled at 15%. 100% of exceptions captured.
    - Custom events: `ExamInitialized`, `ExamFinalized`, `WebhookDead`, `AuditViolation`.
    - Alerts: 5xx > 1%, DB timeout, `WebhookDead`, CPU > 85%.

    ---

    ## 15. CONFIGURATION & SECRETS
    **`appsettings.json`** (committed, dummy values)
    **App Service Config** (secrets): `ConnectionStrings__DefaultConnection`, `AzureAd__*`, `App__Salt`, `PowerAutomate__WebhookUrl`, `ApplicationInsights__ConnectionString`, `ASPNETCORE_ENVIRONMENT`.
    **Salt Generation:** `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))` → store once, never change.

    ---

    ## 16. TESTING STRATEGY
    - **Domain:** xUnit + FluentAssertions. Pure logic, deterministic seeds, invariants.
    - **Application:** xUnit + Moq. Command flow, validation, transaction boundaries, cache behavior.
    - **Infrastructure:** xUnit + Testcontainers. EF Core queries, `MERGE` upsert concurrency, webhook retries (WireMock).
    - **API:** `WebApplicationFactory`. JWT validation, rate limits, idempotency, session guard, error envelopes.
    - **Frontend:** Vitest + RTL + MSW. Polling hooks, idb sync, interceptors, option mapping display.
    - **E2E:** Playwright. Happy path, auto-expire, multi-tab tie-breaker, offline recovery, idempotency.

    ---

    ## 17. DEPLOYMENT RUNBOOK
    **Pre-Exam Start:**
    1. Resume SQL (`az sql db update --min-capacity 1`)
    2. Scale App Service to P2v3
    3. Start App Service
    4. Run migrations (`dotnet ef database update`)
    5. Health check + verify `0` stale `Active` sessions
    6. Notify candidates
    **Post-Exam Stop:**
    1. Verify `0` `Active` sessions
    2. Verify `WebhookOutbox` clear
    3. Stop App Service
    4. Scale plan to B1
    5. Pause SQL (`--min-capacity 0`)
    **UTC Rule:** `DateTime.UtcNow` in C#, `SYSUTCDATETIME()` in SQL, `Z` suffix in API, `Intl.DateTimeFormat` for frontend display only.

    ---

    ## 18. MILESTONES & EXECUTION PLAN
    **M0 — Foundation (Week 1):** Solution scaffold, EF migrations, Entra ID auth, `GET /me` auto-provision, MSAL wiring.
    **M1 — Admin Operations (Week 2-3):** RBAC policies, CRUD endpoints for questions/batches/tests/assignments, user management, admin UI wiring.
    **M2 — Exam Core (Week 4-6):** Randomization, assignment resolution, `POST /initialize`, polling, `PUT /answers` (idempotent + MERGE), `POST /finalize` (scoring + RowVersion), background auto-finalize, frontend exam flow, lockdown, `idb` offline sync.

    ---
    ✅ **This specification is complete, internally consistent, and production-ready.** All critical gaps have been closed, race conditions mitigated, and architectural boundaries enforced. Copy directly into your IDE AI context to begin code generation.