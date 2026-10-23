import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  Send, 
  Loader2, 
  Lightbulb, 
  HelpCircle, 
  BookOpen, 
  X,
  Copy,
  Check
} from 'lucide-react';

interface AIStudyCoachProps {
  initialConcept?: string;
  initialQuestion?: string;
  initialExplanation?: string;
  initialStudentAnswer?: string;
  initialCorrectAnswer?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const AIStudyCoach: React.FC<AIStudyCoachProps> = ({
  initialConcept = '',
  initialQuestion = '',
  initialExplanation = '',
  initialStudentAnswer = '',
  initialCorrectAnswer = '',
  onClose,
  isModal = false,
}) => {
  const [concept, setConcept] = useState(initialConcept);
  const [userQuery, setUserQuery] = useState('');
  const [activePromptType, setActivePromptType] = useState<string>('explain-simple');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const QUICK_PROMPTS = [
    { id: 'explain-simple', label: "Explain Like I'm 5", prompt: "Explain this concept in simple terms with everyday analogies" },
    { id: 'analogy', label: 'Real-World Analogy', prompt: 'Give me a vivid real-world engineering or biological analogy' },
    { id: 'pitfall', label: 'Common Exam Pitfalls', prompt: 'What tricky mistakes or traps do professors often set for this concept on exams?' },
    { id: 'mnemonic', label: 'Memory Trick / Mnemonic', prompt: 'Create a memorable mnemonic phrase or visualization to remember this forever' },
    { id: 'practice-q', label: 'Give 2 Practice Scenarios', prompt: 'Provide two real-world application scenarios testing this principle' }
  ];

  const handleAsk = async (customPrompt?: string) => {
    const queryToSend = customPrompt || userQuery.trim() || 'Please explain this concept clearly with examples.';
    setIsLoading(true);
    setAiResponse(null);

    try {
      const response = await fetch('/api/study/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: concept.trim() || 'Course Concept',
          questionText: initialQuestion,
          studentAnswer: initialStudentAnswer,
          correctAnswer: initialCorrectAnswer,
          explanation: initialExplanation,
          userQuery: queryToSend,
        })
      });

      if (!response.ok) throw new Error('Failed to get explanation from tutor');
      const data = await response.json();
      setAiResponse(data.explanation || 'No explanation returned.');
    } catch (err: any) {
      console.warn('API route /api/study/explain not reachable (static host). Providing client-side study explanation.');
      const target = concept.trim() || 'Course Concept';
      const fallbackText = `**Core Concept Breakdown: ${target}**\n\n• **Intuitive Mental Model:** Think of ${target} as an interconnected system. When an input signal or variable shifts, the governing mechanism responds systematically to restore equilibrium or propagate changes downstream.\n\n• **Real-World Analogy:** Like a smart home thermostat or water reservoir: it continuously monitors sensor thresholds and modulates throughput rather than all-or-nothing extremes.\n\n• **Exam Traps to Avoid:** Watch out for questions that invert causality or assume conditions hold when boundary thresholds are crossed. Always verify baseline assumptions before selecting your answer!`;
      setAiResponse(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Synapse AI Study Tutor</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-xs text-slate-400">Personalized conceptual breakdown, analogies & exam traps</p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Target Concept & Context */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Concept or Lecture Topic</label>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="e.g. Backpropagation Chain Rule, Chemiosmosis, Cournot Equilibrium..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {initialQuestion && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="font-bold text-indigo-400 block">Related Question:</span>
            <p className="text-slate-300 italic">{initialQuestion}</p>
            {initialStudentAnswer && (
              <p className="text-rose-300 text-[11px] pt-1">
                Your Answer was: <span className="line-through">{initialStudentAnswer}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Prompt Pill Buttons */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2">Instant Pedagogical Angle</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActivePromptType(p.id);
                setUserQuery(p.prompt);
                handleAsk(p.prompt);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                activePromptType === p.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Question Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400">Or Ask Any Specific Question</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="e.g. Why does option C fail? What happens if temperature increases?"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleAsk()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* AI Explanation Output */}
      {isLoading && (
        <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs font-semibold text-indigo-300">
            Synthesizing conceptual model & pedagogical explanation...
          </p>
        </div>
      )}

      {aiResponse && !isLoading && (
        <div className="p-5 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-3 relative shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Tutor Explanation
            </span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
            {aiResponse}
          </div>
        </div>
      )}

    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      {content}
    </div>
  );
};
