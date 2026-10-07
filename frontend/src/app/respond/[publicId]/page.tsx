'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicForm, Question, AnswerSubmit, QuestionType } from '@/lib/types';
import { getPublicForm, submitPublicResponse } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChevronUp, ChevronDown, Check, Star, ArrowRight } from 'lucide-react';

// ──────────────────────────────────────────────
// Question Renderers
// ──────────────────────────────────────────────

function ShortTextInput({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <div>
      <input
        type="text"
        autoFocus
        className="w-full text-2xl md:text-3xl border-b-2 border-gray-300 focus:border-[#4F46E5] pb-2 outline-none bg-transparent placeholder-gray-300 transition-colors"
        placeholder="Type your answer here..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
      />
    </div>
  );
}

function LongTextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <textarea
        autoFocus
        rows={4}
        className="w-full text-xl md:text-2xl border-b-2 border-gray-300 focus:border-[#4F46E5] pb-2 outline-none bg-transparent placeholder-gray-300 resize-none transition-colors"
        placeholder="Type your answer here..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <p className="text-sm text-gray-400 mt-2">Shift + Enter for new line</p>
    </div>
  );
}

function EmailInput({ value, onChange, onSubmit, error }: { value: string; onChange: (v: string) => void; onSubmit: () => void; error?: string }) {
  return (
    <div>
      <input
        type="email"
        autoFocus
        className={`w-full text-2xl md:text-3xl border-b-2 ${error ? 'border-red-400' : 'border-gray-300'} focus:border-[#4F46E5] pb-2 outline-none bg-transparent placeholder-gray-300 transition-colors`}
        placeholder="name@example.com"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

function NumberInput({ value, onChange, onSubmit, error }: { value: string; onChange: (v: string) => void; onSubmit: () => void; error?: string }) {
  return (
    <div>
      <input
        type="number"
        autoFocus
        className={`w-full text-2xl md:text-3xl border-b-2 ${error ? 'border-red-400' : 'border-gray-300'} focus:border-[#4F46E5] pb-2 outline-none bg-transparent placeholder-gray-300 transition-colors`}
        placeholder="Type a number..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

function MultipleChoiceInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-3">
      {options.map((option, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isSelected = value === option;
        return (
          <button
            key={idx}
            onClick={() => onChange(option)}
            className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all flex items-center gap-4 group ${
              isSelected
                ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                : 'border-gray-200 hover:border-gray-400 text-gray-700'
            }`}
          >
            <span className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold border-2 transition-colors ${
              isSelected ? 'bg-[#4F46E5] border-[#4F46E5] text-white' : 'border-gray-300 text-gray-500 group-hover:border-gray-400'
            }`}>
              {isSelected ? <Check className="w-4 h-4" /> : letter}
            </span>
            <span className="text-lg md:text-xl">{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function DropdownInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-xl md:text-2xl border-2 border-gray-300 focus:border-[#4F46E5] rounded-lg p-4 outline-none bg-white appearance-none cursor-pointer transition-colors"
      >
        <option value="">Select an option...</option>
        {options.map((option, idx) => (
          <option key={idx} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
    </div>
  );
}

function YesNoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-4">
      {[{ label: 'Yes', key: 'Y', val: 'Yes' }, { label: 'No', key: 'N', val: 'No' }].map(opt => (
        <button
          key={opt.val}
          onClick={() => onChange(opt.val)}
          className={`flex-1 py-6 px-8 rounded-lg border-2 text-xl md:text-2xl font-bold transition-all flex items-center justify-center gap-3 ${
            value === opt.val
              ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
              : 'border-gray-200 hover:border-gray-400 text-gray-700'
          }`}
        >
          <span className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold border-2 ${
            value === opt.val ? 'bg-[#4F46E5] border-[#4F46E5] text-white' : 'border-gray-300 text-gray-500'
          }`}>
            {value === opt.val ? <Check className="w-4 h-4" /> : opt.key}
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RatingInput({ value, onChange, maxRating = 5 }: { value: string; onChange: (v: string) => void; maxRating?: number }) {
  const currentRating = parseInt(value) || 0;
  return (
    <div className="flex gap-2">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map(num => (
        <button
          key={num}
          onClick={() => onChange(String(num))}
          className="group p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`w-10 h-10 md:w-12 md:h-12 transition-colors ${
              num <= currentRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 group-hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Respondent Page
// ──────────────────────────────────────────────

function validateAnswer(question: Question, value: string): string | null {
  if (question.required && (!value || value.trim() === '')) {
    return 'This question is required';
  }
  if (question.type === 'email' && value && value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
  }
  if (question.type === 'number' && value && value.trim()) {
    if (isNaN(Number(value))) return 'Please enter a valid number';
  }
  return null;
}

export default function RespondPage({ params }: { params: { publicId: string } }) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  useEffect(() => {
    getPublicForm(params.publicId)
      .then(data => setForm(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.publicId]);

  // Keyboard navigation for Y/N
  useEffect(() => {
    if (!form || currentStep < 0 || currentStep >= form.questions.length) return;
    const question = form.questions[currentStep];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (question.type === 'yes_no') {
        if (e.key === 'y' || e.key === 'Y') {
          setAnswers(prev => ({ ...prev, [question.id]: 'Yes' }));
        } else if (e.key === 'n' || e.key === 'N') {
          setAnswers(prev => ({ ...prev, [question.id]: 'No' }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, currentStep]);

  const handleNext = useCallback(async () => {
    if (!form) return;
    setError(null);

    if (currentStep >= 0 && currentStep < form.questions.length) {
      const question = form.questions[currentStep];
      const value = answers[question.id] || '';
      const validationError = validateAnswer(question, value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (currentStep < form.questions.length - 1) {
      setDirection(1);
      setCurrentStep(s => s + 1);
    } else {
      // Submit
      setSubmitting(true);
      try {
        const payload: AnswerSubmit[] = form.questions.map(q => ({
          question_id: q.id,
          value: answers[q.id] || null,
        }));
        await submitPublicResponse(params.publicId, payload);
        setSubmitted(true);
      } catch (err) {
        setError('Failed to submit response. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  }, [form, currentStep, answers, params.publicId]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setError(null);
      setDirection(-1);
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  // Global keyboard handler for Enter / Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentStep === -1 && e.key === 'Enter') {
        setCurrentStep(0);
        setDirection(1);
        return;
      }
      if (currentStep < 0 || !form) return;
      const question = form.questions[currentStep];

      if (e.key === 'Enter' && !e.shiftKey) {
        // Don't submit on Enter for long_text (allow Shift+Enter)
        if (question?.type === 'long_text') return;
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, handleNext, handlePrev, form]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-center p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Form not found</h1>
        <p className="text-lg text-gray-500">This form may have been unpublished or doesn&apos;t exist.</p>
      </div>
    );
  }

  // Thank you screen
  if (submitted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#191919] mb-4">Thank you!</h1>
          <p className="text-xl text-gray-500 mb-8">Your response has been submitted successfully.</p>
          <a href="/" className="text-[#4F46E5] hover:underline text-lg">Create your own form →</a>
        </motion.div>
      </div>
    );
  }

  // Welcome screen
  if (currentStep === -1) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#191919] mb-6 leading-tight">{form.title}</h1>
          {form.description && <p className="text-xl md:text-2xl text-gray-500 mb-10">{form.description}</p>}
          <button
            onClick={() => { setDirection(1); setCurrentStep(0); }}
            className="px-10 py-4 bg-[#4F46E5] text-white text-xl font-bold rounded-lg hover:bg-[#4338CA] transition-colors inline-flex items-center gap-3"
          >
            Start <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-400 mt-4">press <strong>Enter ↵</strong></p>
        </motion.div>
      </div>
    );
  }

  const question = form.questions[currentStep];
  const progress = ((currentStep + 1) / form.questions.length) * 100;
  const currentValue = answers[question.id] || '';
  const isLastQuestion = currentStep === form.questions.length - 1;
  const maxRating = question.settings?.max || 5;

  const renderInput = () => {
    switch (question.type) {
      case 'short_text':
        return <ShortTextInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} onSubmit={handleNext} />;
      case 'long_text':
        return <LongTextInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} />;
      case 'email':
        return <EmailInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} onSubmit={handleNext} error={error && error.includes('email') ? error : undefined} />;
      case 'number':
        return <NumberInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} onSubmit={handleNext} error={error && error.includes('number') ? error : undefined} />;
      case 'multiple_choice':
        return <MultipleChoiceInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} options={question.options || []} />;
      case 'dropdown':
        return <DropdownInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} options={question.options || []} />;
      case 'yes_no':
        return <YesNoInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} />;
      case 'rating':
        return <RatingInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} maxRating={maxRating} />;
      default:
        return <ShortTextInput value={currentValue} onChange={v => setAnswers({ ...answers, [question.id]: v })} onSubmit={handleNext} />;
    }
  };

  const variants = {
    enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, y: 0 },
    exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -60 : 60 }),
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden relative">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full z-10">
        <motion.div
          className="h-full bg-[#4F46E5]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="flex-1 flex flex-col justify-center max-w-3xl w-full mx-auto px-6 md:px-8"
        >
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-[#4F46E5] font-bold text-lg mt-1">{currentStep + 1}&nbsp;→</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#191919] leading-tight">
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </h2>
            </div>
            {question.description && (
              <p className="text-lg text-gray-500 ml-10">{question.description}</p>
            )}
          </div>

          <div className="ml-10">
            {renderInput()}

            {error && !error.includes('email') && !error.includes('number') && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleNext}
                disabled={submitting}
                className="px-6 py-3 bg-[#4F46E5] text-white font-bold rounded-lg flex items-center gap-2 hover:bg-[#4338CA] transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : isLastQuestion ? 'Submit' : 'OK'}
              </button>
              <span className="text-sm text-gray-400">
                press <strong>Enter ↵</strong>
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-1 z-10">
        <button
          onClick={handlePrev}
          disabled={currentStep <= 0}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous question"
        >
          <ChevronUp className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleNext}
          disabled={submitting}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-30"
          aria-label="Next question"
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
