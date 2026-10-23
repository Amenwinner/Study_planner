import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Generous limits for lecture slide PDFs and slide deck images
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Analyze Lecture Slides and Generate Flashcards, Questions & Quizzes
app.post('/api/slides/analyze', async (req, res) => {
  try {
    const { filename, mimeType, base64Data, textContent, courseTitle, weekNumber, targetDifficulty } = req.body;

    if (!base64Data && !textContent) {
      return res.status(400).json({ error: 'Please provide either slide file data or lecture notes text.' });
    }

    const ai = getGeminiClient();

    const parts: any[] = [];

    if (base64Data && mimeType) {
      // Support PDF, image/png, image/jpeg, etc.
      // Clean base64 if it includes prefix data URL
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64,
        },
      });
    }

    const promptText = `
You are an elite university professor and cognitive learning specialist.
Analyze the provided lecture slides / content:
Filename: "${filename || 'Lecture Slides'}"
Course: "${courseTitle || 'University Course'}"
Week: Week ${weekNumber || 1}
Target Difficulty: ${targetDifficulty || 'adaptive'}

${textContent ? `Lecture Text / Notes:\n"""${textContent.slice(0, 50000)}"""\n` : ''}

Tasks:
1. Extract a clear synthesis: concise summary (3-5 core takeaways) and main topic title.
2. Extract 6-12 foundational Key Concepts with clear definitions, importance level (high/medium), and memory tips.
3. Generate 10-14 high-impact active-recall Flashcards (front prompt/question, clear back explanation, category, difficulty, mnemonic/memory tip).
4. Generate 8-12 comprehensive Quiz Questions (mix of multiple-choice, true/false, and conceptual fill-in-blank). Each question must feature 4 options (for multiple-choice) or 2 options (for true-false), the exact correct answer, in-depth explanation of WHY the answer is correct and why other options are pitfalls, and the specific concept tested.
5. Create a recommended 7-Day Weekly Study Plan to master this slide deck before the weekly quiz/midterm.

Ensure questions test actual comprehension and application, not trivial formatting details.
Return strictly JSON matching the required schema.
`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Derived lecture or deck topic title' },
            summary: { type: Type.STRING, description: 'Comprehensive 2-4 sentence overview of the lecture slides' },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 core takeaways from the lecture'
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  importance: { type: Type.STRING }, // 'high' | 'medium'
                  memoryTip: { type: Type.STRING }
                },
                required: ['term', 'definition', 'importance']
              }
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: 'Question, prompt, or term to recall' },
                  back: { type: Type.STRING, description: 'Comprehensive explanation and key points' },
                  category: { type: Type.STRING, description: 'Subtopic or category' },
                  difficulty: { type: Type.STRING, description: 'easy, medium, or hard' },
                  mnemonicOrTip: { type: Type.STRING, description: 'Mnemonic or memory trick' }
                },
                required: ['front', 'back', 'category', 'difficulty']
              }
            },
            quizQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'multiple-choice or true-false' },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  conceptTested: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctAnswer', 'explanation', 'conceptTested']
              }
            },
            studyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: 'Day 1, Day 2, etc.' },
                  focus: { type: Type.STRING },
                  action: { type: Type.STRING },
                  estimatedMinutes: { type: Type.NUMBER }
                },
                required: ['day', 'focus', 'action', 'estimatedMinutes']
              }
            }
          },
          required: ['title', 'summary', 'keyTakeaways', 'keyConcepts', 'flashcards', 'quizQuestions', 'studyPlan']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error analyzing lecture slides:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze lecture slides with Gemini.',
      details: String(error)
    });
  }
});

// Generate Custom or Personalized Quiz based on Weak Areas / Custom Topic
app.post('/api/quiz/generate-custom', async (req, res) => {
  try {
    const { topic, contextNotes, questionCount = 8, difficulty = 'adaptive', weakAreas = [] } = req.body;

    const ai = getGeminiClient();

    const prompt = `
You are an expert exam creator.
Generate a personalized quiz based on the following:
Topic: "${topic}"
Question Count: ${questionCount}
Difficulty: "${difficulty}"
${contextNotes ? `Context / Slide notes:\n"""${contextNotes.slice(0, 20000)}"""\n` : ''}
${weakAreas.length > 0 ? `Student's identified weak areas needing reinforcement: ${weakAreas.join(', ')}` : ''}

Generate ${questionCount} high-quality questions that challenge critical thinking and practical knowledge.
Return strictly JSON matching the required schema.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            targetDescription: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING }, // 'multiple-choice' | 'true-false'
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  conceptTested: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctAnswer', 'explanation', 'conceptTested']
              }
            }
          },
          required: ['quizTitle', 'questions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating custom quiz:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate custom quiz with Gemini.'
    });
  }
});

// Interactive AI Deepen / Explain Concept (Explain like I'm 5, why is C wrong, real-world analogy, etc.)
app.post('/api/study/explain', async (req, res) => {
  try {
    const { concept, questionText, studentAnswer, correctAnswer, explanation, userQuery } = req.body;

    const ai = getGeminiClient();

    const prompt = `
You are a warm, highly intuitive tutor helping a student master course material.
Student asked: "${userQuery || 'Explain this in simpler terms and give me an analogy'}"

Context:
Concept / Topic: "${concept || 'Study Concept'}"
${questionText ? `Question: "${questionText}"` : ''}
${studentAnswer ? `Student's Answer: "${studentAnswer}"` : ''}
${correctAnswer ? `Correct Answer: "${correctAnswer}"` : ''}
${explanation ? `Existing Explanation: "${explanation}"` : ''}

Provide a direct, memorable, and pedagogical response:
1. Direct breakdown addressing the student's exact question or confusion.
2. A vivid real-world analogy or mental model to make it stick.
3. A quick check-in tip or mnemonic rule for remembering it on exams.
Keep the formatting clean with markdown bolding and bullet points. Keep it engaging, concise (under 250 words), and encouraging.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.error('Error explaining concept:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate explanation.'
    });
  }
});

// Generate Additional Flashcards for a Deck
app.post('/api/flashcards/generate-more', async (req, res) => {
  try {
    const { deckTitle, existingCards = [], count = 5, focusTopic } = req.body;

    const ai = getGeminiClient();

    const prompt = `
Generate ${count} additional high-yield flashcards for the study deck "${deckTitle}".
${focusTopic ? `Focus particularly on: ${focusTopic}` : ''}
Existing cards already covered (do not duplicate):
${existingCards.map((c: any) => `- ${c.front}`).slice(0, 20).join('\n')}

Return strictly JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newFlashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  category: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  mnemonicOrTip: { type: Type.STRING }
                },
                required: ['front', 'back', 'category', 'difficulty']
              }
            }
          },
          required: ['newFlashcards']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed.newFlashcards });
  } catch (error: any) {
    console.error('Error generating extra flashcards:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flashcards.' });
  }
});

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Synapse Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
