using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Persistence;

/// <summary>
/// Idempotent demo seeder — runs at startup, skips if data already exists.
/// Seeds: 1 SuperAdmin, 1 Admin, 3 Candidates, 1 CandidateBatch,
///        2 QuestionBatches (10 Qs each), 2 Tests, 2 Assignments.
/// All passwords: Demo@1234
/// </summary>
public class DataSeeder
{
    private readonly AppDbContext _db;
    private readonly ILogger<DataSeeder> _logger;

    // Fixed GUIDs so re-runs are fully idempotent
    private static readonly Guid SuperAdminId  = Guid.Parse("00000001-0000-0000-0000-000000000001");
    private static readonly Guid AdminId       = Guid.Parse("00000002-0000-0000-0000-000000000002");
    private static readonly Guid Candidate1Id  = Guid.Parse("00000003-0000-0000-0000-000000000003");
    private static readonly Guid Candidate2Id  = Guid.Parse("00000004-0000-0000-0000-000000000004");
    private static readonly Guid Candidate3Id  = Guid.Parse("00000005-0000-0000-0000-000000000005");

    private static readonly Guid BatchId       = Guid.Parse("00000010-0000-0000-0000-000000000010");
    private static readonly Guid QBatch1Id     = Guid.Parse("00000020-0000-0000-0000-000000000020");
    private static readonly Guid QBatch2Id     = Guid.Parse("00000021-0000-0000-0000-000000000021");
    private static readonly Guid Test1Id       = Guid.Parse("00000030-0000-0000-0000-000000000030");
    private static readonly Guid Test2Id       = Guid.Parse("00000031-0000-0000-0000-000000000031");
    private static readonly Guid Assignment1Id = Guid.Parse("00000040-0000-0000-0000-000000000040");
    private static readonly Guid Assignment2Id = Guid.Parse("00000041-0000-0000-0000-000000000041");

    public DataSeeder(AppDbContext db, ILogger<DataSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        // Guard — skip entirely if SuperAdmin already exists
        if (await _db.Candidates.AnyAsync(c => c.CandidateId == SuperAdminId, ct))
        {
            _logger.LogInformation("DataSeeder: seed data already present, skipping.");
            return;
        }

        _logger.LogInformation("DataSeeder: seeding demo data...");

        await SeedCandidatesAsync(ct);
        await SeedBatchesAsync(ct);
        await SeedQuestionBatchesAsync(ct);
        await SeedTestsAsync(ct);   
        await SeedAssignmentsAsync(ct);

        _logger.LogInformation("DataSeeder: done.");
    }

    // ── Candidates ────────────────────────────────────────────────────────────

    private async Task SeedCandidatesAsync(CancellationToken ct)
    {
        var candidates = new[]
        {
            MakeCandidate(SuperAdminId, "superadmin@apex.demo", "SA_OID_001", "Super Admin",  Role.SuperAdmin),
            MakeCandidate(AdminId,      "admin@apex.demo",      "AD_OID_002", "Demo Admin",   Role.Admin),
            MakeCandidate(Candidate1Id, "alice@apex.demo",      "C1_OID_003", "Alice Johnson", Role.Candidate),
            MakeCandidate(Candidate2Id, "bob@apex.demo",        "C2_OID_004", "Bob Smith",    Role.Candidate),
            MakeCandidate(Candidate3Id, "carol@apex.demo",      "C3_OID_005", "Carol White",  Role.Candidate),
        };

        await _db.Candidates.AddRangeAsync(candidates, ct);
        await _db.SaveChangesAsync(ct);
    }

    private static Candidate MakeCandidate(Guid id, string email, string oid, string name, Role role)
    {
        var c = Candidate.Create(email, oid, name, role);
        // Override the auto-generated ID with our fixed one for idempotency
        typeof(Candidate).GetProperty("CandidateId")!.SetValue(c, id);
        c.SetPassword("Demo@1234");
        return c;
    }

    // ── Candidate Batch ───────────────────────────────────────────────────────

    private async Task SeedBatchesAsync(CancellationToken ct)
    {
        var batch = Batch.Create("Demo Cohort 2026", AdminId, "Software Engineering", "Full Stack");
        SetId(batch, "BatchId", BatchId);

        await _db.Batches.AddAsync(batch, ct);
        await _db.SaveChangesAsync(ct);

        var members = new[]
        {
            BatchMember.Create(BatchId, Candidate1Id),
            BatchMember.Create(BatchId, Candidate2Id),
            BatchMember.Create(BatchId, Candidate3Id),
        };

        await _db.BatchMembers.AddRangeAsync(members, ct);
        await _db.SaveChangesAsync(ct);
    }

    // ── Question Batches ──────────────────────────────────────────────────────

    private async Task SeedQuestionBatchesAsync(CancellationToken ct)
    {
        var qb1 = QuestionBatch.Create("C# & .NET Fundamentals", AdminId, "Backend", "C#", Difficulty.Intermediate);
        SetId(qb1, "QuestionBatchId", QBatch1Id);

        var qb2 = QuestionBatch.Create("Web & React Basics", AdminId, "Frontend", "React", Difficulty.Beginner);
        SetId(qb2, "QuestionBatchId", QBatch2Id);

        await _db.QuestionBatches.AddRangeAsync(new[] { qb1, qb2 }, ct);
        await _db.SaveChangesAsync(ct);

        await SeedQuestionsAsync(QBatch1Id, DotNetQuestions(), ct);
        await SeedQuestionsAsync(QBatch2Id, ReactQuestions(), ct);
    }

    private async Task SeedQuestionsAsync(Guid batchId, IEnumerable<Question> questions, CancellationToken ct)
    {
        var list = questions.ToList();
        await _db.Questions.AddRangeAsync(list, ct);
        await _db.SaveChangesAsync(ct);

        var members = list.Select(q => QuestionBatchMember.Create(batchId, q.QuestionId));
        await _db.QuestionBatchMembers.AddRangeAsync(members, ct);
        await _db.SaveChangesAsync(ct);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    private async Task SeedTestsAsync(CancellationToken ct)
    {
        var t1 = Test.Create("C# Fundamentals Assessment", 30, 60, "Core C# and .NET concepts");
        SetId(t1, "TestId", Test1Id);

        var t2 = Test.Create("React & Web Basics", 25, 60, "Frontend fundamentals with React");
        SetId(t2, "TestId", Test2Id);

        await _db.Tests.AddRangeAsync(new[] { t1, t2 }, ct);
        await _db.SaveChangesAsync(ct);
    }

    // ── Assignments ───────────────────────────────────────────────────────────

    private async Task SeedAssignmentsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // Assignment 1 — C# test for the whole demo batch, active now
        var a1 = TestAssignment.CreateForBatch(
            Test1Id, QBatch1Id, BatchId,
            questionCount: 8,
            scheduledStart: now.AddMinutes(-5),   // already started
            deadline: now.AddDays(7),
            maxAttempts: 2);
        SetId(a1, "AssignmentId", Assignment1Id);

        // Assignment 2 — React test for the whole demo batch, upcoming
        var a2 = TestAssignment.CreateForBatch(
            Test2Id, QBatch2Id, BatchId,
            questionCount: 8,
            scheduledStart: now.AddDays(1),
            deadline: now.AddDays(8),
            maxAttempts: 1);
        SetId(a2, "AssignmentId", Assignment2Id);

        await _db.TestAssignments.AddRangeAsync(new[] { a1, a2 }, ct);
        await _db.SaveChangesAsync(ct);
    }

    // ── Question data ─────────────────────────────────────────────────────────

    private IEnumerable<Question> DotNetQuestions() => new[]
    {
        Q("What does the 'sealed' keyword do in C#?",
            "Prevents a class from being inherited",
            "Makes all members private",
            "Prevents a class from being instantiated",
            "Makes a class abstract",
            'A'),
        Q("Which collection guarantees O(1) average lookup by key?",
            "List<T>", "Dictionary<TKey,TValue>", "Queue<T>", "LinkedList<T>", 'B'),
        Q("What is the purpose of 'async/await' in C#?",
            "To run code on multiple threads simultaneously",
            "To write asynchronous code in a synchronous style",
            "To improve CPU-bound performance",
            "To replace try/catch blocks",
            'B'),
        Q("Which keyword is used to define an interface in C#?",
            "abstract", "virtual", "interface", "contract", 'C'),
        Q("What does LINQ stand for?",
            "Language Integrated Query",
            "List Integrated Query",
            "Language Internal Queue",
            "Linked Integrated Query",
            'A'),
        Q("What is the difference between 'ref' and 'out' parameters?",
            "There is no difference",
            "'ref' requires initialization before passing; 'out' does not",
            "'out' requires initialization before passing; 'ref' does not",
            "'ref' is for value types only",
            'B'),
        Q("Which EF Core method persists tracked changes to the database?",
            "CommitAsync()", "FlushAsync()", "SaveChangesAsync()", "PersistAsync()", 'C'),
        Q("What is dependency injection?",
            "A way to hard-code dependencies inside a class",
            "A design pattern where dependencies are provided externally",
            "A method to inject SQL into queries",
            "A way to inherit from multiple classes",
            'B'),
        Q("What does 'IEnumerable<T>' represent?",
            "A fixed-size array",
            "A thread-safe collection",
            "A forward-only sequence that can be iterated",
            "A key-value store",
            'C'),
        Q("Which access modifier makes a member accessible only within its class?",
            "internal", "protected", "private", "public", 'C'),
    };

    private IEnumerable<Question> ReactQuestions() => new[]
    {
        Q("What is the Virtual DOM in React?",
            "A direct copy of the browser DOM stored in a database",
            "A lightweight in-memory representation used to compute minimal updates",
            "A server-side rendering technique",
            "A browser API for faster DOM manipulation",
            'B'),
        Q("Which hook is used to manage state in a functional component?",
            "useEffect", "useContext", "useState", "useReducer", 'C'),
        Q("What does useEffect with an empty dependency array do?",
            "Runs on every render",
            "Runs only when a specific state changes",
            "Runs once after the initial render",
            "Never runs",
            'C'),
        Q("What is JSX?",
            "A JavaScript XML parser",
            "A syntax extension that looks like HTML inside JavaScript",
            "A new version of JavaScript",
            "A CSS-in-JS library",
            'B'),
        Q("How do you pass data from a parent to a child component?",
            "Via state", "Via props", "Via context only", "Via refs", 'B'),
        Q("What does the 'key' prop do in a list?",
            "Styles the list item",
            "Helps React identify which items changed, were added, or removed",
            "Sets the tab order",
            "Prevents re-renders",
            'B'),
        Q("Which method is used to update state based on the previous state?",
            "setState(state + 1)",
            "setState(prev => prev + 1)",
            "state = state + 1",
            "forceUpdate()",
            'B'),
        Q("What is the purpose of React.memo?",
            "To memoize expensive calculations",
            "To prevent a component from re-rendering if props haven't changed",
            "To cache API responses",
            "To create a ref",
            'B'),
        Q("What does the useCallback hook do?",
            "Caches the result of a function call",
            "Returns a memoized callback that only changes if dependencies change",
            "Replaces useState for complex state",
            "Subscribes to a context",
            'B'),
        Q("What is the correct way to conditionally render in JSX?",
            "if/else blocks inside JSX",
            "Ternary operator or && short-circuit",
            "switch statements inside JSX",
            "Only using CSS display:none",
            'B'),
    };

    private Question Q(string content, string a, string b, string c, string d, char correct) =>
        Question.Create(content, a, b, c, d, correct, AdminId);

    // ── Reflection helper to set private IDs ──────────────────────────────────

    private static void SetId(object entity, string propertyName, Guid id)
    {
        var prop = entity.GetType().GetProperty(propertyName)
            ?? throw new InvalidOperationException($"Property {propertyName} not found on {entity.GetType().Name}");
        prop.SetValue(entity, id);
    }
}
