import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Calendar, 
  Sparkles, 
  Clock, 
  FileText, 
  ChevronRight, 
  UploadCloud,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  Brain
} from 'lucide-react';
import { SlideDeck } from '../types';

interface SlideDeckViewerProps {
  decks: SlideDeck[];
  onSelectDeckForFlashcards: (deckId: string) => void;
  onSelectDeckForQuiz: (deckId: string) => void;
  onOpenUpload: () => void;
  onAskAI: (concept: string, questionText: string, explanation: string) => void;
}

export const SlideDeckViewer: React.FC<SlideDeckViewerProps> = ({
  decks,
  onSelectDeckForFlashcards,
  onSelectDeckForQuiz,
  onOpenUpload,
  onAskAI,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');

  const activeDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Lecture Slides & Study Packs</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse AI-synthesized concepts, active-recall decks, and study roadmaps from your course slides.
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Slides</span>
        </button>
      </div>

      {/* Grid of Slide Deck Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {decks.map((deck) => {
          const isSelected = deck.id === activeDeck?.id;
          return (
            <div
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Week {deck.weekNumber}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {deck.fileType.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5">{deck.title}</h3>
                <p className="text-xs font-medium text-slate-400 mb-2">{deck.course}</p>
                <p className="text-xs text-slate-400/90 line-clamp-2 leading-relaxed">
                  {deck.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  {deck.flashcards.length} cards
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                  {deck.quizQuestions.length} questions
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Deck Detailed View */}
      {activeDeck && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
          
          {/* Deck Details Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Week {activeDeck.weekNumber} Module
                </span>
                <span className="text-xs text-slate-400 font-semibold">{activeDeck.course}</span>
                <span className="text-xs text-slate-500">• {activeDeck.filename}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{activeDeck.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{activeDeck.summary}</p>
            </div>

            {/* Launch Action Buttons */}
            <div className="flex sm:flex-col gap-2.5 shrink-0">
              <button
                onClick={() => onSelectDeckForFlashcards(activeDeck.id)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all hover:scale-105"
              >
                <Layers className="w-4 h-4" />
                <span>Study {activeDeck.flashcards.length} Flashcards</span>
              </button>
              <button
                onClick={() => onSelectDeckForQuiz(activeDeck.id)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all hover:scale-105"
              >
                <HelpCircle className="w-4 h-4 text-violet-400" />
                <span>Take {activeDeck.quizQuestions.length}Q Quiz</span>
              </button>
            </div>
          </div>

          {/* Core Takeaways */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Core Lecture Takeaways</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeDeck.keyTakeaways.map((takeaway, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs sm:text-sm text-slate-200 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{takeaway}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Concepts Breakdown */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Key Concepts & Memory Anchors</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeDeck.keyConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{concept.term}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        concept.importance === 'high'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {concept.importance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{concept.definition}</p>
                  </div>

                  {concept.memoryTip && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-200/90">
                      💡 {concept.memoryTip}
                    </div>
                  )}

                  <button
                    onClick={() => onAskAI(concept.term, `Explain the concept: ${concept.term}`, concept.definition)}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold self-start pt-1"
                  >
                    <Brain className="w-3 h-3" />
                    <span>Explain deeper with AI</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Weekly Study Plan */}
          {activeDeck.studyPlan && activeDeck.studyPlan.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Recommended 7-Day Study Cadence</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDeck.studyPlan.map((plan, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-indigo-400 font-bold">
                      <span>{plan.day}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                        <Clock className="w-3 h-3" />
                        {plan.estimatedMinutes} mins
                      </span>
                    </div>
                    <p className="font-semibold text-slate-200">{plan.focus}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{plan.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
