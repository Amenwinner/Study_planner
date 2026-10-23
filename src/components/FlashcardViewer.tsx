import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Shuffle, 
  Plus, 
  Filter, 
  Brain,
  Lightbulb,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Flashcard, SlideDeck } from '../types';

interface FlashcardViewerProps {
  decks: SlideDeck[];
  activeDeckId?: string;
  onSelectDeck: (deckId: string) => void;
  onUpdateFlashcard: (card: Flashcard) => void;
  onAskAI: (concept: string, questionText: string, explanation: string) => void;
  onAddNewCards: (deckId: string, newCards: Flashcard[]) => void;
  onTakeQuizFromDeck?: (deckId: string) => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  decks,
  activeDeckId,
  onSelectDeck,
  onUpdateFlashcard,
  onAskAI,
  onAddNewCards,
  onTakeQuizFromDeck
}) => {
  // If no specific deck selected, choose the first or match activeDeckId
  const currentDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const [filterStatus, setFilterStatus] = useState<'all' | 'learning' | 'review' | 'mastered' | 'starred'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Custom Card State
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTip, setNewTip] = useState('');

  // Filter cards
  const allCards = currentDeck ? currentDeck.flashcards : [];
  const filteredCards = allCards.filter((card) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'starred') return Boolean(card.isBookmarked);
    return card.masteryStatus === filterStatus;
  });

  const activeCard = filteredCards[currentIndex] || null;

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  }, [filterStatus, currentDeck?.id, filteredCards.length]);

  // Flip action
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  }, [filteredCards.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Spaced repetition rating
  const handleRateCard = (status: 'learning' | 'review' | 'mastered') => {
    if (!activeCard) return;
    const updated: Flashcard = {
      ...activeCard,
      masteryStatus: status,
      repetitions: (activeCard.repetitions || 0) + 1,
      lastStudied: new Date().toISOString()
    };
    onUpdateFlashcard(updated);
    handleNext();
  };

  const toggleBookmark = () => {
    if (!activeCard) return;
    const updated: Flashcard = {
      ...activeCard,
      isBookmarked: !activeCard.isBookmarked
    };
    onUpdateFlashcard(updated);
  };

  // Text-to-speech audio pronunciation
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Generate more flashcards via Gemini
  const handleGenerateMore = async () => {
    if (!currentDeck) return;
    setIsGeneratingMore(true);
    try {
      const response = await fetch('/api/flashcards/generate-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckTitle: currentDeck.title,
          existingCards: currentDeck.flashcards,
          count: 5,
        })
      });

      if (!response.ok) throw new Error('Failed to generate extra cards');
      const data = await response.json();
      if (data.success && data.data) {
        const newFlashcards: Flashcard[] = data.data.map((c: any, idx: number) => ({
          ...c,
          id: `fc-gen-${Date.now()}-${idx}`,
          deckId: currentDeck.id,
          masteryStatus: 'new',
          repetitions: 0
        }));
        onAddNewCards(currentDeck.id, newFlashcards);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || !currentDeck) return;

    const newCard: Flashcard = {
      id: `fc-custom-${Date.now()}`,
      deckId: currentDeck.id,
      front: newFront.trim(),
      back: newBack.trim(),
      category: newCategory.trim() || 'General',
      difficulty: 'medium',
      mnemonicOrTip: newTip.trim() || undefined,
      masteryStatus: 'new',
      repetitions: 0
    };

    onAddNewCards(currentDeck.id, [newCard]);
    setNewFront('');
    setNewBack('');
    setNewCategory('');
    setNewTip('');
    setShowAddModal(false);
  };

  if (!currentDeck) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Flashcard Decks Available</h3>
        <p className="text-slate-400 text-sm mt-1">Upload lecture slides to generate your weekly flashcards.</p>
      </div>
    );
  }

  // Mastery statistics for current deck
  const masteredCount = allCards.filter((c) => c.masteryStatus === 'mastered').length;
  const learningCount = allCards.filter((c) => c.masteryStatus === 'learning').length;
  const reviewCount = allCards.filter((c) => c.masteryStatus === 'review').length;
  const deckMasteryPct = allCards.length ? Math.round((masteredCount / allCards.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Deck Selector & Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Week {currentDeck.weekNumber}
              </span>
              <span className="text-xs text-slate-400 font-medium">{currentDeck.course}</span>
            </div>
            {/* Deck Switcher Dropdown */}
            <select
              value={currentDeck.id}
              onChange={(e) => onSelectDeck(e.target.value)}
              className="bg-transparent text-lg sm:text-xl font-bold text-white focus:outline-none cursor-pointer border-b border-dashed border-slate-700 hover:border-indigo-400 transition-colors pb-0.5"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white text-sm">
                  {d.title} ({d.flashcards.length} cards)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Deck Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateMore}
              disabled={isGeneratingMore}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isGeneratingMore ? 'Generating...' : '+ AI 5 More'}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
            {onTakeQuizFromDeck && (
              <button
                onClick={() => onTakeQuizFromDeck(currentDeck.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all hover:scale-105"
              >
                <span>Quiz Deck</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Deck Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Mastered: {masteredCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Learning: {learningCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Need Review: {reviewCount}
            </span>
          </div>
          <span className="font-semibold text-indigo-400">{deckMasteryPct}% Mastery</span>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {(['all', 'learning', 'review', 'mastered', 'starred'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-full font-medium transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'starred' ? '⭐ Starred' : status}
            </button>
          ))}
        </div>

        <div className="text-slate-500 text-xs font-mono">
          {filteredCards.length > 0 ? `${currentIndex + 1} / ${filteredCards.length}` : '0 cards'}
        </div>
      </div>

      {/* Interactive 3D Flashcard Display */}
      {filteredCards.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-base font-bold text-white">No cards matching "{filterStatus}"</h4>
          <p className="text-xs text-slate-400 mt-1">Try selecting "All" or add new flashcards to this deck.</p>
          <button
            onClick={() => setFilterStatus('all')}
            className="mt-4 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
          >
            Show All Cards
          </button>
        </div>
      ) : activeCard && (
        <div className="space-y-4">
          {/* The Flip Card Container */}
          <div
            onClick={handleFlip}
            className="perspective-1000 w-full min-h-[340px] sm:min-h-[380px] cursor-pointer select-none group"
          >
            <div
              className={`relative w-full h-full min-h-[340px] sm:min-h-[380px] rounded-2xl transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              
              {/* CARD FRONT (Question / Prompt) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-colors">
                {/* Front Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {activeCard.category || 'Concept'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      activeCard.difficulty === 'hard'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : activeCard.difficulty === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {activeCard.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => speakText(activeCard.front)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Read prompt aloud"
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-indigo-400 animate-bounce' : ''}`} />
                    </button>
                    <button
                      onClick={toggleBookmark}
                      className={`p-2 rounded-lg bg-slate-800 transition-colors ${
                        activeCard.isBookmarked
                          ? 'text-amber-400 hover:bg-amber-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      title="Bookmark card"
                    >
                      <Star className={`w-4 h-4 ${activeCard.isBookmarked ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Front Body */}
                <div className="my-auto py-6 text-center">
                  <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold block mb-3">
                    Active Recall Prompt
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-relaxed max-w-2xl mx-auto">
                    {activeCard.front}
                  </h3>
                </div>

                {/* Front Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/80">
                  <span>Card {currentIndex + 1} of {filteredCards.length}</span>
                  <div className="flex items-center gap-1.5 text-indigo-400 group-hover:text-indigo-300 font-medium">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click or press Space to reveal answer</span>
                  </div>
                </div>
              </div>

              {/* CARD BACK (Explanation & Mnemonics) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
                {/* Back Top Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Detailed Answer
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => speakText(activeCard.back)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Read answer aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onAskAI(activeCard.category, activeCard.front, activeCard.back)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold transition-colors"
                      title="Ask AI Tutor for analogy or simpler explanation"
                    >
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ask AI Tutor</span>
                    </button>
                  </div>
                </div>

                {/* Back Body */}
                <div className="py-4 space-y-4">
                  <div className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line font-normal">
                    {activeCard.back}
                  </div>

                  {activeCard.mnemonicOrTip && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 block mb-0.5">Memory Tip / Mnemonic:</span>
                        <span>{activeCard.mnemonicOrTip}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Repetitions: {activeCard.repetitions || 0}</span>
                  <span className="text-indigo-400 font-medium">Click to flip back</span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Controls & Spaced Repetition Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev (←)</span>
            </button>

            {/* Spaced Repetition Rating Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRateCard('review')}
                className="px-3 sm:px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Hard (1d)</span>
              </button>
              <button
                onClick={() => handleRateCard('learning')}
                className="px-3 sm:px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Good (3d)</span>
              </button>
              <button
                onClick={() => handleRateCard('mastered')}
                className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Easy (7d)</span>
              </button>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              <span>Next (→)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1">Add Flashcard to {currentDeck.title}</h3>
            <p className="text-xs text-slate-400 mb-4">Create your own active-recall question and answer.</p>

            <form onSubmit={handleAddCustomCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Front (Prompt / Question)</label>
                <textarea
                  rows={2}
                  required
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. What is the role of CaMKII in LTP?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Back (Explanation / Answer)</label>
                <textarea
                  rows={3}
                  required
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Detailed explanation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Biochemistry"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Memory Tip (Optional)</label>
                  <input
                    type="text"
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    placeholder="e.g. Mnemonic..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
