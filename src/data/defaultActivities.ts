import { DailyActivity } from '../types';

// Helper to format date YYYY-MM-DD
const formatDate = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

export const generateDefaultActivities = (): DailyActivity[] => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0-6
  const list: DailyActivity[] = [];

  // Generate for 8 weeks (weeks -7 to 0)
  for (let weekOffset = -7; weekOffset <= 0; weekOffset++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // Calculate date
      const targetDate = new Date(today);
      const dayDiff = (weekOffset * 7) + (dayIndex - currentDayIndex);
      targetDate.setDate(today.getDate() + dayDiff);

      const dayName = daysOfWeek[dayIndex];
      const isPastOrToday = dayDiff <= 0;

      // Realistic volumes based on student rhythms:
      // Mid-week (Tue, Wed, Thu) usually higher due to quiz preparation
      let flashcards = 0;
      let quizQuestions = 0;
      let quizzes = 0;
      let slides = 0;
      let minutes = 0;

      if (isPastOrToday) {
        if (weekOffset === 0) {
          // Current week specifics
          if (dayIndex === 1) { // Mon
            flashcards = 28;
            quizQuestions = 8;
            quizzes = 1;
            slides = 1;
            minutes = 45;
          } else if (dayIndex === 2) { // Tue
            flashcards = 35;
            quizQuestions = 12;
            quizzes = 1;
            minutes = 50;
          } else if (dayIndex === 3) { // Wed (Peak Day)
            flashcards = 48;
            quizQuestions = 16;
            quizzes = 2;
            slides = 1;
            minutes = 75;
          } else if (dayIndex === 4) { // Thu
            flashcards = 22;
            quizQuestions = 6;
            quizzes = 1;
            minutes = 35;
          } else if (dayIndex === 5) { // Fri
            flashcards = 40;
            quizQuestions = 10;
            quizzes = 1;
            minutes = 60;
          } else if (dayIndex === 6) { // Sat
            flashcards = 15;
            quizQuestions = 0;
            minutes = 20;
          } else { // Sun
            flashcards = 18;
            quizQuestions = 8;
            quizzes = 1;
            minutes = 30;
          }
        } else {
          // Past weeks random realistic patterns
          const base = (Math.sin(weekOffset * 2 + dayIndex) + 1) * 15;
          flashcards = Math.floor(base + (dayIndex % 2 === 0 ? 12 : 5));
          quizQuestions = Math.floor(flashcards / 3);
          quizzes = quizQuestions > 0 ? 1 : 0;
          slides = dayIndex === 1 ? 1 : 0;
          minutes = Math.floor(flashcards * 1.5 + quizQuestions * 2);
        }
      }

      const totalInteractions = flashcards + quizQuestions * 2 + (slides * 10);

      list.push({
        date: formatDate(targetDate),
        dayOfWeek: dayName,
        dayIndex,
        weekOffset,
        flashcardsCount: flashcards,
        quizQuestionsCount: quizQuestions,
        quizzesCount: quizzes,
        slidesUploaded: slides,
        totalInteractions,
        studyMinutes: minutes,
      });
    }
  }

  return list;
};
