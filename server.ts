import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import mammoth from 'mammoth';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Base URL of the Python video-rendering sidecar (see video-service/README.md).
// Kept server-side only so the browser never needs to know/CORS with it directly.
const VIDEO_SERVICE_URL = (process.env.VIDEO_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initializer for GoogleGenAI
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Response Schema for Lecture Generation
const visualElementSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    label: { type: Type.STRING, description: 'Short concept title' },
    sublabel: { type: Type.STRING, description: 'Brief description or metric' },
    badge: { type: Type.STRING, description: 'E.g. Step 1, Input, Critical' },
    color: {
      type: Type.STRING,
      description: 'One of emerald, sky, amber, violet, rose, indigo, cyan',
    },
  },
  required: ['id', 'label'],
};

const visualConnectionSchema = {
  type: Type.OBJECT,
  properties: {
    from: { type: Type.STRING },
    to: { type: Type.STRING },
    label: { type: Type.STRING },
  },
  required: ['from', 'to'],
};

const visualDiagramSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      description: 'One of: flow, comparison, cycle, hierarchy, formula, timeline',
    },
    title: { type: Type.STRING },
    elements: {
      type: Type.ARRAY,
      items: visualElementSchema,
    },
    connections: {
      type: Type.ARRAY,
      items: visualConnectionSchema,
    },
    summaryFootnote: { type: Type.STRING },
  },
  required: ['type', 'title', 'elements'],
};

const slideBulletSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    heading: { type: Type.STRING, description: 'Bold lead-in phrase (2-4 words)' },
    content: { type: Type.STRING, description: 'Detailed bullet explanation (15-30 words)' },
    emphasis: { type: Type.STRING, description: 'Key phrase or rule to remember' },
    highlightKeyword: { type: Type.STRING, description: 'The single most important keyword' },
  },
  required: ['id', 'heading', 'content'],
};

const scriptSegmentSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: 'Spoken sentence by the teacher' },
    focusBulletId: { type: Type.STRING, description: 'ID of the bullet being discussed, or empty' },
    teacherGesture: {
      type: Type.STRING,
      description: 'One of: pointing, explaining, writing, questioning, nodding',
    },
  },
  required: ['text', 'teacherGesture'],
};

const lectureSlideSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    slideNumber: { type: Type.INTEGER },
    totalSlides: { type: Type.INTEGER },
    chapterTitle: { type: Type.STRING, description: 'Section or chapter tag' },
    topicTitle: { type: Type.STRING, description: 'Main slide heading' },
    subtitle: { type: Type.STRING, description: 'Pedagogical context or question' },
    bullets: {
      type: Type.ARRAY,
      items: slideBulletSchema,
    },
    calloutBox: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'One of: exam_tip, mental_model, definition, common_mistake, takeaway',
        },
        title: { type: Type.STRING },
        text: { type: Type.STRING },
      },
      required: ['type', 'title', 'text'],
    },
    visualDiagram: visualDiagramSchema,
    blackboardSummarySnippet: {
      type: Type.STRING,
      description: 'Chalkboard formula or shorthand equation summary',
    },
    teacherScript: {
      type: Type.STRING,
      description: 'Full spoken script as if an expert teacher is giving a lecture in class',
    },
    estimatedDurationSeconds: { type: Type.INTEGER },
    scriptSegments: {
      type: Type.ARRAY,
      items: scriptSegmentSchema,
    },
  },
  required: [
    'id',
    'slideNumber',
    'totalSlides',
    'chapterTitle',
    'topicTitle',
    'subtitle',
    'bullets',
    'visualDiagram',
    'teacherScript',
    'scriptSegments',
  ],
};

const lectureDataSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING, description: 'Engaging title for the lecture' },
    subject: { type: Type.STRING, description: 'Academic subject domain' },
    targetAudience: { type: Type.STRING, description: 'Intended learner level' },
    totalDurationSeconds: { type: Type.INTEGER },
    overviewSummary: { type: Type.STRING, description: 'Executive syllabus summary' },
    slides: {
      type: Type.ARRAY,
      items: lectureSlideSchema,
    },
    keyTermsGlossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING },
        },
        required: ['term', 'definition'],
      },
    },
    suggestedReviewQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['id', 'title', 'subject', 'overviewSummary', 'slides'],
};

// Helper to execute Gemini with fallback models and retry on temporary high demand (503 / 429)
async function callGeminiWithFallback(ai: GoogleGenAI, requestConfig: any) {
  // Use recommended models: prioritize gemini-3.8-flash, followed by fast gemini-3.1-flash-lite and gemini-flash-latest
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    let timeoutTimer: NodeJS.Timeout | null = null;
    try {
      console.log(`[Gemini API] Requesting generation with model: ${model}`);
      
      const timeoutMs = 60000;
      const modelPromise = ai.models.generateContent({
        ...requestConfig,
        model,
      });

      const timeoutPromise = new Promise((_, reject) => {
        timeoutTimer = setTimeout(() => reject(new Error(`Model ${model} request timed out after ${timeoutMs / 1000}s`)), timeoutMs);
      });

      const response: any = await Promise.race([modelPromise, timeoutPromise]);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      lastError = err;
      const errMsg = typeof err?.message === 'string' ? err.message : JSON.stringify(err || '');
      const errStatus = err?.status || err?.code || err?.error?.code;
      const isTransientUnavailable =
        errStatus === 503 ||
        errStatus === 'UNAVAILABLE' ||
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errStatus === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('timed out');

      if (isTransientUnavailable) {
        console.log(`[Gemini API] Model ${model} is experiencing temporary high demand or timeout, immediately trying next candidate...`);
      } else {
        console.warn(`[Gemini API] Model ${model} returned: ${errMsg.slice(0, 100)}`);
      }
      // Continue to next model immediately
    }
  }
  throw lastError || new Error('All Gemini model generation attempts failed.');
}

// Intelligent fallback generator if external API is temporarily unavailable
function generateFallbackLectureFromNotes(
  rawText: string,
  teacherPersona: any,
  requestedSlides = 4,
  language = 'English',
  level = 'intermediate',
  voice = 'female',
  preferredTitle?: string
) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || 'Core Study Concepts';
  const derivedTitle = firstLine.replace(/^[#\s\d.-]+/, '').slice(0, 60) || 'Classroom Masterclass';
  const cleanTitle = preferredTitle?.trim() || derivedTitle;

  const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
  const numSlides = Math.max(3, Math.min(requestedSlides || 4, Math.max(3, paragraphs.length)));

  const slides: any[] = [];
  const palette = ['emerald', 'sky', 'amber', 'violet', 'rose', 'cyan'];

  const isHindi = language.toLowerCase() === 'hindi';
  const isHinglish = language.toLowerCase() === 'hinglish';

  for (let i = 0; i < numSlides; i++) {
    const p = paragraphs[i % paragraphs.length] || rawText;
    const sentences = p.split(/(?<=[.?!।])\s+/).filter(Boolean);
    const baseTopic = sentences[0]?.slice(0, 45).replace(/[#*`_]/g, '') || `Key Principle ${i + 1}`;

    let topicHeading = baseTopic;
    let b1Head = 'Core Mechanism';
    let b1Content = sentences[0] || `${topicHeading} represents a fundamental concept for this domain.`;
    let b2Head = 'Key Operation';
    let b2Content = sentences[1] || `Detailed observation reveals how elements interact dynamically under varying conditions.`;
    let b3Head = 'System Impact';
    let b3Content = sentences[2] || `Understanding this mechanism enables accurate prediction and mastery of overall behavior.`;
    let teacherScript = '';

    if (isHindi) {
      topicHeading = `अध्याय ${i + 1}: ${baseTopic}`;
      b1Head = 'मूल संकल्पना';
      b1Content = sentences[0] || `यह संकल्पना इस विषय का सबसे महत्वपूर्ण आधार है।`;
      b2Head = 'मुख्य कार्यप्रणाली';
      b2Content = sentences[1] || `प्रक्रिया के दौरान सभी घटक परस्पर मिलकर कार्य करते हैं।`;
      b3Head = 'परीक्षा निष्कर्ष';
      b3Content = sentences[2] || `इस नियम को याद रखकर आप जटिल प्रश्नों को आसानी से हल कर सकते हैं।`;
      teacherScript = `नमस्ते विद्यार्थियों! आज हम समझेंगे ${baseTopic} के बारे में। बोर्ड पर ध्यान दीजिए: ${b1Content} अब आगे देखिए, ${b2Content} इसे अच्छे से याद रखें।`;
    } else if (isHinglish) {
      topicHeading = `Topic ${i + 1}: ${baseTopic}`;
      b1Head = 'Core Concept';
      b1Content = sentences[0] || `Ye concept iss topic ki main foundation hai.`;
      b2Head = 'Working Process';
      b2Content = sentences[1] || `Yahan dekh sakte hain ki components aapas mein kaise interact karte hain.`;
      b3Head = 'Exam Takeaway';
      b3Content = sentences[2] || `Isko dhyan se note kar lijiye, exam mein direct question aata hai.`;
      teacherScript = `Hello everyone! Aaj ke session mein hum explore karenge ${baseTopic}. Screen par dekhiye: ${b1Content}. Basically yahan mechanism ye hai ki ${b2Content}. Is point ko achhi tarah samajh lijiye.`;
    } else {
      teacherScript = `Welcome class. Today we explore ${topicHeading}. ${b1Content} Observe how the inputs trigger our active process, directly yielding the target synthesis. Keep this critical connection in mind!`;
    }

    const sId = `slide-${i + 1}`;
    const b1Id = `b${i + 1}-1`;
    const b2Id = `b${i + 1}-2`;
    const b3Id = `b${i + 1}-3`;

    slides.push({
      id: sId,
      slideNumber: i + 1,
      totalSlides: numSlides,
      chapterTitle: isHindi ? `भाग ${i + 1}` : `Chapter ${i + 1}`,
      topicTitle: topicHeading,
      subtitle: sentences[1]?.slice(0, 80) || (isHindi ? 'विस्तृत समझ एवं व्यावहारिक अनुप्रयोग' : 'Critical pedagogical breakdown and real-world implications'),
      bullets: [
        {
          id: b1Id,
          heading: b1Head,
          content: b1Content,
          emphasis: isHindi ? 'आवश्यक बिंदु' : 'Essential takeaway',
          highlightKeyword: baseTopic.split(' ')[0] || 'Core',
        },
        {
          id: b2Id,
          heading: b2Head,
          content: b2Content,
          emphasis: isHindi ? 'कार्यप्रणाली' : 'Notice the causal relationship',
          highlightKeyword: 'Dynamic',
        },
        {
          id: b3Id,
          heading: b3Head,
          content: b3Content,
          emphasis: isHindi ? 'परीक्षा उपयोगी' : 'Master this connection',
          highlightKeyword: 'Impact',
        },
      ],
      calloutBox: {
        type: i % 2 === 0 ? 'exam_tip' : 'mental_model',
        title: isHindi ? (i % 2 === 0 ? 'परीक्षा सुझाव' : 'सहज दृष्टिकोण') : (i % 2 === 0 ? 'High-Yield Exam Focus' : 'Intuitive Mental Model'),
        text: isHindi
          ? `परीक्षा में ${baseTopic} के कारणों और परिणामों पर सीधे प्रश्न पूछे जाते हैं।`
          : `Remember that ${baseTopic} is frequently tested on its direct step-by-step logic. Focus on cause and effect!`,
      },
      visualDiagram: {
        type: i === 0 ? 'flow' : i === 1 ? 'cycle' : 'comparison',
        title: `${baseTopic} Infographic`,
        elements: [
          { id: `el-${i}-1`, label: isHindi ? 'आरंभिक कारक' : 'Inputs & Drivers', sublabel: isHindi ? 'प्राथमिक चरण' : 'Initial triggers', badge: 'Step 1', color: palette[i % palette.length] },
          { id: `el-${i}-2`, label: isHindi ? 'सक्रिय प्रक्रिया' : 'Active Process', sublabel: isHindi ? 'परिवर्तन' : 'Transformational phase', badge: 'Step 2', color: palette[(i + 1) % palette.length] },
          { id: `el-${i}-3`, label: isHindi ? 'अंतिम परिणाम' : 'Synthesized Output', sublabel: isHindi ? 'निष्कर्ष' : 'Stable conclusion', badge: 'Result', color: palette[(i + 2) % palette.length] },
        ],
        connections: [
          { from: `el-${i}-1`, to: `el-${i}-2`, label: isHindi ? 'क्रिया' : 'Initiates' },
          { from: `el-${i}-2`, to: `el-${i}-3`, label: isHindi ? 'परिणाम' : 'Yields' },
        ],
        summaryFootnote: isHindi ? 'व्यवस्थित रेखाचित्र एवं प्रवाह' : 'Directional workflow illustrating the core causal flow.',
      },
      blackboardSummarySnippet: isHindi ? 'सूत्र: इनपुट → प्रक्रम → परिणाम' : `${baseTopic.slice(0, 18)} => OUTPUT`,
      teacherScript,
      estimatedDurationSeconds: 40,
      scriptSegments: [
        {
          text: isHindi ? `नमस्ते विद्यार्थियों! आज हम समझेंगे ${baseTopic} के बारे में।` : isHinglish ? `Hello everyone! Aaj hum samjhenge ${baseTopic} ke baare mein.` : `Welcome class. Let us dive directly into ${topicHeading}.`,
          focusBulletId: b1Id,
          teacherGesture: 'pointing',
        },
        {
          text: b1Content,
          focusBulletId: b1Id,
          teacherGesture: 'explaining',
        },
        {
          text: b2Content,
          focusBulletId: b2Id,
          teacherGesture: 'writing',
        },
        {
          text: b3Content,
          focusBulletId: b3Id,
          teacherGesture: 'nodding',
        },
      ],
    });
  }

  return {
    id: `lecture-${Date.now()}`,
    title: cleanTitle,
    subject: isHindi ? 'शैक्षणिक व्याख्यान' : isHinglish ? 'Study Masterclass' : 'Academic Study Lecture',
    targetAudience: isHindi ? 'विद्यार्थी एवं प्रतियोगी छात्र' : 'Students & Lifelong Learners',
    totalDurationSeconds: slides.length * 40,
    overviewSummary: isHindi
      ? `${cleanTitle} पर आधारित एक विस्तृत कक्षा व्याख्यान जिसमें मुख्य बिंदु, दृश्य रेखाचित्र और शिक्षक का स्पष्टीकरण शामिल है।`
      : `A comprehensive classroom lecture systematically breaking down ${cleanTitle} into high-yield visual slides, chalkboard summaries, and teacher explanations.`,
    slides,
    keyTermsGlossary: [
      { term: cleanTitle.split(' ')[0] || 'Core Factor', definition: 'The primary underlying principle governing the behavior of this system.' },
      { term: 'Active Process', definition: 'An element that accelerates the transition between input states and resulting outputs.' },
    ],
    suggestedReviewQuestions: [
      `How does the primary mechanism in ${cleanTitle} determine the final observed output?`,
      'What common pitfall do students encounter when analyzing this reaction or sequence?',
      'How would you explain the intuitive mental model of this topic to a peer?',
    ],
    language,
    level,
    voiceGender: voice,
  };
}

// POST /api/generate-lecture
app.post('/api/generate-lecture', async (req: Request, res: Response) => {
  try {
    const {
      textNotes,
      fileData,
      teacherPersona,
      teachingStyle = 'concept_breakdown',
      slideCount,
      language = 'English',
      level = 'intermediate',
      duration = 5,
      voice = 'female',
    } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please check the Secrets settings.',
      });
    }

    // Determine target slide count based on requested duration (5 - 15 minutes)
    const effectiveDurationMinutes = Math.max(5, Math.min(15, Number(duration) || 5));
    const targetSlideCount = slideCount || Math.max(3, Math.min(6, Math.round(effectiveDurationMinutes * 0.5)));

    let rawTextContent = typeof textNotes === 'string' ? textNotes.trim() : '';
    let inlinePdfPart: { inlineData: { mimeType: string; data: string } } | null = null;

    // Handle uploaded fileData if provided
    if (fileData && fileData.base64) {
      const mime = fileData.mimeType || '';
      const fileName = (fileData.fileName || '').toLowerCase();

      if (mime.includes('pdf') || fileName.endsWith('.pdf')) {
        // Pass PDF directly to Gemini 3.8 Flash!
        inlinePdfPart = {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileData.base64,
          },
        };
      } else if (
        mime.includes('wordprocessingml') ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')
      ) {
        try {
          const buffer = Buffer.from(fileData.base64, 'base64');
          const docxResult = await mammoth.extractRawText({ buffer });
          rawTextContent = (rawTextContent ? rawTextContent + '\n\n' : '') + docxResult.value;
        } catch (docxErr) {
          console.error('Docx parse error, falling back to raw buffer string:', docxErr);
          const rawBuf = Buffer.from(fileData.base64, 'base64').toString('utf-8');
          rawTextContent = (rawTextContent ? rawTextContent + '\n\n' : '') + rawBuf;
        }
      } else {
        // Plain text or markdown
        try {
          const rawBuf = Buffer.from(fileData.base64, 'base64').toString('utf-8');
          rawTextContent = (rawTextContent ? rawTextContent + '\n\n' : '') + rawBuf;
        } catch {
          // ignore
        }
      }
    }

    if (!rawTextContent && !inlinePdfPart) {
      return res.status(400).json({
        error: 'No notes or document content provided. Please upload a file or enter text notes.',
      });
    }

    const defaultTeacherName = voice === 'male' ? 'Prof. Marcus Hayes' : 'Dr. Clara Vance';
    const teacherName = teacherPersona?.name || defaultTeacherName;
    const teacherTitle = teacherPersona?.title || 'Professor';
    const teacherTone =
      teacherPersona?.toneDescription ||
      'Engaging, clear, conversational, uses intuitive analogies and checks for understanding.';

    // Language guidelines
    let languageInstruction = '';
    const normLang = (language || 'English').toLowerCase();
    if (normLang === 'hindi') {
      languageInstruction = `CRITICAL LANGUAGE INSTRUCTION: The lecture MUST be taught in HINDI (हिन्दी).
- The spoken 'teacherScript' MUST be written in natural, articulate, warm Hindi (using Devanagari script).
- Slide topicTitles, bullet headings, bullet contents, and calloutBox MUST be in Hindi (Devanagari script), retaining customary technical/scientific terms in brackets or transliteration.
- Speak directly like a revered Indian professor delivering a captivating classroom lecture.`;
    } else if (normLang === 'hinglish') {
      languageInstruction = `CRITICAL LANGUAGE INSTRUCTION: The lecture MUST be taught in HINGLISH (a conversational Hindi + English blend written in Latin script, as commonly spoken in Indian university lectures and YouTube educational tutorials).
- Spoken 'teacherScript' MUST be conversational Hinglish: (e.g. "Hello students! Aaj ke lecture mein hum samjhenge photosynthesis ka pura mechanism. Screen par slide ko dekhiye, yahan key principle ye hai ki...").
- Slide titles and bullet headings should use crisp English with Hinglish takeaways.`;
    } else {
      languageInstruction = `LANGUAGE: The lecture must be in clear, engaging, high-yield English with articulate professorial delivery.`;
    }

    // Understanding level guidelines
    let levelInstruction = '';
    const normLevel = (level || 'intermediate').toLowerCase();
    if (normLevel === 'beginner') {
      levelInstruction = `LEVEL OF UNDERSTANDING: BEGINNER.
- Explain every concept from first principles using intuitive everyday analogies.
- Avoid unexplained technical jargon. Ensure anyone new to this topic can grasp it instantly.`;
    } else if (normLevel === 'advanced') {
      levelInstruction = `LEVEL OF UNDERSTANDING: ADVANCED.
- Focus on analytical rigor, formal principles, theoretical edge cases, and high-level critical thinking.
- Assume solid foundational knowledge and discuss deep mechanisms.`;
    } else {
      levelInstruction = `LEVEL OF UNDERSTANDING: INTERMEDIATE.
- Balance intuitive clarity with standard curriculum coverage, core mechanisms, cause-and-effect pathways, and practical applications.`;
    }

    const systemPrompt = `You are ${teacherName}, ${teacherTitle}. You are a world-class, beloved university professor and educator.
Your task is to transform the provided raw study notes/document into a masterfully crafted, teacher-style video presentation lecture without any manual prompting required from the user.

${languageInstruction}

${levelInstruction}

Key Requirements:
1. Divide the material into between 3 and ${Math.max(3, Math.min(8, targetSlideCount))} high-yield, logical pedagogical slides for a ${effectiveDurationMinutes}-minute lecture.
2. For EVERY slide:
   - Provide a clear chapterTitle and topicTitle.
   - Include 3 to 4 detailed, high-yield bullet points. Each bullet MUST have an engaging 'heading' (2-4 words), a comprehensive 'content' explanation, an 'emphasis' takeaway, and a 'highlightKeyword'.
   - Include an interactive 'visualDiagram' suitable for visual learners (type can be 'flow', 'comparison', 'cycle', 'hierarchy', or 'formula') with 3 to 5 elements and clear connections.
   - Include a 'calloutBox' (such as an exam_tip, mental_model, or common_mistake) that adds deep pedagogical value.
   - Include a 'blackboardSummarySnippet' (a short equation, summary formula, or core axiom written on the chalkboard).
   - Write a rich, natural, spoken 'teacherScript' (approx 60-120 words per slide). The script must sound like a real, charismatic teacher talking directly to students in class! Use verbal transitions like: "Notice on the diagram...", "Now why does this matter?", "Think of this like...", "A classic exam pitfall here is...".
   - Break the script down into 3-5 sequential 'scriptSegments', each with an appropriate 'teacherGesture' ('pointing', 'explaining', 'writing', 'questioning', 'nodding') and the matching 'focusBulletId'.
3. Tone & Pedagogy: ${teacherTone}. Target duration: ${effectiveDurationMinutes} minutes.
4. Provide an overall lecture title, subject, executive overviewSummary, keyTermsGlossary (4-6 terms), and 3 suggestedReviewQuestions for students.`;

    const promptParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (inlinePdfPart) {
      promptParts.push(inlinePdfPart);
    }

    let userPromptText = `Please turn the following study notes and materials into an interactive teacher-style video lecture:\n\n`;
    if (rawTextContent) {
      userPromptText += rawTextContent.slice(0, 35000); // safety slice
    } else {
      userPromptText += `(Analyze the attached PDF document thoroughly and structure the entire lecture from its core concepts)`;
    }

    promptParts.push({ text: userPromptText });

    let lectureData: any = null;

    try {
      const response = await callGeminiWithFallback(ai, {
        contents: promptParts,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: lectureDataSchema,
        },
      });

      const textOutput = response.text;
      if (textOutput) {
        const cleanJson = textOutput.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        lectureData = JSON.parse(cleanJson);
      }
    } catch (modelErr: any) {
      console.warn('Gemini API call failed or timed out, generating robust pedagogical fallback:', modelErr?.message || modelErr);
      const titleFromFile = fileData?.fileName ? fileData.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : '';
      const notesToUse = rawTextContent || titleFromFile || 'Fundamental Principles and Practical Applications of the Topic';
      lectureData = generateFallbackLectureFromNotes(notesToUse, teacherPersona, targetSlideCount, language, level, voice, titleFromFile);
    }

    if (!lectureData) {
      const titleFromFile = fileData?.fileName ? fileData.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : '';
      const notesToUse = rawTextContent || titleFromFile || 'Fundamental Principles and Practical Applications of the Topic';
      lectureData = generateFallbackLectureFromNotes(notesToUse, teacherPersona, targetSlideCount, language, level, voice, titleFromFile);
    }

    // Ensure metadata, language, level, and IDs are set
    lectureData.language = language;
    lectureData.level = level;
    lectureData.voiceGender = voice;

    if (!lectureData.id) {
      lectureData.id = `lecture-${Date.now()}`;
    }
    if (Array.isArray(lectureData.slides)) {
      const total = lectureData.slides.length;
      lectureData.slides.forEach((slide: any, idx: number) => {
        slide.slideNumber = idx + 1;
        slide.totalSlides = total;
        if (!slide.id) slide.id = `slide-${idx + 1}`;
        if (Array.isArray(slide.bullets)) {
          slide.bullets.forEach((b: any, bIdx: number) => {
            if (!b.id) b.id = `b${idx + 1}-${bIdx + 1}`;
          });
        }
        if (!slide.estimatedDurationSeconds) {
          const wordCount = (slide.teacherScript || '').split(/\s+/).length;
          slide.estimatedDurationSeconds = Math.max(25, Math.round(wordCount / 2.4));
        }
      });
      lectureData.totalDurationSeconds = lectureData.slides.reduce(
        (acc: number, s: any) => acc + (s.estimatedDurationSeconds || 30),
        0
      );
    }

    // Ensure interactive quizzes and flashcards are available for Learnify study suite
    if (!lectureData.quizzes || !Array.isArray(lectureData.quizzes) || lectureData.quizzes.length === 0) {
      lectureData.quizzes = (lectureData.slides || []).map((s: any, qIdx: number) => {
        const b = s.bullets?.[0] || { heading: 'Core Concept', content: s.subtitle || 'Foundational principle' };
        return {
          id: `q-${qIdx + 1}`,
          question: `Regarding ${s.topicTitle}: What is the primary role of ${b.heading}?`,
          options: [
            b.content,
            `It acts as an inert bystander without affecting ${s.topicTitle}`,
            `It completely reverses the primary direction of the process`,
            `It functions independently without interacting with other components`,
          ],
          correctAnswerIndex: 0,
          explanation: `As detailed on Slide ${s.slideNumber}: ${b.content} (${b.emphasis || 'Essential takeaway'}).`,
        };
      });
    }

    if (!lectureData.flashcards || !Array.isArray(lectureData.flashcards) || lectureData.flashcards.length === 0) {
      const cards: any[] = [];
      (lectureData.keyTermsGlossary || []).forEach((k: any, idx: number) => {
        cards.push({
          id: `fc-g-${idx + 1}`,
          front: k.term,
          back: k.definition,
          category: 'Key Definition',
        });
      });
      (lectureData.slides || []).forEach((s: any, idx: number) => {
        const b = s.bullets?.[0];
        if (b) {
          cards.push({
            id: `fc-s-${idx + 1}`,
            front: `${s.topicTitle}: ${b.heading}`,
            back: b.content,
            category: 'Slide Takeaway',
          });
        }
      });
      lectureData.flashcards = cards;
    }

    return res.json({
      ...lectureData,
      success: true,
      lecture: lectureData,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-lecture:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate teacher lecture from notes.',
    });
  }
});

// POST /api/ask-teacher
app.post('/api/ask-teacher', async (req: Request, res: Response) => {
  try {
    const { question, currentSlide, lectureTitle, teacherPersona } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const teacherName = teacherPersona?.name || 'Professor';
    const teacherTone = teacherPersona?.toneDescription || 'Warm, encouraging, and pedagogically sharp.';

    const prompt = `You are ${teacherName}, currently teaching a lecture titled "${lectureTitle}".
A student in your class just raised their hand and asked this question about the current slide ("${currentSlide?.topicTitle || 'Current Topic'}"):

Student Question: "${question}"

Current Slide Summary:
- Topic: ${currentSlide?.topicTitle || ''}
- Key takeaway: ${currentSlide?.calloutBox?.text || currentSlide?.subtitle || ''}

Respond directly as the teacher answering the student in class.
Keep your response concise (3 to 5 sentences), warm, pedagogically insightful, and conversational. You may use an analogy or clear example to make it click.`;

    let teacherAnswer = '';
    try {
      const response = await callGeminiWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: `You are an encouraging, expert professor answering a student's question in a live classroom setting. Tone: ${teacherTone}`,
          temperature: 0.7,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });
      teacherAnswer = response.text || '';
    } catch (e) {
      console.warn('Teacher Q&A model fallback:', e);
      teacherAnswer = `That is an excellent question! Notice how on this slide, the core takeaway emphasizes understanding cause-and-effect. When you look at how the inputs feed directly into each stage, that gives you the exact answer you need.`;
    }

    return res.json({
      answer: teacherAnswer || "That's an insightful question! Let's examine how this connects to our core principles.",
    });
  } catch (error: any) {
    console.error('Error in /api/ask-teacher:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to get teacher response.',
    });
  }
});

// --------------------------------------------------------------------------
// REAL VIDEO EXPORT (proxies to the Python video-service sidecar)
//
// Everything the app has produced so far (slides, script, avatar) only ever
// plays live in the browser via Web Speech API + a live DOM render — there
// was no way to get an actual downloadable video file out of it. These
// routes forward the already-generated lecture JSON to video-service, which
// renders real narration + slide images into an MP4 with moviepy/FFmpeg,
// and stream the result back to the browser.
// --------------------------------------------------------------------------

// POST /api/generate-video - start rendering a real MP4 for the current lecture
app.post('/api/generate-video', async (req: Request, res: Response) => {
  try {
    const { lecture, voice, language, level, style } = req.body;

    if (!lecture || !Array.isArray(lecture.slides) || lecture.slides.length === 0) {
      return res.status(400).json({ error: 'A lecture with at least one slide is required.' });
    }

    const upstream = await fetch(`${VIDEO_SERVICE_URL}/api/video/lecture-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lecture, voice, language, level, style }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }
    return res.json(data);
  } catch (error: any) {
    console.error('Error in /api/generate-video:', error);
    return res.status(502).json({
      error:
        'Could not reach the video rendering service. Make sure video-service is running (see video-service/README.md) and VIDEO_SERVICE_URL is set correctly.',
    });
  }
});

// GET /api/generate-video/:jobId - poll rendering status
app.get('/api/generate-video/:jobId', async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${VIDEO_SERVICE_URL}/api/video/jobs/${req.params.jobId}`);
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    // Point the browser straight at video-service's own URL for the actual
    // MP4 download, instead of streaming the whole file through this
    // (possibly serverless) function. video-service's FileResponse already
    // sends Content-Disposition: attachment, so this still downloads
    // correctly even though it's a cross-origin request; its CORS config
    // already allows this app's origin (FRONTEND_URL / *.vercel.app).
    // Set VIDEO_SERVICE_PROXY_DOWNLOAD=true to route the file through this
    // server instead (useful if video-service isn't publicly reachable).
    if (data && data.status === 'done') {
      data.video_url =
        process.env.VIDEO_SERVICE_PROXY_DOWNLOAD === 'true'
          ? `/api/generate-video/${req.params.jobId}/file`
          : `${VIDEO_SERVICE_URL}/api/video/jobs/${req.params.jobId}/video`;
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error checking video job status:', error);
    return res.status(502).json({ error: 'Could not reach the video rendering service.' });
  }
});

// GET /api/generate-video/:jobId/file - optional fallback: stream the MP4
// through this server instead of pointing the browser at video-service
// directly. Only reached if VIDEO_SERVICE_PROXY_DOWNLOAD=true (see above),
// or if you link to it manually — e.g. because video-service sits on a
// private network this server can reach but the browser can't.
app.get('/api/generate-video/:jobId/file', async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${VIDEO_SERVICE_URL}/api/video/jobs/${req.params.jobId}/video`);

    if (!upstream.ok || !upstream.body) {
      let detail = 'Video is not ready yet.';
      try {
        const errJson = await upstream.json();
        detail = errJson?.detail || errJson?.error || detail;
      } catch {
        // ignore - body may not be JSON
      }
      return res.status(upstream.status || 502).json({ error: detail });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="lecture-${req.params.jobId}.mp4"`);

    const body: any = upstream.body;
    if (typeof body.getReader === 'function') {
      // Node 18+ global fetch (undici) exposes a WHATWG ReadableStream.
      const reader = body.getReader();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      // Fallback in case a polyfill exposes a classic Node stream instead.
      body.pipe(res);
    }
  } catch (error: any) {
    console.error('Error streaming rendered video:', error);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Could not reach the video rendering service.' });
    } else {
      res.end();
    }
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teacher Lecture Video Generator server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
