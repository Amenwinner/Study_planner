import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle, 
  Sparkles, 
  Trophy, 
  Clock, 
  RotateCcw, 
  Brain, 
  ChevronRight, 
  ChevronLeft,
  Sliders,
  Flame,
  ArrowRight,
  BookOpen,
  Filter,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, SlideDeck, QuizAttempt } from '../types';

interface QuizRunnerProps {
  decks: SlideDeck[];
  activeDeckId?: string;
  onQuizComplete: (attempt: QuizAttempt) => void;
  onAskAI: (concept: string, questionText: string, explanation: string, studentAnswer?: string, correctAnswer?: string) => void;
  onOpenUpload: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  decks,
  activeDeckId,
  onQuizComplete,
  onAskAI,
  onOpenUpload,
}) => {
  // Setup state
  const [selectedDeckId, setSelectedDeckId] = useState<string>(activeDeckId || decks[0]?.id || 'all');
  const [quizMode, setQuizMode] = useState<'practice' | 'exam'>('practice');
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [targetFocus, setTargetFocus] = useState<string>('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);

  // Active Quiz State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, 'sure' | 'unsure'>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 mins
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  
  // Quiz Finish / Review State
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);

  // Sync selected deck with activeDeckId if provided
  useEffect(() => {
    if (activeDeckId) {
      setSelectedDeckId(activeDeckId);
    }
  }, [activeDeckId]);

  // Exam timer
  useEffect(() => {
    if (!activeQuizQuestions || quizFinished || quizMode !== 'exam') return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuizQuestions, quizFinished, quizMode]);

  const startQuizWithQuestions = (questions: QuizQuestion[], title: string, course: string, week: number) => {
    setActiveQuizQuestions(questions);
    setCurrentQIndex(0);
    setUserAnswers({});
    setConfidenceRatings({});
    setShowExplanation(false);
    setQuizFinished(false);
    setCompletedAttempt(null);
    setQuizStartTime(Date.now());
    setTimeRemaining(questions.length * 90); // 1.5 min per question
  };

  const handleStartDeckQuiz = () => {
    let pool: QuizQuestion[] = [];
    let title = 'Comprehensive Study Quiz';
    let course = 'Multi-Course';
    let week = 1;

    if (selectedDeckId === 'all') {
      decks.forEach((d) => pool.push(...d.quizQuestions));
      title = 'All Topics Weekly Quiz';
    } else {
      const deck = decks.find((d) => d.id === selectedDeckId);
      if (deck) {
        pool = [...deck.quizQuestions];
        title = `${deck.title} Quiz`;
        course = deck.course;
        week = deck.weekNumber;
      }
    }

    if (pool.length === 0) {
      alert('No questions available in this deck yet. You can generate a custom AI quiz below!');
      return;
    }

    // Shuffle and pick requested count
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, questionCount);
    startQuizWithQuestions(shuffled, title, course, week);
  };

  // Generate Personalized Quiz via Gemini AI
  const handleGenerateCustomAIQuiz = async () => {
    setIsGeneratingCustom(true);
    try {
      const selectedDeck = decks.find((d) => d.id === selectedDeckId);
      const topicName = targetFocus.trim() || selectedDeck?.title || 'Weekly Lecture Review';
      const contextNotes = selectedDeck ? `${selectedDeck.summary}\nTakeaways: ${selectedDeck.keyTakeaways.join('; ')}` : undefined;

      const response = await fetch('/api/quiz/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicName,
          contextNotes,
          questionCount,
          difficulty: 'adaptive',
        })
      });

      if (!response.ok) throw new Error('Failed to generate custom quiz');
      const data = await response.json();

      if (data.success && data.data && data.data.questions) {
        const questions: QuizQuestion[] = data.data.questions.map((q: any, idx: number) => ({
          ...q,
          id: `q-gen-${Date.now()}-${idx}`,
          deckId: selectedDeckId !== 'all' ? selectedDeckId : undefined
        }));
        startQuizWithQuestions(
          questions,
          data.data.quizTitle || topicName,
          selectedDeck?.course || 'AI Personalized',
          selectedDeck?.weekNumber || 1
        );
      }
    } catch (err: any) {
      console.warn('API route /api/quiz/generate-custom not reachable (static host). Using existing question bank pool.');
      const selectedDeck = decks.find((d) => d.id === selectedDeckId);
      const pool = selectedDeck ? selectedDeck.quizQuestions : decks.flatMap((d) => d.quizQuestions);
      const fallbackQuestions = pool.length > 0 ? [...pool].sort(() => 0.5 - Math.random()).slice(0, questionCount) : [];
      if (fallbackQuestions.length > 0) {
        startQuizWithQuestions(
          fallbackQuestions,
          targetFocus.trim() || selectedDeck?.title || 'Weekly Diagnostic Quiz',
          selectedDeck?.course || 'Active Study',
          selectedDeck?.weekNumber || 1
        );
      } else {
        alert('No questions available in selected pool. Try selecting "All Available Decks".');
      }
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleSelectOption = (option: string) => {
    if (!activeQuizQuestions) return;
    const currentQ = activeQuizQuestions[currentQIndex];
    if (quizMode === 'practice' && userAnswers[currentQ.id]) {
      // Don't change in practice once answered
      return;
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option
    }));

    if (quizMode === 'practice') {
      setShowExplanation(true);
    }
  };

  const handleSetConfidence = (rating: 'sure' | 'unsure') => {
    if (!activeQuizQuestions) return;
    const currentQ = activeQuizQuestions[currentQIndex];
    setConfidenceRatings((prev) => ({
      ...prev,
      [currentQ.id]: rating
    }));
  };

  const handleNextQuestion = () => {
    if (!activeQuizQuestions) return;
    setShowExplanation(false);
    if (currentQIndex < activeQuizQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrevQuestion = () => {
    setShowExplanation(false);
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
    }
  };

  const finishQuiz = () => {
    if (!activeQuizQuestions) return;

    let correctCount = 0;
    const weakConceptsList: string[] = [];

    const answersReport = activeQuizQuestions.map((q) => {
      const userAns = userAnswers[q.id] || 'No Answer';
      const isCorrect = userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      } else {
        if (!weakConceptsList.includes(q.conceptTested)) {
          weakConceptsList.push(q.conceptTested);
        }
      }
      return {
        questionId: q.id,
        question: q.question,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        conceptTested: q.conceptTested,
        confidence: confidenceRatings[q.id]
      };
    });

    const scorePct = Math.round((correctCount / activeQuizQuestions.length) * 100);
    const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizTitle: 'Weekly Quiz',
      courseTitle: 'Study Session',
      weekNumber: 1,
      date: new Date().toISOString().split('T')[0],
      totalQuestions: activeQuizQuestions.length,
      correctCount,
      scorePercentage: scorePct,
      timeSpentSeconds: timeSpent,
      answers: answersReport,
      weakConcepts: weakConceptsList
    };

    setCompletedAttempt(attempt);
    setQuizFinished(true);
    onQuizComplete(attempt);

    // Trigger celebratory confetti if score is high!
    if (scorePct >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // confetti fallback
      }
    }
  };

  const retakeMissedQuestions = () => {
    if (!completedAttempt) return;
    const missedIds = completedAttempt.answers.filter((a) => !a.isCorrect).map((a) => a.questionId);
    if (!activeQuizQuestions) return;
    const missedQuestions = activeQuizQuestions.filter((q) => missedIds.includes(q.id));
    if (missedQuestions.length > 0) {
      startQuizWithQuestions(missedQuestions, 'Reinforcement: Missed Questions', 'Review Session', 1);
    }
  };

  // If Quiz is Finished: Show Results Report
  if (quizFinished && completedAttempt) {
    const isPassing = completedAttempt.scorePercentage >= 70;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Score Card Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            {isPassing ? (
              <Trophy className="w-8 h-8 text-amber-400" />
            ) : (
              <RotateCcw className="w-8 h-8 text-indigo-400" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            {isPassing ? 'Outstanding Performance!' : 'Good Effort — Knowledge Gap Review'}
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            {isPassing
              ? `You mastered ${completedAttempt.correctCount} out of ${completedAttempt.totalQuestions} questions with ${completedAttempt.scorePercentage}% accuracy.`
              : `You scored ${completedAttempt.scorePercentage}%. Review the AI explanations below to lock in the concepts.`}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block">Score</span>
              <span className={`text-xl font-extrabold ${isPassing ? 'text-emerald-400' : 'text-amber-400'}`}>
                {completedAttempt.scorePercentage}%
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block">Correct</span>
              <span className="text-xl font-extrabold text-white">
                {completedAttempt.correctCount} / {completedAttempt.totalQuestions}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 block">Time</span>
              <span className="text-xl font-extrabold text-indigo-300">
                {Math.floor(completedAttempt.timeSpentSeconds / 60)}m {completedAttempt.timeSpentSeconds % 60}s
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {completedAttempt.correctCount < completedAttempt.totalQuestions && (
              <button
                onClick={retakeMissedQuestions}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Drill Missed Questions ({completedAttempt.totalQuestions - completedAttempt.correctCount})</span>
              </button>
            )}
            <button
              onClick={() => {
                setActiveQuizQuestions(null);
                setQuizFinished(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Take Another Quiz
            </button>
          </div>
        </div>

        {/* Weak Concepts Breakdown */}
        {completedAttempt.weakConcepts.length > 0 && (
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Recommended Focus Areas for this Week:</span>
            </div>
            <p className="text-xs text-slate-300">
              Based on your quiz answers, review these topics in your lecture slides and flashcards:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {completedAttempt.weakConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-amber-500/20 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-medium"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Detailed Question Review</span>
            <span className="text-xs text-slate-400 font-normal">({completedAttempt.answers.length} items)</span>
          </h3>

          {completedAttempt.answers.map((ans, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${
                ans.isCorrect
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : 'bg-slate-900/60 border-rose-500/30'
              } space-y-3 shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 mt-0.5">
                    #{idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-white leading-relaxed">{ans.question}</p>
                </div>
                <div className="shrink-0">
                  {ans.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      Missed
                    </span>
                  )}
                </div>
              </div>

              {/* Answers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className={`p-2.5 rounded-lg border ${
                  ans.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                }`}>
                  <span className="font-semibold block mb-0.5 text-slate-400">Your Answer:</span>
                  <span>{ans.userAnswer}</span>
                </div>
                {!ans.isCorrect && (
                  <div className="p-2.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-200">
                    <span className="font-semibold block mb-0.5 text-slate-400">Correct Answer:</span>
                    <span>{ans.correctAnswer}</span>
                  </div>
                )}
              </div>

              {/* In-depth Explanation */}
              <div className="p-3 bg-slate-950/80 rounded-xl text-xs text-slate-300 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Concept Tested: {ans.conceptTested}</span>
                  <button
                    onClick={() => onAskAI(ans.conceptTested, ans.question, ans.explanation, ans.userAnswer, ans.correctAnswer)}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Ask AI Tutor to Explain</span>
                  </button>
                </div>
                <p className="leading-relaxed">{ans.explanation}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    );
  }

  // Active Quiz View
  if (activeQuizQuestions && activeQuizQuestions.length > 0) {
    const currentQ = activeQuizQuestions[currentQIndex];
    const userSelected = userAnswers[currentQ.id];
    const isAnswered = Boolean(userSelected);
    const isCorrect = isAnswered && userSelected.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Active Quiz Header */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-600 text-white">
              Q {currentQIndex + 1} / {activeQuizQuestions.length}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Mode: <strong className="text-slate-200 capitalize">{quizMode}</strong>
            </span>
          </div>

          {quizMode === 'exam' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-mono font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              if (confirm('Are you sure you want to exit this quiz session?')) {
                setActiveQuizQuestions(null);
              }
            }}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
          >
            Exit Quiz
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${((currentQIndex + 1) / activeQuizQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
              {currentQ.conceptTested}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {currentQ.type}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.question}
          </h3>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = userSelected === option;
              let optionStyle = 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900';
              
              if (quizMode === 'practice' && isAnswered) {
                if (option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()) {
                  optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
                } else if (isSelected) {
                  optionStyle = 'bg-rose-500/15 border-rose-500 text-rose-200';
                } else {
                  optionStyle = 'bg-slate-950/40 border-slate-800/60 opacity-60';
                }
              } else if (isSelected) {
                optionStyle = 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 ${optionStyle}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-800/80 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Confidence Indicator */}
          {isAnswered && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">Confidence in answer:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetConfidence('sure')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    confidenceRatings[currentQ.id] === 'sure'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Confident
                </button>
                <button
                  onClick={() => handleSetConfidence('unsure')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    confidenceRatings[currentQ.id] === 'unsure'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Unsure / Guess
                </button>
              </div>
            </div>
          )}

          {/* Practice Mode: Immediate Explanation */}
          {quizMode === 'practice' && showExplanation && isAnswered && (
            <div className={`p-4 rounded-xl border ${
              isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
            } space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {isCorrect ? 'Correct Answer!' : `Incorrect — Correct answer: "${currentQ.correctAnswer}"`}
                </span>
                <button
                  onClick={() => onAskAI(currentQ.conceptTested, currentQ.question, currentQ.explanation, userSelected, currentQ.correctAnswer)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Ask AI Tutor</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQIndex === 0}
            className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={!isAnswered && quizMode === 'practice'}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <span>{currentQIndex === activeQuizQuestions.length - 1 ? 'Finish & See Score' : 'Next Question'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    );
  }

  // Quiz Launch / Setup Screen
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Hero Quiz Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized AI Exam Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Weekly Lecture Quizzes</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              Test your recall, identify weak concepts, and get instant pedagogical AI explanations for every choice.
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            <button
              onClick={handleStartDeckQuiz}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 text-sm"
            >
              <span>Start Quiz Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Configuration Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Quiz Customization</span>
        </h3>

        {/* Choose Source Deck */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Lecture Source Material</label>
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">🌐 All Available Decks & Weeks Combined</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                Week {deck.weekNumber}: {deck.title} ({deck.quizQuestions.length} questions)
              </option>
            ))}
          </select>
        </div>

        {/* Quiz Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setQuizMode('practice')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              quizMode === 'practice'
                ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                : 'bg-slate-950/50 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-white">Practice Mode</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant feedback after each question with step-by-step AI explanations and confidence tracking.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setQuizMode('exam')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              quizMode === 'exam'
                ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                : 'bg-slate-950/50 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-white">Exam Simulation</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Timed
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Countdown timer, no hints until the end, generates full diagnostic grading and review report.
            </p>
          </button>
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Number of Questions</label>
          <div className="flex items-center gap-2">
            {[4, 8, 12, 16].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  questionCount === count
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {count} Questions
              </button>
            ))}
          </div>
        </div>

        {/* Personalized Focus Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Target Specific Weakness or Sub-Topic</span>
            <span className="text-slate-500 font-normal">Optional</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetFocus}
              onChange={(e) => setTargetFocus(e.target.value)}
              placeholder="e.g. Focus on Vanishing Gradients, Cournot reaction functions, or Glycolysis inhibitors..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleGenerateCustomAIQuiz}
              disabled={isGeneratingCustom}
              className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isGeneratingCustom ? 'Generating...' : 'AI Generate'}</span>
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <button
            onClick={handleStartDeckQuiz}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all text-sm"
          >
            Launch Quiz ({questionCount} Questions)
          </button>
        </div>
      </div>

    </div>
  );
};
