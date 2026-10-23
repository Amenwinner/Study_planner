import React from 'react';
import { 
  Calendar, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Layers, 
  HelpCircle, 
  UploadCloud, 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  AlertCircle,
  TrendingUp,
  Brain,
  ListTodo
} from 'lucide-react';
import { SlideDeck, QuizAttempt, DailyStudyPlan, DailyActivity } from '../types';
import { StudyHeatmapD3 } from './StudyHeatmapD3';

interface WeeklyDashboardProps {
  currentWeek: number;
  decks: SlideDeck[];
  quizAttempts: QuizAttempt[];
  streakDays: number;
  activities: DailyActivity[];
  onSimulateActivity?: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'slides' | 'flashcards' | 'quiz' | 'coach') => void;
  onSelectDeckForFlashcards: (deckId: string) => void;
  onSelectDeckForQuiz: (deckId: string) => void;
  onOpenUpload: () => void;
  onAskAI: (concept: string, questionText: string, explanation: string) => void;
}

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
  currentWeek,
  decks,
  quizAttempts,
  streakDays,
  activities,
  onSimulateActivity,
  onNavigateToTab,
  onSelectDeckForFlashcards,
  onSelectDeckForQuiz,
  onOpenUpload,
  onAskAI,
}) => {
  // Aggregate stats
  const totalCards = decks.reduce((acc, d) => acc + d.flashcards.length, 0);
  const masteredCards = decks.reduce(
    (acc, d) => acc + d.flashcards.filter((c) => c.masteryStatus === 'mastered').length,
    0
  );
  const totalQuestions = decks.reduce((acc, d) => acc + d.quizQuestions.length, 0);

  // Overall accuracy from quiz attempts
  const avgAccuracy = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((acc, a) => acc + a.scorePercentage, 0) / quizAttempts.length)
    : 85;

  // Recent weak concepts from past quiz attempts
  const recentWeakConcepts = Array.from(
    new Set(quizAttempts.flatMap((a) => a.weakConcepts))
  ).slice(0, 4);

  // Recommended tasks for current week
  const currentWeekDecks = decks.filter((d) => d.weekNumber === currentWeek);
  const primaryDeck = currentWeekDecks[0] || decks[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Top Banner: Weekly Milestone & Streak */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Week {currentWeek} Study Sprint Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Master Your Lecture Concepts
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Upload course slides each week to generate flashcard decks, personalized active-recall quizzes, and keep your memory sharp.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('flashcards')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Layers className="w-4 h-4" />
              <span>Start Flashcard Sprint</span>
            </button>
            <button
              onClick={() => onNavigateToTab('quiz')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs sm:text-sm transition-all hover:scale-105"
            >
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <span>Take Weekly Quiz</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-dashed border-slate-700 text-indigo-300 font-semibold text-xs sm:text-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>+ Upload Slides</span>
            </button>
          </div>
        </div>

        {/* Weekly Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Daily Streak</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-white">{streakDays} Days</span>
          </div>

          <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cards Mastered</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              {masteredCards} <span className="text-xs text-slate-500 font-normal">/ {totalCards}</span>
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Quiz Accuracy</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-indigo-300">{avgAccuracy}%</span>
          </div>

          <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <span>Question Bank</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-white">{totalQuestions}</span>
          </div>
        </div>
      </div>

      {/* D3 Calendar-Style Contribution Heatmap */}
      <StudyHeatmapD3
        activities={activities}
        currentWeek={currentWeek}
        onSimulateActivity={onSimulateActivity}
      />

      {/* Main Grid: Weekly Schedule + Weak Spot Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 7-Day Study Cadence */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">Week {currentWeek} Study Roadmap</h3>
                <p className="text-xs text-slate-400">Curated daily schedule to lock in slide takeaways</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Deck: {primaryDeck?.title.slice(0, 24)}...
            </span>
          </div>

          {primaryDeck?.studyPlan && primaryDeck.studyPlan.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {primaryDeck.studyPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-4 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {step.day}: {step.focus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.action}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.estimatedMinutes}m
                    </span>
                    <button
                      onClick={() => onNavigateToTab('flashcards')}
                      className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                    >
                      Study
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              Upload your lecture slides to generate a customized 7-day study schedule.
            </div>
          )}
        </div>

        {/* Right 1 Col: Weak Spot AI Booster & Quick Decks */}
        <div className="space-y-6">
          
          {/* Weak Spot Booster */}
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Brain className="w-4 h-4 text-amber-400" />
              <span>Target Weak Spots</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Concepts you recently hesitated on or missed in quizzes:
            </p>

            {recentWeakConcepts.length > 0 ? (
              <div className="space-y-2">
                {recentWeakConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950/70 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-200 font-medium line-clamp-1">{concept}</span>
                    <button
                      onClick={() => onAskAI(concept, `Explain why students struggle with: ${concept}`, 'Key pitfalls')}
                      className="text-amber-400 hover:text-amber-300 font-semibold shrink-0"
                    >
                      AI Advice
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                ✨ No weak concepts flagged yet! Take a practice quiz to identify areas for improvement.
              </div>
            )}
          </div>

          {/* Quick Deck Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Your Course Decks</span>
              <button
                onClick={() => onNavigateToTab('slides')}
                className="text-xs text-indigo-400 hover:underline"
              >
                View all
              </button>
            </h4>

            <div className="space-y-2">
              {decks.slice(0, 3).map((deck) => (
                <div
                  key={deck.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white line-clamp-1">{deck.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">Wk {deck.weekNumber}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>{deck.flashcards.length} cards • {deck.quizQuestions.length} Qs</span>
                    <button
                      onClick={() => onSelectDeckForQuiz(deck.id)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                    >
                      <span>Quiz</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Past Quiz Attempts History Table */}
      {quizAttempts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Recent Quiz Attempts & Performance</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Quiz / Topic</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Time Spent</th>
                  <th className="pb-3">Identified Weak Areas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {quizAttempts.slice(-5).reverse().map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-white">{attempt.quizTitle}</td>
                    <td className="py-3 text-slate-400">{attempt.date}</td>
                    <td className="py-3">
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        attempt.scorePercentage >= 70
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {attempt.scorePercentage}% ({attempt.correctCount}/{attempt.totalQuestions})
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono">
                      {Math.floor(attempt.timeSpentSeconds / 60)}m {attempt.timeSpentSeconds % 60}s
                    </td>
                    <td className="py-3 text-slate-400">
                      {attempt.weakConcepts.length > 0 ? (
                        <span className="text-rose-300">{attempt.weakConcepts.join(', ')}</span>
                      ) : (
                        <span className="text-emerald-400">All Mastered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
