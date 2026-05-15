import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Plus, Trash2, Upload, Download, Save, ArrowLeft, CheckCircle,
  ChevronDown, Loader2, Pencil, X,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { toast } from 'sonner';
import {
  getQuestionBatches, createQuestionBatch, createQuestionsInBatch,
  getQuestionsInBatch, updateQuestion, QuestionBatchDto, QuestionDto,
} from '../services/apiService';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type OptionLabel = 'A' | 'B' | 'C' | 'D';

interface QuestionCard {
  // null = new (not yet saved), string = existing questionId
  questionId: string | null;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: OptionLabel;
  weightage: number;
  // UI state
  editing: boolean;
  dirty: boolean;   // has unsaved changes
}

const optionLabels: OptionLabel[] = ['A', 'B', 'C', 'D'];

const fromDto = (q: QuestionDto): QuestionCard => ({
  questionId:    q.questionId,
  content:       q.content,
  optionA:       q.optionA,
  optionB:       q.optionB,
  optionC:       q.optionC,
  optionD:       q.optionD,
  correctOption: q.correctOption as OptionLabel,
  weightage:     q.weightage,
  editing:       false,
  dirty:         false,
});

const blankCard = (): QuestionCard => ({
  questionId:    null,
  content:       '',
  optionA:       '',
  optionB:       '',
  optionC:       '',
  optionD:       '',
  correctOption: 'A',
  weightage:     1,
  editing:       true,
  dirty:         true,
});

const cardBase: React.CSSProperties = {
  background:    'rgba(255,255,255,0.70)',
  border:        '1px solid rgba(15,76,117,0.12)',
  backdropFilter:'blur(12px)',
  boxShadow:     '0 2px 12px rgba(15,76,117,0.06)',
};

const inputCss: React.CSSProperties = {
  background: 'rgba(255,255,255,0.85)',
  border:     '1px solid rgba(15,76,117,0.18)',
  color:      '#2D3436',
  outline:    'none',
};

// ── Main component ────────────────────────────────────────────────────────────

const QuestionEditor: React.FC = () => {
  const { batchId } = useParams();
  const navigate    = useNavigate();
  const isEditMode  = !!batchId;

  // Batch-creation state (only used when !isEditMode)
  const [batches,        setBatches]        = useState<QuestionBatchDto[]>([]);
  const [batchMode,      setBatchMode]      = useState<'existing' | 'new'>('new');
  const [selectedBatchId,setSelectedBatchId]= useState('');
  const [batchName,      setBatchName]      = useState('');
  const [domain,         setDomain]         = useState('');
  const [topic,          setTopic]          = useState('');
  const [difficulty,     setDifficulty]     = useState<Difficulty>('Intermediate');

  // Question cards (existing + new)
  const [cards,   setCards]   = useState<QuestionCard[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving,  setSaving]  = useState(false);

  const currentBatch = batches.find(b => b.questionBatchId === batchId);
  const selectedBatch= batches.find(b => b.questionBatchId === selectedBatchId);

  // Load batches list
  useEffect(() => {
    getQuestionBatches().then(setBatches).catch(() => {});
  }, []);

  // Load existing questions when in edit mode
  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    getQuestionsInBatch(batchId)
      .then(qs => setCards(qs.map(fromDto)))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [batchId]);

  // ── Card helpers ────────────────────────────────────────────────────────────

  const updateCard = (index: number, patch: Partial<QuestionCard>) =>
    setCards(prev => prev.map((c, i) => i === index ? { ...c, ...patch, dirty: true } : c));

  const setEditing = (index: number, editing: boolean) =>
    setCards(prev => prev.map((c, i) => i === index ? { ...c, editing } : c));

  const removeCard = (index: number) => {
    const card = cards[index];
    if (card.questionId !== null) {
      // Existing question — just cancel edit, don't delete from DB
      setEditing(index, false);
      // Reload original from server to discard changes
      getQuestionsInBatch(batchId!)
        .then(qs => setCards(qs.map(fromDto)))
        .catch(() => {});
    } else {
      setCards(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addBlankCard = () => {
    setCards(prev => [...prev, blankCard()]);
    if (isEditMode) {
      toast.info('Question added', {
        description: 'Fill in the details below, then click Save to add it to the batch.',
        duration: 5000,
      });
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateCard = (c: QuestionCard, idx: number): boolean => {
    if (!c.content.trim())  { toast.error(`Q${idx + 1}: content is required`); return false; }
    if (!c.optionA.trim() || !c.optionB.trim() || !c.optionC.trim() || !c.optionD.trim()) {
      toast.error(`Q${idx + 1}: all options are required`); return false;
    }
    return true;
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const dirtyCards = cards.filter(c => c.dirty);
    if (dirtyCards.length === 0) { toast.info('No changes to save'); return; }

    for (let i = 0; i < cards.length; i++) {
      if (cards[i].dirty && !validateCard(cards[i], i)) return;
    }

    setSaving(true);
    try {
      let targetBatchId = batchId ?? selectedBatchId;

      // Create batch if needed
      if (!isEditMode && batchMode === 'new') {
        if (!batchName.trim()) { toast.error('Batch name is required'); setSaving(false); return; }
        const r = await createQuestionBatch({
          name: batchName, domain: domain || undefined,
          topic: topic || undefined, difficulty: difficulty || undefined,
        });
        targetBatchId = r.questionBatchId;
      } else if (!isEditMode && !selectedBatchId) {
        toast.error('Please select a batch'); setSaving(false); return;
      }

      const toUpdate = dirtyCards.filter(c => c.questionId !== null);
      const toCreate = dirtyCards.filter(c => c.questionId === null);

      // Update existing questions
      await Promise.all(toUpdate.map(c =>
        updateQuestion(c.questionId!, {
          content: c.content, optionA: c.optionA, optionB: c.optionB,
          optionC: c.optionC, optionD: c.optionD,
          correctOption: c.correctOption, weightage: Number(c.weightage) || 1,
        })
      ));

      // Create new questions in bulk
      if (toCreate.length > 0) {
        await createQuestionsInBatch(targetBatchId, toCreate.map(c => ({
          content: c.content, optionA: c.optionA, optionB: c.optionB,
          optionC: c.optionC, optionD: c.optionD,
          correctOption: c.correctOption, weightage: Number(c.weightage) || 1,
        })));
      }

      toast.success(
        toUpdate.length > 0 && toCreate.length > 0
          ? `${toUpdate.length} updated, ${toCreate.length} added`
          : toUpdate.length > 0
          ? `${toUpdate.length} question${toUpdate.length > 1 ? 's' : ''} updated`
          : `${toCreate.length} question${toCreate.length > 1 ? 's' : ''} added`
      );

      if (isEditMode) {
        const refreshed = await getQuestionsInBatch(targetBatchId);
        setCards(refreshed.map(fromDto));
      } else {
        setTimeout(() => navigate('/admin/questions'), 1000);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // ── CSV ─────────────────────────────────────────────────────────────────────

  // RFC 4180 compliant parser — handles quoted fields containing commas/newlines
  const parseCSVLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } // escaped quote
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-uploaded
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = (ev.target?.result as string)
        .split('\n')
        .filter(l => l.trim())
        .slice(1); // skip header row

      const imported = lines.map(line => {
        const [content, optionA, optionB, optionC, optionD, correctOption, weightage] = parseCSVLine(line);
        const correct = correctOption?.toUpperCase();
        return {
          ...blankCard(),
          content,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOption: (['A','B','C','D'].includes(correct) ? correct : 'A') as OptionLabel,
          weightage: parseFloat(weightage) > 0 ? parseFloat(weightage) : 1,
        };
      }).filter(q => q.content); // skip empty rows

      setCards(prev => [...prev, ...imported]);

      toast.success(`${imported.length} question${imported.length !== 1 ? 's' : ''} imported`, {
        description: 'Review the questions below, then click Save to add them to the batch.',
        duration: 6000,
      });
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const escape = (v: string | number) => {
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const rows = [
      'Content,Option A,Option B,Option C,Option D,Correct Option,Weightage',
      ...cards.map(c =>
        [c.content, c.optionA, c.optionB, c.optionC, c.optionD, c.correctOption, c.weightage]
          .map(escape).join(',')
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'questions.csv';
    a.click();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const dirtyCount = cards.filter(c => c.dirty).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate('/admin/questions')}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#636E72' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0F4C75')}
          onMouseLeave={e => (e.currentTarget.style.color = '#636E72')}>
          <ArrowLeft className="w-4 h-4" /> Back to Questions
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: '#0F4C75' }}>
              {isEditMode ? (currentBatch?.name ?? 'Question Batch') : 'Create Questions'}
            </h1>
            <p className="text-sm" style={{ color: '#636E72' }}>
              {isEditMode
                ? `${cards.length} question${cards.length !== 1 ? 's' : ''}${dirtyCount > 0 ? ` · ${dirtyCount} unsaved change${dirtyCount > 1 ? 's' : ''}` : ''}`
                : 'Add questions to a batch.'}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer"
              style={{ background: 'rgba(27,154,170,0.1)', border: '1px solid rgba(27,154,170,0.25)', color: '#1B9AAA' }}>
              <Upload className="w-3.5 h-3.5" /> Import CSV
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(27,154,170,0.1)', border: '1px solid rgba(27,154,170,0.25)', color: '#1B9AAA' }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={handleSave} disabled={saving || dirtyCount === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0F4C75, #1B9AAA)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : `Save${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
            </button>
          </div>
        </div>

        {/* Batch selection — create mode only */}
        {!isEditMode && (
          <div className="rounded-2xl p-6 mb-6" style={cardBase}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F4C75' }}>Batch</h2>
            <div className="flex gap-1 p-1 rounded-xl mb-4 w-fit"
              style={{ background: 'rgba(15,76,117,0.06)' }}>
              {(['new', 'existing'] as const).map(m => (
                <button key={m} onClick={() => setBatchMode(m)}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: batchMode === m ? 'rgba(15,76,117,0.12)' : 'transparent',
                    color: batchMode === m ? '#0F4C75' : '#636E72',
                    border: batchMode === m ? '1px solid rgba(15,76,117,0.2)' : '1px solid transparent',
                  }}>
                  {m === 'new' ? 'Create New' : 'Add to Existing'}
                </button>
              ))}
            </div>

            {batchMode === 'new' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>
                    Batch Name <span style={{ color: '#E07A5F' }}>*</span>
                  </label>
                  <input type="text" value={batchName} onChange={e => setBatchName(e.target.value)}
                    placeholder="e.g., Python Fundamentals"
                    className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputCss} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Domain</label>
                  <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
                    placeholder="e.g., Backend" className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputCss} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Topic</label>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="e.g., Python" className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputCss} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>Difficulty</label>
                  <div className="relative">
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none" style={inputCss}>
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#636E72' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none" style={inputCss}>
                  <option value="">— Choose a batch —</option>
                  {batches.map(b => (
                    <option key={b.questionBatchId} value={b.questionBatchId}>
                      {b.name} ({b.questionCount} questions)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 pointer-events-none" style={{ color: '#636E72' }} />
                {selectedBatch && (
                  <p className="text-xs mt-2" style={{ color: '#1B9AAA' }}>
                    {[selectedBatch.domain, selectedBatch.topic, selectedBatch.difficulty].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Questions list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B9AAA' }} />
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card, i) => (
              <QuestionCard
                key={card.questionId ?? `new-${i}`}
                card={card}
                index={i}
                onChange={(field, value) => updateCard(i, { [field]: value } as any)}
                onToggleEdit={() => setEditing(i, !card.editing)}
                onDiscard={() => removeCard(i)}
              />
            ))}

            {/* Add question button */}
            <button onClick={addBlankCard}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all duration-200"
              style={{
                background: 'rgba(15,76,117,0.04)',
                border: '2px dashed rgba(15,76,117,0.2)',
                color: '#1B9AAA',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(27,154,170,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(27,154,170,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(15,76,117,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,76,117,0.2)'; }}>
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// ── Question Card ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  card: QuestionCard;
  index: number;
  onChange: (field: keyof QuestionCard, value: string | number) => void;
  onToggleEdit: () => void;
  onDiscard: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ card, index, onChange, onToggleEdit, onDiscard }) => {
  const isNew = card.questionId === null;

  if (!card.editing) {
    // ── Read-only view ──
    return (
      <div className="rounded-2xl p-5 transition-all duration-200"
        style={{ ...cardBase, borderLeft: card.dirty ? '3px solid #1B9AAA' : undefined }}>
        <div className="flex items-start gap-3 mb-4">
          <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(15,76,117,0.08)', color: '#0F4C75' }}>Q{index + 1}</span>
          <p className="text-sm flex-1" style={{ color: '#2D3436' }}>{card.content}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(15,76,117,0.07)', color: '#636E72', border: '1px solid rgba(15,76,117,0.12)' }}>
              {card.weightage}pt{card.weightage !== 1 ? 's' : ''}
            </span>
            <button onClick={onToggleEdit}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: '#1B9AAA', background: 'rgba(27,154,170,0.08)' }}
              title="Edit question">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {optionLabels.map(label => {
            const text = card[`option${label}` as keyof QuestionCard] as string;
            const isCorrect = card.correctOption === label;
            return (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: isCorrect ? 'rgba(27,154,170,0.1)' : 'rgba(255,255,255,0.8)',
                  border: isCorrect ? '1px solid rgba(27,154,170,0.3)' : '1px solid rgba(15,76,117,0.08)',
                  color: isCorrect ? '#1B9AAA' : '#636E72',
                }}>
                <span className="font-semibold w-4">{label}</span>
                <span className="flex-1">{text}</span>
                {isCorrect && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Edit view ──
  return (
    <div className="rounded-2xl p-5"
      style={{ ...cardBase, border: '1px solid rgba(27,154,170,0.3)', boxShadow: '0 4px 20px rgba(27,154,170,0.1)' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold" style={{ color: '#0F4C75' }}>
          {isNew ? `New Question` : `Edit Q${index + 1}`}
        </span>
        <button onClick={onDiscard} title={isNew ? 'Remove' : 'Discard changes'}
          className="p-1.5 rounded-lg" style={{ color: '#E07A5F' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <label className="block text-xs mb-1.5" style={{ color: '#636E72' }}>
          Question <span style={{ color: '#E07A5F' }}>*</span>
        </label>
        <textarea value={card.content} onChange={e => onChange('content', e.target.value)}
          placeholder="Enter question..." rows={2}
          className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(15,76,117,0.15)', color: '#2D3436', outline: 'none' }} />
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {optionLabels.map(label => {
          const field = `option${label}` as keyof QuestionCard;
          const isCorrect = card.correctOption === label;
          return (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: isCorrect ? 'rgba(27,154,170,0.08)' : 'rgba(255,255,255,0.9)',
                border: isCorrect ? '1px solid rgba(27,154,170,0.3)' : '1px solid rgba(15,76,117,0.12)',
              }}>
              <button onClick={() => onChange('correctOption', label)}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: isCorrect ? '#1B9AAA' : '#B2BEC3', background: isCorrect ? '#1B9AAA' : 'transparent' }}
                title="Mark as correct">
                {isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
              </button>
              <span className="text-xs font-semibold w-4 flex-shrink-0"
                style={{ color: isCorrect ? '#1B9AAA' : '#636E72' }}>{label}</span>
              <input type="text" value={card[field] as string}
                onChange={e => onChange(field, e.target.value)}
                placeholder={`Option ${label}`}
                className="flex-1 text-sm bg-transparent outline-none" style={{ color: '#2D3436' }} />
            </div>
          );
        })}
      </div>

      {/* Weightage + Done */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs flex-shrink-0" style={{ color: '#636E72' }}>Weightage</label>
          <input type="number" min={1} max={10} step={1}
            value={card.weightage}
            onChange={e => onChange('weightage', e.target.value)}
            className="w-16 px-3 py-1.5 rounded-lg text-sm text-center outline-none"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(15,76,117,0.15)', color: '#2D3436' }} />
          <span className="text-xs" style={{ color: '#636E72' }}>
            pt{Number(card.weightage) !== 1 ? 's' : ''}
          </span>
        </div>
        {/* Done editing — collapse back to read-only */}
        {!isNew && (
          <button onClick={onToggleEdit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(15,76,117,0.08)', color: '#0F4C75', border: '1px solid rgba(15,76,117,0.15)' }}>
            Done editing
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;
