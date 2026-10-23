import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileUp, 
  Sliders, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { SlideDeck } from '../types';

interface SlideUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckCreated: (deck: SlideDeck) => void;
  currentWeek: number;
}

const SAMPLE_LECTURES = [
  {
    title: 'Neurobiology: Long-Term Potentiation & Synaptic Plasticity',
    course: 'NEUR201: Cellular Neuroscience',
    week: 6,
    content: `
Lecture 6: Synaptic Plasticity & Memory Consolidation
Key Topics:
1. Long-Term Potentiation (LTP) in the Hippocampus CA1 region.
- Tetanic high-frequency stimulation produces enduring increase in synaptic efficacy.
- Requires activation of post-synaptic NMDA receptors. At resting potential (-70mV), NMDA pore is blocked by Magnesium ion (Mg2+).
- Depolarization removes Mg2+ block, allowing influx of Calcium (Ca2+).
- Ca2+ activates CaMKII (Calmodulin-dependent protein kinase II) and Protein Kinase C (PKC).
- Results in insertion of additional AMPA receptors into the postsynaptic density (early LTP).
- Late LTP requires gene transcription, protein synthesis, and CREB activation to grow new dendritic spines.
2. Long-Term Depression (LTD).
- Low frequency stimulation (1 Hz) causes prolonged low level Ca2+ entry, activating protein phosphatases (Calcineurin/PP1) leading to AMPA receptor endocytosis.
3. Hebbian Learning: "Neurons that fire together, wire together."
4. Clinical significance: Alzheimer's disease pathology involves soluble Amyloid-beta oligomers blocking LTP and facilitating LTD.
    `.trim()
  },
  {
    title: 'Microeconomics: Oligopoly, Cournot Competition & Game Theory',
    course: 'ECON102: Intermediate Microeconomics',
    week: 8,
    content: `
Lecture 8: Game Theory & Imperfect Competition
Key Topics:
1. Oligopoly Market Structure: Small number of interdependent firms with high barriers to entry.
2. Simultaneous Quantity Choice: The Cournot Model
- Each firm chooses output quantity taking rival's expected quantity as given.
- Reaction Functions (Best Response curves): q1* = (a - c - b*q2) / (2b).
- Cournot equilibrium lies strictly between perfect competition (P = MC) and monopoly (monopoly deadweight loss is highest).
3. Simultaneous Price Choice: The Bertrand Paradox
- With identical goods and constant marginal cost, price equals marginal cost even with only 2 firms!
4. The Prisoner's Dilemma & Cartels
- Collusion (monopoly profit sharing) is an unstable cooperative outcome because each firm has a dominant incentive to cheat and produce more.
- Repeated games with tit-for-tat strategies can sustain cooperation if discount factor delta is sufficiently high.
5. Nash Equilibrium: Strategy profile where no player has an incentive to unilaterally deviate.
    `.trim()
  }
];

export const SlideUploader: React.FC<SlideUploaderProps> = ({
  isOpen,
  onClose,
  onDeckCreated,
  currentWeek,
}) => {
  const [courseTitle, setCourseTitle] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const [weekNumber, setWeekNumber] = useState(currentWeek);
  const [targetDifficulty, setTargetDifficulty] = useState<'adaptive' | 'foundational' | 'exam-prep'>('adaptive');
  const [file, setFile] = useState<File | null>(null);
  const [textNotes, setTextNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!deckTitle) {
        setDeckTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!deckTitle) {
        setDeckTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const loadSample = (sampleIndex: number) => {
    const s = SAMPLE_LECTURES[sampleIndex];
    setDeckTitle(s.title);
    setCourseTitle(s.course);
    setWeekNumber(s.week);
    setTextNotes(s.content);
    setFile(null);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!file && !textNotes.trim()) {
      setErrorMessage('Please upload a slide file (PDF/Image) or paste your lecture content.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Uploading lecture slide data...');

    try {
      let base64Data: string | undefined = undefined;
      let mimeType: string | undefined = undefined;

      if (file) {
        setLoadingStep(`Processing ${file.name} (${Math.round(file.size / 1024)} KB)...`);
        base64Data = await readFileAsBase64(file);
        mimeType = file.type || 'application/pdf';
      }

      setLoadingStep('Gemini 3.8 Flash is extracting core concepts and active-recall flashcards...');

      const payload = {
        filename: file ? file.name : (deckTitle || 'Lecture Notes'),
        mimeType,
        base64Data,
        textContent: textNotes.trim() || undefined,
        courseTitle: courseTitle.trim() || 'General Course',
        weekNumber: Number(weekNumber) || 1,
        targetDifficulty
      };

      const response = await fetch('/api/slides/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      setLoadingStep('Assembling personalized quiz questions & weekly study roadmap...');

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error('Could not parse slide analysis response.');
      }

      const generated = result.data;
      const deckId = `deck-${Date.now()}`;

      const newDeck: SlideDeck = {
        id: deckId,
        title: deckTitle.trim() || generated.title || 'Lecture Slides',
        course: courseTitle.trim() || 'General Course',
        weekNumber: Number(weekNumber) || 1,
        uploadDate: new Date().toISOString().split('T')[0],
        filename: file ? file.name : 'Lecture_Notes.txt',
        fileType: file ? (file.type.includes('image') ? 'image' : 'pdf') : 'notes',
        summary: generated.summary || 'Summary generated from lecture slides.',
        keyTakeaways: generated.keyTakeaways || [],
        keyConcepts: generated.keyConcepts || [],
        flashcards: (generated.flashcards || []).map((fc: any, idx: number) => ({
          ...fc,
          id: `fc-${deckId}-${idx}`,
          deckId,
          masteryStatus: 'new',
          repetitions: 0
        })),
        quizQuestions: (generated.quizQuestions || []).map((q: any, idx: number) => ({
          ...q,
          id: `q-${deckId}-${idx}`,
          deckId,
        })),
        studyPlan: generated.studyPlan || [],
        isPreloaded: false
      };

      onDeckCreated(newDeck);
      onClose();
    } catch (err: any) {
      console.error('Upload & Generation failed:', err);
      setErrorMessage(err.message || 'Failed to process slides. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upload Lecture Slides</h2>
              <p className="text-xs text-slate-400">AI automatically extracts flashcards, quizzes & study plans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Analysis Failed</p>
                <p className="text-xs text-rose-200/80 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Quick Sample Selector */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Or try with a pre-configured sample lecture:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_LECTURES.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => loadSample(idx)}
                  className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-indigo-500/40 text-xs text-slate-300 transition-colors group"
                >
                  <span className="font-semibold text-indigo-400 block group-hover:text-indigo-300">{sample.course}</span>
                  <span className="line-clamp-1 text-slate-400 mt-0.5">{sample.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop File Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Slide Deck File (PDF, Presentation Images, or Notes)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-indigo-500/50 bg-slate-950/50 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-auto text-xs text-slate-400 hover:text-rose-400 px-2 py-1"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 text-indigo-400 flex items-center justify-center">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    Drop your lecture slides here, or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports PDF slides, presentation slide exports (PNG/JPEG), or text transcripts
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alternative: Direct Notes Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Or Paste Lecture Content / Transcribed Slides</span>
              <span className="text-slate-500 font-normal">Optional</span>
            </label>
            <textarea
              rows={3}
              value={textNotes}
              onChange={(e) => setTextNotes(e.target.value)}
              placeholder="Paste key slide takeaways, bullet points, transcript, or syllabus objectives..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Deck / Lecture Title</label>
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                placeholder="e.g. Week 6 Synaptic Plasticity"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Course Code</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. NEUR 201"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Study Week</label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Week {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty Setting */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400">Target Quiz Depth:</span>
            <div className="flex items-center gap-1.5">
              {(['adaptive', 'foundational', 'exam-prep'] as const).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setTargetDifficulty(diff)}
                  className={`text-xs px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    targetDifficulty === diff
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-sm font-semibold text-indigo-300">Processing with Gemini 3.8 Flash...</span>
              </div>
              <p className="text-xs text-slate-300 pl-8">{loadingStep}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Generate Flashcards & Quizzes</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
