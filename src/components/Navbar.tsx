import React from 'react';
import { 
  Sparkles, 
  Layers, 
  HelpCircle, 
  UploadCloud, 
  Calendar, 
  Flame, 
  BookOpen, 
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'slides' | 'flashcards' | 'quiz' | 'coach';
  setCurrentTab: (tab: 'dashboard' | 'slides' | 'flashcards' | 'quiz' | 'coach') => void;
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onOpenUpload: () => void;
  streakDays: number;
  masteryPercentage: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentWeek,
  setCurrentWeek,
  onOpenUpload,
  streakDays,
  masteryPercentage,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-white tracking-tight">Synapse</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI Study</span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Weekly Lecture Slide & Quiz Engine</p>
              </div>
            </button>
          </div>

          {/* Center Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Weekly Plan
            </button>
            <button
              onClick={() => setCurrentTab('slides')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'slides'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Lecture Slides
            </button>
            <button
              onClick={() => setCurrentTab('flashcards')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'flashcards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Flashcards
            </button>
            <button
              onClick={() => setCurrentTab('quiz')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              AI Quizzes
            </button>
            <button
              onClick={() => setCurrentTab('coach')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'coach'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              AI Tutor
            </button>
          </nav>

          {/* Right Action & Stats */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Week Selector Dropdown */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 mr-1.5 hidden sm:inline">Current:</span>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="bg-transparent text-indigo-400 font-semibold focus:outline-none cursor-pointer"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-slate-900 text-white">
                    Week {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Streak & Mastery Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-semibold text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{streakDays} Day Streak</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{masteryPercentage}% Mastery</span>
            </div>

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Slides</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Plan</span>
          </button>
          <button
            onClick={() => setCurrentTab('slides')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'slides' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Slides</span>
          </button>
          <button
            onClick={() => setCurrentTab('flashcards')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'flashcards' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setCurrentTab('quiz')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'quiz' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz</span>
          </button>
          <button
            onClick={() => setCurrentTab('coach')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'coach' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Tutor</span>
          </button>
        </div>

      </div>
    </header>
  );
};
