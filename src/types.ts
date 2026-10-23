export interface KeyConcept {
  term: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
  memoryTip?: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mnemonicOrTip?: string;
  masteryStatus: 'new' | 'learning' | 'review' | 'mastered';
  repetitions: number;
  lastStudied?: string;
  isBookmarked?: boolean;
}

export interface QuizQuestion {
  id: string;
  deckId?: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptTested: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyStudyPlan {
  day: string;
  focus: string;
  action: string;
  estimatedMinutes: number;
  completed?: boolean;
}

export interface SlideDeck {
  id: string;
  title: string;
  course: string;
  weekNumber: number;
  uploadDate: string;
  filename: string;
  fileType: 'pdf' | 'image' | 'notes';
  summary: string;
  keyTakeaways: string[];
  keyConcepts: KeyConcept[];
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  studyPlan: DailyStudyPlan[];
  isPreloaded?: boolean;
  slideThumbnail?: string;
}

export interface QuizAttempt {
  id: string;
  deckId?: string;
  quizTitle: string;
  courseTitle: string;
  weekNumber: number;
  date: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  answers: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    conceptTested: string;
    confidence?: 'sure' | 'unsure';
  }[];
  weakConcepts: string[];
}

export interface WeeklyStudyGoal {
  weekNumber: number;
  theme: string;
  targetCards: number;
  completedCards: number;
  targetQuizzes: number;
  completedQuizzes: number;
  streakDays: number;
  totalStudyMinutes: number;
}

export interface DailyActivity {
  date: string;
  dayOfWeek: string;
  dayIndex: number; // 0 (Sun) to 6 (Sat)
  weekOffset: number; // 0 = current week, -1 = last week, etc.
  flashcardsCount: number;
  quizQuestionsCount: number;
  quizzesCount: number;
  slidesUploaded: number;
  totalInteractions: number;
  studyMinutes: number;
}

