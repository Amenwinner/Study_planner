/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WeeklyDashboard } from './components/WeeklyDashboard';
import { SlideDeckViewer } from './components/SlideDeckViewer';
import { FlashcardViewer } from './components/FlashcardViewer';
import { QuizRunner } from './components/QuizRunner';
import { AIStudyCoach } from './components/AIStudyCoach';
import { SlideUploader } from './components/SlideUploader';
import { DEFAULT_DECKS } from './data/defaultDecks';
import { generateDefaultActivities } from './data/defaultActivities';
import { SlideDeck, Flashcard, QuizAttempt, DailyActivity } from './types';

export default function App() {
  // Persistence with localStorage
  const [decks, setDecks] = useState<SlideDeck[]>(() => {
    try {
      const saved = localStorage.getItem('synapse_decks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DECKS;
  });

  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('synapse_current_week');
      return saved ? Number(saved) : 7;
    } catch {
      return 7;
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('synapse_quiz_attempts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'attempt-demo-1',
        quizTitle: 'Neural Networks & Optimization Check',
        courseTitle: 'CS229',
        weekNumber: 7,
        date: '2026-10-21',
        totalQuestions: 4,
        correctCount: 3,
        scorePercentage: 75,
        timeSpentSeconds: 185,
        answers: [],
        weakConcepts: ['Adam Optimizer Mechanics']
      }
    ];
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('synapse_streak');
      return saved ? Number(saved) : 5;
    } catch {
      return 5;
    }
  });

  // Daily study interaction volume for D3 calendar heatmap
  const [activities, setActivities] = useState<DailyActivity[]>(() => {
    try {
      const saved = localStorage.getItem('synapse_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return generateDefaultActivities();
  });

  // UI Navigation & State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'slides' | 'flashcards' | 'quiz' | 'coach'>('dashboard');
  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || '');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // AI Tutor Modal state
  const [coachModal, setCoachModal] = useState<{
    isOpen: boolean;
    concept: string;
    question: string;
    explanation: string;
    studentAnswer?: string;
    correctAnswer?: string;
  }>({
    isOpen: false,
    concept: '',
    question: '',
    explanation: '',
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('synapse_decks', JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem('synapse_current_week', String(currentWeek));
  }, [currentWeek]);

  useEffect(() => {
    localStorage.setItem('synapse_quiz_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem('synapse_streak', String(streakDays));
  }, [streakDays]);

  useEffect(() => {
    localStorage.setItem('synapse_activities', JSON.stringify(activities));
  }, [activities]);

  // Helper to record activity into the D3 calendar heatmap
  const recordActivity = (deltas: { flashcards?: number; quizQuestions?: number; quizzes?: number; slides?: number; minutes?: number }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDayOfWeek = new Date().getDay();

    setActivities((prev) => {
      let found = false;
      const updated = prev.map((item) => {
        if (item.weekOffset === 0 && (item.date === todayStr || item.dayIndex === todayDayOfWeek)) {
          found = true;
          const fc = item.flashcardsCount + (deltas.flashcards || 0);
          const qq = item.quizQuestionsCount + (deltas.quizQuestions || 0);
          const qz = item.quizzesCount + (deltas.quizzes || 0);
          const sl = item.slidesUploaded + (deltas.slides || 0);
          const mins = item.studyMinutes + (deltas.minutes || 0);
          const total = fc + (qq * 2) + (qz * 5) + (sl * 10);
          return {
            ...item,
            flashcardsCount: fc,
            quizQuestionsCount: qq,
            quizzesCount: qz,
            slidesUploaded: sl,
            totalInteractions: total,
            studyMinutes: mins,
          };
        }
        return item;
      });
      return updated;
    });
  };

  const handleSimulateActivity = () => {
    recordActivity({ flashcards: 15, quizQuestions: 5, quizzes: 1, minutes: 20 });
  };

  // Handle new slide deck creation from upload
  const handleDeckCreated = (newDeck: SlideDeck) => {
    setDecks((prev) => [newDeck, ...prev]);
    setActiveDeckId(newDeck.id);
    setCurrentWeek(newDeck.weekNumber);
    recordActivity({ slides: 1, minutes: 15 });
    // Switch to slides view to inspect newly created deck
    setCurrentTab('slides');
  };

  // Update a flashcard status / mastery
  const handleUpdateFlashcard = (updatedCard: Flashcard) => {
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id !== updatedCard.deckId) return deck;
        return {
          ...deck,
          flashcards: deck.flashcards.map((card) =>
            card.id === updatedCard.id ? updatedCard : card
          ),
        };
      })
    );
    recordActivity({ flashcards: 1, minutes: 1 });
  };

  // Add custom cards or AI generated extra cards to deck
  const handleAddNewCards = (deckId: string, newCards: Flashcard[]) => {
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id !== deckId) return deck;
        return {
          ...deck,
          flashcards: [...deck.flashcards, ...newCards],
        };
      })
    );
    recordActivity({ flashcards: newCards.length, minutes: 5 });
  };

  // Handle quiz finished
  const handleQuizComplete = (attempt: QuizAttempt) => {
    setQuizAttempts((prev) => [attempt, ...prev]);
    setStreakDays((prev) => prev + 1);
    recordActivity({
      quizQuestions: attempt.totalQuestions,
      quizzes: 1,
      minutes: Math.max(2, Math.ceil(attempt.timeSpentSeconds / 60)),
    });
  };

  // Open AI Tutor Modal with context
  const handleAskAI = (
    concept: string,
    questionText: string,
    explanation: string,
    studentAnswer?: string,
    correctAnswer?: string
  ) => {
    setCoachModal({
      isOpen: true,
      concept,
      question: questionText,
      explanation,
      studentAnswer,
      correctAnswer,
    });
  };

  // Calculate overall mastery percentage
  const totalCards = decks.reduce((acc, d) => acc + d.flashcards.length, 0);
  const masteredCards = decks.reduce(
    (acc, d) => acc + d.flashcards.filter((c) => c.masteryStatus === 'mastered').length,
    0
  );
  const overallMasteryPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentWeek={currentWeek}
        setCurrentWeek={setCurrentWeek}
        onOpenUpload={() => setIsUploadOpen(true)}
        streakDays={streakDays}
        masteryPercentage={overallMasteryPct}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <WeeklyDashboard
            currentWeek={currentWeek}
            decks={decks}
            quizAttempts={quizAttempts}
            streakDays={streakDays}
            activities={activities}
            onSimulateActivity={handleSimulateActivity}
            onNavigateToTab={setCurrentTab}
            onSelectDeckForFlashcards={(deckId) => {
              setActiveDeckId(deckId);
              setCurrentTab('flashcards');
            }}
            onSelectDeckForQuiz={(deckId) => {
              setActiveDeckId(deckId);
              setCurrentTab('quiz');
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            onAskAI={handleAskAI}
          />
        )}

        {currentTab === 'slides' && (
          <SlideDeckViewer
            decks={decks}
            onSelectDeckForFlashcards={(deckId) => {
              setActiveDeckId(deckId);
              setCurrentTab('flashcards');
            }}
            onSelectDeckForQuiz={(deckId) => {
              setActiveDeckId(deckId);
              setCurrentTab('quiz');
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            onAskAI={handleAskAI}
          />
        )}

        {currentTab === 'flashcards' && (
          <FlashcardViewer
            decks={decks}
            activeDeckId={activeDeckId}
            onSelectDeck={setActiveDeckId}
            onUpdateFlashcard={handleUpdateFlashcard}
            onAskAI={handleAskAI}
            onAddNewCards={handleAddNewCards}
            onTakeQuizFromDeck={(deckId) => {
              setActiveDeckId(deckId);
              setCurrentTab('quiz');
            }}
          />
        )}

        {currentTab === 'quiz' && (
          <QuizRunner
            decks={decks}
            activeDeckId={activeDeckId}
            onQuizComplete={handleQuizComplete}
            onAskAI={handleAskAI}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {currentTab === 'coach' && (
          <AIStudyCoach
            initialConcept="Backpropagation & Chain Rule"
            initialQuestion="How does reverse-mode autodiff propagate error gradients?"
            initialExplanation="Calculates gradients backward layer by layer using the multivariable chain rule."
          />
        )}
      </main>

      {/* Slide Uploader Modal */}
      <SlideUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDeckCreated={handleDeckCreated}
        currentWeek={currentWeek}
      />

      {/* Contextual AI Tutor Explainer Modal */}
      {coachModal.isOpen && (
        <AIStudyCoach
          isModal
          initialConcept={coachModal.concept}
          initialQuestion={coachModal.question}
          initialExplanation={coachModal.explanation}
          initialStudentAnswer={coachModal.studentAnswer}
          initialCorrectAnswer={coachModal.correctAnswer}
          onClose={() => setCoachModal((prev) => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Synapse • Weekly Lecture Slide & AI Quiz Engine</p>
          <p className="text-slate-600">Active Recall • Spaced Repetition • Adaptive Quizzing</p>
        </div>
      </footer>

    </div>
  );
}
