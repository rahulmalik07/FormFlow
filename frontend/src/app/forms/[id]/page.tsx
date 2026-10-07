'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Globe, Share2, Plus, BarChart2, Trash2,
  GripVertical, Type, AlignLeft, List, ChevronDown, Mail,
  Hash, ThumbsUp, Star, Eye, EyeOff, X, Check, Download
} from 'lucide-react';
import { Form, Question, QuestionType } from '@/lib/types';
import {
  getForm, updateForm, publishForm, unpublishForm,
  createQuestion, updateQuestion, deleteQuestion, reorderQuestions
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ──────────────────────────────────────────────
// Question Type Config
// ──────────────────────────────────────────────

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'short_text', label: 'Short Text', icon: <Type className="w-5 h-5" />, description: 'Single line text input' },
  { type: 'long_text', label: 'Long Text', icon: <AlignLeft className="w-5 h-5" />, description: 'Multi-line text area' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: <List className="w-5 h-5" />, description: 'Select from options' },
  { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="w-5 h-5" />, description: 'Dropdown selector' },
  { type: 'email', label: 'Email', icon: <Mail className="w-5 h-5" />, description: 'Email address input' },
  { type: 'number', label: 'Number', icon: <Hash className="w-5 h-5" />, description: 'Numeric input' },
  { type: 'yes_no', label: 'Yes / No', icon: <ThumbsUp className="w-5 h-5" />, description: 'Binary choice' },
  { type: 'rating', label: 'Rating', icon: <Star className="w-5 h-5" />, description: 'Star rating scale' },
];

function getTypeIcon(type: QuestionType) {
  const found = QUESTION_TYPES.find(t => t.type === type);
  return found?.icon || <Type className="w-5 h-5" />;
}

function getTypeLabel(type: QuestionType) {
  const found = QUESTION_TYPES.find(t => t.type === type);
  return found?.label || type;
}

// ──────────────────────────────────────────────
// Sortable Question Item
// ──────────────────────────────────────────────

function SortableQuestion({ question, index, isActive, onClick }: { question: Question; index: number; isActive: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-3 border-b border-[#E5E5E5] cursor-pointer transition-colors ${
        isActive ? 'bg-indigo-50 border-l-4 border-l-[#4F46E5]' : 'hover:bg-gray-50'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </div>
      <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>
      <div className="text-gray-500 shrink-0">{getTypeIcon(question.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-[#191919]">
          {question.title || 'Untitled Question'}
        </div>
        <div className="text-xs text-gray-400 capitalize">{getTypeLabel(question.type)}</div>
      </div>
      {question.required && (
        <span className="text-red-500 text-xs font-bold">*</span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Live Question Preview Component
// ──────────────────────────────────────────────

function LiveQuestionPreview({ question, index }: { question: Question; index: number }) {
  const maxRating = question.settings?.max || 5;

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center p-8 overflow-y-auto">
      <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">Live Respondent Preview</div>
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-[#4F46E5] font-bold text-lg mt-0.5">{index + 1}&nbsp;→</span>
          <h3 className="text-2xl font-bold text-[#191919] leading-snug">
            {question.title || 'Untitled Question'}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>
        {question.description && (
          <p className="text-sm text-gray-500 ml-8">{question.description}</p>
        )}
      </div>

      <div className="ml-8 space-y-4">
        {question.type === 'short_text' && (
          <input
            type="text"
            disabled
            placeholder="Type your answer here..."
            className="w-full text-lg border-b-2 border-gray-300 pb-2 bg-transparent text-gray-400 cursor-not-allowed"
          />
        )}

        {question.type === 'long_text' && (
          <textarea
            disabled
            rows={3}
            placeholder="Type your answer here..."
            className="w-full text-base border-b-2 border-gray-300 pb-2 bg-transparent text-gray-400 resize-none cursor-not-allowed"
          />
        )}

        {question.type === 'email' && (
          <input
            type="email"
            disabled
            placeholder="name@example.com"
            className="w-full text-lg border-b-2 border-gray-300 pb-2 bg-transparent text-gray-400 cursor-not-allowed"
          />
        )}

        {question.type === 'number' && (
          <input
            type="number"
            disabled
            placeholder="Type a number..."
            className="w-full text-lg border-b-2 border-gray-300 pb-2 bg-transparent text-gray-400 cursor-not-allowed"
          />
        )}

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {(question.options || ['Option 1', 'Option 2']).map((opt, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                <span className="w-6 h-6 rounded bg-white border border-gray-300 text-xs font-bold flex items-center justify-center">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-medium">{opt}</span>
              </div>
            ))}
          </div>
        )}

        {question.type === 'dropdown' && (
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex justify-between items-center text-sm">
            <span>Select an option...</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {question.type === 'yes_no' && (
          <div className="flex gap-3">
            <div className="flex-1 py-3 px-4 rounded-lg border border-gray-200 bg-gray-50 text-center font-bold text-gray-700 text-sm">
              Y • Yes
            </div>
            <div className="flex-1 py-3 px-4 rounded-lg border border-gray-200 bg-gray-50 text-center font-bold text-gray-700 text-sm">
              N • No
            </div>
          </div>
        )}

        {question.type === 'rating' && (
          <div className="flex gap-2">
            {Array.from({ length: maxRating }, (_, i) => (
              <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        )}

        <div className="pt-2 flex items-center gap-3">
          <div className="px-4 py-2 bg-[#4F46E5] text-white text-xs font-bold rounded flex items-center gap-1.5 opacity-90">
            OK <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs text-gray-400">press Enter ↵</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Question Editor Panel
// ──────────────────────────────────────────────

function QuestionEditor({
  question,
  formId,
  onUpdate,
  onDelete,
}: {
  question: Question;
  formId: number;
  onUpdate: (q: Question) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || '');
  const [required, setRequired] = useState(question.required);
  const [options, setOptions] = useState<string[]>(question.options || ['Option 1', 'Option 2']);
  const [questionType, setQuestionType] = useState<QuestionType>(question.type);
  const [maxRating, setMaxRating] = useState(question.settings?.max || 5);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description || '');
    setRequired(question.required);
    setOptions(question.options || ['Option 1', 'Option 2']);
    setQuestionType(question.type);
    setMaxRating(question.settings?.max || 5);
  }, [question.id]);

  const saveField = useCallback(async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = await updateQuestion(formId, question.id, data as any);
      onUpdate(updated);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [formId, question.id, onUpdate]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    onUpdate({ ...question, title: val });
  };

  const handleTitleBlur = () => {
    if (title !== question.title) saveField({ title });
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    onUpdate({ ...question, description: val });
  };

  const handleDescBlur = () => {
    if (description !== (question.description || '')) saveField({ description: description || null });
  };

  const handleRequiredToggle = () => {
    const newVal = !required;
    setRequired(newVal);
    onUpdate({ ...question, required: newVal });
    saveField({ required: newVal });
  };

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    const data: Record<string, unknown> = { type: newType };
    if (newType === 'multiple_choice' || newType === 'dropdown') {
      data.options = options.length > 0 ? options : ['Option 1', 'Option 2'];
    } else {
      data.options = null;
    }
    if (newType === 'rating') {
      data.settings = { max: maxRating };
    }
    onUpdate({ ...question, ...data } as Question);
    saveField(data);
  };

  const handleOptionsChange = (newOptions: string[]) => {
    setOptions(newOptions);
    onUpdate({ ...question, options: newOptions });
    saveField({ options: newOptions });
  };

  const handleAddOption = () => {
    const newOptions = [...options, `Option ${options.length + 1}`];
    handleOptionsChange(newOptions);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 1) return;
    const newOptions = options.filter((_, i) => i !== idx);
    handleOptionsChange(newOptions);
  };

  const handleOptionEdit = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
    onUpdate({ ...question, options: newOptions });
  };

  const handleOptionBlur = () => {
    saveField({ options });
  };

  const handleMaxRatingChange = (val: number) => {
    setMaxRating(val);
    onUpdate({ ...question, settings: { max: val } });
    saveField({ settings: { max: val } });
  };

  const handleDeleteQuestion = async () => {
    setDeleting(true);
    try {
      await deleteQuestion(formId, question.id);
      onDelete();
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  const showOptions = questionType === 'multiple_choice' || questionType === 'dropdown';

  return (
    <div className="space-y-6">
      {/* Question Type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Question Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUESTION_TYPES.map(qt => (
            <button
              key={qt.type}
              onClick={() => handleTypeChange(qt.type)}
              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col items-center gap-1 ${
                questionType === qt.type
                  ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5] font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              }`}
            >
              {qt.icon}
              <span className="text-xs text-center">{qt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Question Title</label>
        <input
          type="text"
          className="w-full text-lg p-3 border-2 border-gray-200 rounded-lg focus:border-[#4F46E5] outline-none transition-colors"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Your question here..."
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Description / Help Text (Optional)</label>
        <textarea
          className="w-full p-2.5 border-2 border-gray-200 rounded-lg focus:border-[#4F46E5] outline-none resize-none transition-colors text-sm"
          value={description}
          onChange={e => handleDescChange(e.target.value)}
          onBlur={handleDescBlur}
          placeholder="Add guidance or context for respondents..."
          rows={2}
        />
      </div>

      {/* Options for multiple choice / dropdown */}
      {showOptions && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Choices / Options</label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-200 rounded-lg focus:border-[#4F46E5] outline-none text-sm"
                  value={opt}
                  onChange={e => handleOptionEdit(idx, e.target.value)}
                  onBlur={handleOptionBlur}
                />
                <button
                  onClick={() => handleRemoveOption(idx)}
                  disabled={options.length <= 1}
                  className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-semibold flex items-center gap-1 mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add option
            </button>
          </div>
        </div>
      )}

      {/* Rating settings */}
      {questionType === 'rating' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Scale (Max Rating)</label>
          <div className="flex items-center gap-2">
            {[3, 4, 5, 7, 10].map(val => (
              <button
                key={val}
                onClick={() => handleMaxRatingChange(val)}
                className={`w-10 h-8 rounded border font-bold text-xs ${
                  maxRating === val
                    ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Required toggle */}
      <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <div className="text-sm font-semibold text-gray-800">Required Question</div>
          <div className="text-xs text-gray-500">Respondents cannot proceed without answering</div>
        </div>
        <button
          onClick={handleRequiredToggle}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            required ? 'bg-[#4F46E5]' : 'bg-gray-300'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
            required ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* Delete */}
      <div className="pt-2 flex justify-between items-center">
        <Button
          variant="danger"
          size="sm"
          onClick={handleDeleteQuestion}
          isLoading={deleting}
        >
          <Trash2 className="w-4 h-4 mr-1.5" /> Delete Question
        </Button>
        {saving && (
          <span className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping mr-1" />
            Saving changes...
          </span>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Builder Page
// ──────────────────────────────────────────────

export default function FormBuilder({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreviewPane, setShowPreviewPane] = useState(true);

  const fetchForm = useCallback(async () => {
    try {
      const data = await getForm(Number(params.id));
      setForm(data);
      if (data.questions.length > 0 && !activeQuestionId) {
        setActiveQuestionId(data.questions[0].id);
      }
    } catch {
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  }, [params.id, activeQuestionId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!form || !over || active.id === over.id) return;

    const oldIndex = form.questions.findIndex(q => q.id === active.id);
    const newIndex = form.questions.findIndex(q => q.id === over.id);
    const newQuestions = arrayMove(form.questions, oldIndex, newIndex);

    setForm({ ...form, questions: newQuestions });
    try {
      await reorderQuestions(form.id, newQuestions.map(q => q.id));
    } catch {
      toast.error('Failed to reorder');
      fetchForm();
    }
  };

  const handleTitleChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (!form || form.title === e.target.value) return;
    try {
      const updated = await updateForm(form.id, { title: e.target.value });
      setForm({ ...form, title: updated.title });
      toast.success('Title saved');
    } catch {
      toast.error('Failed to save title');
    }
  };

  const handleAddQuestion = async (type: QuestionType) => {
    if (!form) return;
    setShowTypeSelector(false);
    try {
      const q = await createQuestion(form.id, {
        type,
        title: '',
        required: false,
        order_index: form.questions.length,
        options: (type === 'multiple_choice' || type === 'dropdown') ? ['Option 1', 'Option 2'] : undefined,
        settings: type === 'rating' ? { max: 5 } : undefined,
      });
      setForm({ ...form, questions: [...form.questions, q] });
      setActiveQuestionId(q.id);
      toast.success('Question added');
    } catch {
      toast.error('Failed to add question');
    }
  };

  const handleQuestionUpdate = (updated: Question) => {
    if (!form) return;
    setForm({
      ...form,
      questions: form.questions.map(q => q.id === updated.id ? updated : q),
    });
  };

  const handleQuestionDelete = () => {
    if (!form || !activeQuestionId) return;
    const newQuestions = form.questions.filter(q => q.id !== activeQuestionId);
    setForm({ ...form, questions: newQuestions });
    setActiveQuestionId(newQuestions.length > 0 ? newQuestions[0].id : null);
  };

  const handlePublishToggle = async () => {
    if (!form) return;
    setIsPublishing(true);
    try {
      if (form.status === 'published') {
        const updated = await unpublishForm(form.id);
        setForm({ ...form, status: updated.status });
        toast.success('Form unpublished');
      } else {
        if (form.questions.length === 0) {
          toast.error('Add at least one question before publishing');
          setIsPublishing(false);
          return;
        }
        const updated = await publishForm(form.id);
        setForm({ ...form, status: updated.status });
        toast.success('Form published!');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShareLink = () => {
    if (!form) return;
    const url = `${window.location.origin}/respond/${form.public_id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Share link copied to clipboard!');
    });
  };

  if (loading) return <LoadingSpinner />;
  if (!form) {
    return (
      <div className="h-screen flex items-center justify-center text-lg text-gray-500">
        Form not found
      </div>
    );
  }

  const activeQuestion = form.questions.find(q => q.id === activeQuestionId);
  const activeIndex = form.questions.findIndex(q => q.id === activeQuestionId);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-[#E5E5E5] flex items-center justify-between px-4 md:px-6 bg-white shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-md shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            defaultValue={form.title}
            key={form.id}
            onBlur={handleTitleChange}
            className="text-lg font-bold border-none outline-none focus:ring-0 bg-transparent min-w-0 max-w-xs text-[#191919]"
            placeholder="Form title..."
          />
          <span className={`px-2.5 py-0.5 text-xs rounded-full uppercase tracking-wider font-bold shrink-0 ${
            form.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {form.status}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/forms/${form.id}/results`)}>
            <BarChart2 className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Results</span>
            {form.response_count > 0 && (
              <span className="ml-1.5 bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">{form.response_count}</span>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPreviewPane(!showPreviewPane)}
            className="hidden lg:inline-flex"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            {showPreviewPane ? 'Hide Preview' : 'Show Preview'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(`/respond/${form.public_id}`, '_blank')}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Full Preview</span>
          </Button>

          {form.status === 'published' && (
            <Button variant="secondary" size="sm" onClick={handleShareLink}>
              <Share2 className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Copy Link</span>
            </Button>
          )}

          <Button
            variant={form.status === 'published' ? 'secondary' : 'primary'}
            size="sm"
            onClick={handlePublishToggle}
            isLoading={isPublishing}
          >
            {form.status === 'published' ? (
              <><EyeOff className="w-4 h-4 mr-1.5" /> Unpublish</>
            ) : (
              <><Globe className="w-4 h-4 mr-1.5" /> Publish</>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Question List */}
        <div className="w-72 border-r border-[#E5E5E5] flex flex-col bg-[#FAFAFA] shrink-0">
          <div className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-500 border-b border-[#E5E5E5] flex items-center justify-between">
            <span>Questions ({form.questions.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {form.questions.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No questions yet.<br />Click below to add one.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={form.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  {form.questions.map((q, idx) => (
                    <SortableQuestion
                      key={q.id}
                      question={q}
                      index={idx}
                      isActive={activeQuestionId === q.id}
                      onClick={() => setActiveQuestionId(q.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
          <div className="p-3 border-t border-[#E5E5E5] bg-white">
            <Button variant="primary" className="w-full" onClick={() => setShowTypeSelector(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Question
            </Button>
          </div>
        </div>

        {/* Center Panel - Question Editor */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white border-r border-[#E5E5E5]">
          {activeQuestion ? (
            <div className="max-w-xl mx-auto">
              <QuestionEditor
                key={activeQuestion.id}
                question={activeQuestion}
                formId={form.id}
                onUpdate={handleQuestionUpdate}
                onDelete={handleQuestionDelete}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium mb-1">No question selected</p>
              <p className="text-sm">Select a question from the sidebar or click Add Question</p>
            </div>
          )}
        </div>

        {/* Right Panel - Live Preview */}
        {showPreviewPane && (
          <div className="hidden lg:flex w-96 xl:w-[480px] bg-[#F9FAFB] p-6 flex-col justify-center shrink-0">
            {activeQuestion ? (
              <LiveQuestionPreview question={activeQuestion} index={activeIndex >= 0 ? activeIndex : 0} />
            ) : (
              <div className="text-center text-gray-400 text-sm">Preview will appear here when a question is selected</div>
            )}
          </div>
        )}
      </div>

      {/* Question Type Selector Modal */}
      {showTypeSelector && (
        <Modal title="Choose Question Type" onClose={() => setShowTypeSelector(false)}>
          <div className="grid grid-cols-2 gap-3 p-1">
            {QUESTION_TYPES.map(qt => (
              <button
                key={qt.type}
                onClick={() => handleAddQuestion(qt.type)}
                className="p-3.5 rounded-xl border-2 border-gray-200 hover:border-[#4F46E5] hover:bg-indigo-50 transition-all text-left flex items-start gap-3 group bg-white"
              >
                <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-indigo-100 text-gray-600 group-hover:text-[#4F46E5] transition-colors">
                  {qt.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#191919]">{qt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{qt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
