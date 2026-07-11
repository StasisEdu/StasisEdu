import { Router, type IRouter } from "express";
import Groq from "groq-sdk";

const router: IRouter = Router();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function safeJson(text: string): unknown {
  try {
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function ask(prompt: string, maxTokens = 1600): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
  });
  return response.choices[0].message.content ?? "";
}

const SOLVE_PROMPTS: Record<string, string> = {
  beginner:
    "You are Stasis. This student scored below 40% in their last exam and needs extra support. Explain in very simple language like you are talking to a beginner. Use relatable real-life examples. Avoid complex terms — if you must use them, explain them immediately. Break every step into the smallest possible parts. Be very encouraging and patient. Adapt your response length to the question's marks — for 1-2 mark questions keep it brief (2-3 steps), for 3-5 mark questions give detailed steps (3-6 steps). Each step should be a complete, exam-ready answer point.",
  developing:
    "You are Stasis. This student scored between 40-65% and is building their understanding. Explain clearly with moderate detail. Use some examples. Make sure each step is well explained. Gently introduce proper terminology with brief explanations. Be encouraging. Adapt your response length to the question's marks — for 1-2 mark questions keep it brief (2-3 steps), for 3-5 mark questions give detailed steps (3-6 steps). Each step should be a complete, exam-ready answer point.",
  proficient:
    "You are Stasis. This student scored between 65-85% and has good understanding. Give detailed explanations with proper terminology. Show full working. Connect concepts to related topics. Challenge them to think deeper. Adapt your response length to the question's marks — for 1-2 mark questions keep it brief (2-3 steps), for 3-5 mark questions give detailed steps (3-6 steps). Each step should be a complete, exam-ready answer point.",
  advanced:
    "You are Stasis. This student scored above 85% and is a high achiever. Give concise but complete explanations. Use proper academic terminology. Include deeper insights, exceptions, and connections to higher concepts. Add a challenge question at the end to push their thinking further. Adapt your response length to the question's marks — for 1-2 mark questions keep it brief (2-3 steps), for 3-5 mark questions give detailed steps (3-6 steps). Each step should be a complete, exam-ready answer point.",
};

router.post("/solve", async (req, res) => {
  const { question, subject, classNum, chapter, level, language } =
    req.body as Record<string, string>;
  if (!question || !subject || !classNum) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  // Gibberish / invalid input detection
  const trimmedQ = question.trim().slice(0, 800);
  const letters = (trimmedQ.match(/[a-zA-Z\u0900-\u097F]/g) || []).length;
  const vowels = (
    trimmedQ.match(/[aeiouAEIOU\u0905-\u090F\u0910\u0913-\u0914]/g) || []
  ).length;
  const vowelRatio = letters > 0 ? vowels / letters : 0;
  const hasNoSpace = !trimmedQ.includes(" ");
  const totalNonSpace = trimmedQ.replace(/\s/g, "").length;
  const looksGibberish =
    totalNonSpace > 4 &&
    ((vowelRatio < 0.08 && letters > 5) ||
      (hasNoSpace && totalNonSpace > 10 && vowelRatio < 0.18));
  if (looksGibberish) {
    res.json({
      solution: "Hmm, that doesn't look like a valid question!",
      steps: [
        "It looks like you may have mistyped or entered random characters.",
        `Please type a proper question related to ${subject}${chapter ? " — " + chapter : ""}.`,
        'For example: "What is the law of conservation of energy?" or "Explain the water cycle."',
      ],
      memoryTrick:
        "💡 Tip: Type a clear question or keyword and I'll explain it step by step!",
    });
    return;
  }

  const systemPrompt = SOLVE_PROMPTS[level] ?? SOLVE_PROMPTS.developing;
  const chapterClause = chapter
    ? ` Focus specifically on CBSE Chapter: ${chapter}.`
    : "";
  const isHindi = language === "hi" || subject === "Hindi";
  const langClause = isHindi
    ? " IMPORTANT: Respond ENTIRELY in Hindi using Devanagari script — this includes the solution, every step, and the memory trick. Do not use any English words except for proper nouns or technical terms with no Hindi equivalent."
    : "";
  const challengeField =
    level === "advanced"
      ? `, "challengeQuestion": "a deeper challenge question to push thinking further"`
      : "";
  const markMatch = trimmedQ.match(/\b(\d)\s*[-\u2013]?\s*marks?\b/i);
  const marks = markMatch ? parseInt(markMatch[1]) : null;
  const stepsCount = marks ? Math.max(marks, 3) : 4;
  const depthClause = marks
    ? ` This is a ${marks}-mark CBSE question — write exactly ${stepsCount} detailed steps, each 2-3 sentences with full explanation as expected in a board exam answer.`
    : ` Write 4 clear steps, each 1-2 sentences.`;
  const invalidClause = ` IMPORTANT: If the question is random gibberish, not in English/Hindi, or completely unrelated to ${subject}, respond with: {"solution":"Please ask a valid ${subject} question.","steps":["That doesn't seem to be a ${subject} question.","Try asking about a concept, formula, or topic from your chapter.","Example: What is photosynthesis? or Solve 2x+3=7."],"memoryTrick":""}`;
  try {
    const text = await ask(
      `${systemPrompt}${chapterClause}${langClause}${depthClause}${invalidClause}\nClass ${classNum} ${subject} question: ${trimmedQ}\nReturn ONLY valid JSON: {"solution": "one-line summary of the answer", "steps": ["detailed step 1", "detailed step 2", "..."], "memoryTrick": "a short fun trick to remember this concept"${challengeField}}`,
      1600,
    );
    const parsed = safeJson(text) as {
      solution?: string;
      steps?: string[];
      memoryTrick?: string;
    } | null;
    if (parsed && (parsed.solution || parsed.steps)) {
      res.json(parsed);
    } else {
      res.json({
        solution: text,
        steps: text
          .split("\n")
          .filter((l) => l.trim())
          .slice(0, 10),
        memoryTrick: "",
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "solve error");
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/solve-image", async (req, res) => {
  const { imageBase64, mimeType, classNum, subject, chapter, level, language } =
    req.body as Record<string, string>;
  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "Missing image data" });
    return;
  }
  const systemPrompt = SOLVE_PROMPTS[level] ?? SOLVE_PROMPTS.developing;
  const chapterClause = chapter
    ? ` Focus specifically on CBSE Chapter: ${chapter}.`
    : "";
  const langClause =
    language === "hi"
      ? " Respond in Hindi (Devanagari script)."
      : " Respond in English.";
  const challengeField =
    level === "advanced"
      ? `, "challengeQuestion": "a deeper challenge question to push thinking further"`
      : "";
  try {
    const visionResponse = await client.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: "text",
              text: "Read this image carefully and extract the exact question text. Return ONLY the question text, nothing else.",
            },
          ],
        },
      ],
    });
    const extractedQuestion = visionResponse.choices[0].message.content ?? "";

    const markMatch = extractedQuestion.match(
      /\b(\d)\s*[-\u2013]?\s*marks?\b/i,
    );
    const marks = markMatch ? parseInt(markMatch[1]) : null;
    const stepsCount = marks ? Math.max(marks, 3) : 4;
    const depthClause = marks
      ? ` This is a ${marks}-mark CBSE question — write exactly ${stepsCount} detailed steps, each 2-3 sentences with full explanation as expected in a board exam answer.`
      : ` Write 4 clear detailed steps, each 2-3 sentences long.`;
    const text = await ask(
      `${systemPrompt}${chapterClause}${langClause}${depthClause}
Class ${classNum ?? "?"} ${subject ?? "CBSE"} question from photo: ${extractedQuestion}

CRITICAL RULES:
- Give ACTUAL ANSWERS directly, not instructions.
- Each step must be a direct factual answer.
- Do NOT say "identify", "recall", "find out" or restate the question.

Return ONLY valid JSON: {"solution": "direct one-line answer", "steps": ["detailed answer step 1", "detailed answer step 2", "..."], "memoryTrick": "a short fun trick to remember this"${challengeField}}`,
      1600,
    );
    const parsed = safeJson(text) as {
      solution?: string;
      steps?: string[];
      memoryTrick?: string;
    } | null;
    if (parsed && (parsed.solution || parsed.steps)) {
      res.json(parsed);
    } else {
      res.json({
        solution: text,
        steps: text
          .split("\n")
          .filter((l) => l.trim())
          .slice(0, 10),
        memoryTrick: "",
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "solve-image error");
    res.status(500).json({ error: "AI vision error" });
  }
});

router.post("/practice", async (req, res) => {
  const { classNum, subject, chapter, level, difficulty, count } =
    req.body as Record<string, string>;
  if (!classNum || !subject) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const qCount = Math.min(parseInt(count as string) || 3, 10);
  const chapterCtx = chapter ? `Chapter: ${chapter}` : "";

  // Difficulty chosen by user takes full priority
  const diffMap: Record<string, string> = {
    easy: `ALL ${qCount} questions must be EASY — basic recall, direct definitions, single-step. Simple vocabulary. No tricks.`,
    hard: `ALL ${qCount} questions must be HARD — application-based, multi-step reasoning, tricky distractors. Exam-level difficulty.`,
    "very hard": `ALL ${qCount} questions must be VERY HARD — HOTS level, higher-order thinking, analysis, evaluation, complex scenarios. Board exam challenge level.`,
    medium: `Generate ${qCount} questions with balanced difficulty — mix of easy and medium.`,
  };
  const diffInstruction = diffMap[difficulty] || diffMap.easy;

  const prompt = `Generate exactly ${qCount} CBSE Class ${classNum} ${subject} ${chapterCtx} practice questions.
DIFFICULTY RULE: ${diffInstruction}
Return ONLY valid JSON (no markdown): {"questions":[{"question":"...","difficulty":"Easy|Medium|Hard"}]}
All questions must be from the specified chapter only. No repeated topics.`;

  try {
    const text = await ask(prompt);
    const parsed = safeJson(text) as { questions?: unknown[] } | null;
    if (parsed?.questions) {
      res.json(parsed);
    } else {
      res.json({
        questions: Array(qCount)
          .fill(null)
          .map((_, i) => ({
            question: `Class ${classNum} ${subject}${chapter ? ` - ${chapter}` : ""} question ${i + 1}.`,
            difficulty: difficulty || "Easy",
          })),
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "practice error");
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/check", async (req, res) => {
  const { question, userAnswer, subject, classNum, chapter } =
    req.body as Record<string, string>;
  if (!question || !userAnswer) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const ctx = [classNum, subject, chapter].filter(Boolean).join(" ");
  try {
    const text = await ask(
      `A ${ctx} student was asked: "${question}". They answered: "${userAnswer}".

Evaluate their answer using these rules:
1. Accept "1 by 3", "2 by 5", "X by Y" as correct fraction notation equivalent to 1/3, 2/5, X/Y.
2. If the answer is mathematically correct but not in simplified form (e.g. 2/4 instead of 1/2), mark correct:true but say in feedback: "Correct! Next time, remember to simplify your fraction. [unsimplified] = [simplified]."
3. If the answer is mathematically correct and fully simplified, mark correct:true and praise them briefly.
4. Judge mathematical correctness only — not exact wording or format.

Return ONLY valid JSON: {"correct":true,"feedback":"clear and friendly explanation"}`,
    );
    const parsed = safeJson(text) as {
      correct?: boolean;
      feedback?: string;
    } | null;
    if (parsed && typeof parsed.correct === "boolean") {
      res.json(parsed);
    } else {
      res.json({
        correct: false,
        feedback: "Could not evaluate. Please review the topic and try again.",
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "check error");
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/hint", async (req, res) => {
  const { question, subject } = req.body as Record<string, string>;
  if (!question || !subject) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  try {
    const text = await ask(
      `Give one helpful hint for this ${subject} question without revealing the answer: "${question}". Return ONLY valid JSON: {"hint":"..."}`,
    );
    const parsed = safeJson(text) as { hint?: string } | null;
    res.json(
      parsed?.hint
        ? parsed
        : { hint: "Think about the key concepts from your textbook chapter." },
    );
  } catch (e) {
    req.log.error({ err: e }, "hint error");
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/quiz", async (req, res) => {
  const { classNum, subject, chapter, level, difficulty, count } =
    req.body as Record<string, string>;
  if (!classNum || !subject) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const qCount = Math.min(parseInt(count as string) || 5, 15);
  const chapterClause = chapter
    ? ` from CBSE Class ${classNum} ${subject} Chapter: ${chapter}`
    : ` for Class ${classNum} ${subject}`;
  const diffMap: Record<string, string> = {
    easy: `ALL ${qCount} MCQs must be EASY — basic recall, definitions, simple language, straightforward options. No tricks.`,
    hard: `ALL ${qCount} MCQs must be HARD — application-based, analytical, tricky distractors, exam difficulty.`,
    "very hard": `ALL ${qCount} MCQs must be VERY HARD — HOTS level, higher-order thinking, evaluation and analysis, board exam challenge.`,
  };
  const diffHint = diffMap[difficulty] || diffMap.easy;
  try {
    const text = await ask(
      `DIFFICULTY RULE: ${diffHint}\nGenerate ${qCount} MCQs${chapterClause}. All questions must be completely different — no repeated topics.\nReturn ONLY valid JSON: {"questions":[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A"}]}`,
    );
    const parsed = safeJson(text) as { questions?: unknown[] } | null;
    if (parsed?.questions && (parsed.questions as unknown[]).length > 0) {
      res.json(parsed);
    } else {
      res.json({
        questions: [
          {
            question: `Key concept in Class ${classNum} ${subject}${chapter ? ` - ${chapter}` : ""}?`,
            options: [
              "A. Concept A",
              "B. Concept B",
              "C. Concept C",
              "D. Concept D",
            ],
            answer: "A",
          },
        ],
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "quiz error");
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/scramble", async (req, res) => {
  const { classNum, subject, chapter } = req.body as Record<string, string>;
  if (!classNum || !subject) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const chapterClause = chapter
    ? ` from CBSE Class ${classNum} ${subject} Chapter: ${chapter}`
    : ` from Class ${classNum} ${subject} CBSE`;
  try {
    const text = await ask(
      `Give 5 single-word vocabulary or key terms${chapterClause}. Return ONLY a JSON array of 5 strings: ["word1","word2","word3","word4","word5"]`,
    );
    const parsed = safeJson(text);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      res.json({ words: parsed.slice(0, 5) });
    } else {
      const fallbacks: Record<string, string[]> = {
        Maths: ["algebra", "triangle", "fraction", "decimal", "polygon"],
        Physics: ["force", "gravity", "energy", "motion", "current"],
        Biology: ["nucleus", "tissue", "respiration", "ecosystem", "gene"],
        Chemistry: ["molecule", "reaction", "acid", "compound", "valency"],
        "Social Science": [
          "democracy",
          "agriculture",
          "latitude",
          "monsoon",
          "parliament",
        ],
        English: ["metaphor", "simile", "synonym", "antonym", "pronoun"],
        Economics: [
          "development",
          "globalisation",
          "credit",
          "sector",
          "consumer",
        ],
        Hindi: ["kavita", "sangya", "kriya", "visheshan", "rachna"],
      };
      res.json({
        words: fallbacks[subject] || [
          "knowledge",
          "learning",
          "practice",
          "student",
          "school",
        ],
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "scramble error");
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/mathchallenge", async (req, res) => {
  const { classNum, chapter } = req.body as Record<string, string>;
  if (!classNum) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const chapterClause = chapter ? ` related to Chapter: ${chapter}` : "";
  try {
    const text = await ask(
      `Generate 5 mental math problems for Class ${classNum} CBSE Maths${chapterClause}. Rules: (1) All fraction answers must be fully simplified — e.g. use 1/2 not 2/4. (2) All 5 problems must be different types. Return ONLY valid JSON: {"problems":[{"question":"12×13=?","answer":"156"}]}`,
    );
    const parsed = safeJson(text) as { problems?: unknown[] } | null;
    if (parsed?.problems && (parsed.problems as unknown[]).length > 0) {
      res.json(parsed);
    } else {
      res.json({
        problems: [
          { question: "15 × 8 = ?", answer: "120" },
          { question: "144 ÷ 12 = ?", answer: "12" },
          { question: "25² = ?", answer: "625" },
          { question: "√196 = ?", answer: "14" },
          { question: "18 × 7 = ?", answer: "126" },
        ],
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "mathchallenge error");
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/websearch", async (req, res) => {
  const { query, subject, classNum } = req.body as Record<string, string>;
  if (!query) {
    res.status(400).json({ error: "Missing query" });
    return;
  }
  const ctx = [classNum && `Class ${classNum}`, subject, "CBSE"]
    .filter(Boolean)
    .join(" ");
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `You are a creative CBSE study coach. A ${ctx} student wants to understand: "${query.slice(0, 400)}"\n\nGive 3–4 creative approaches to understand this topic:\n1. A simple story or analogy\n2. A memory trick or mnemonic\n3. A real-life example\n4. A step-by-step method\n\nBe concise, fun, and exam-focused. Use **bold** for key terms.`,
        },
      ],
    });
    const content = response.choices[0].message.content ?? "";
    res.json({ answer: content, sources: [] });
  } catch (e) {
    req.log.error({ err: e }, "websearch error");
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/samplepapers", async (_req, res) => {
  const papers = [
    {
      year: "2024–25",
      label: "Class 10 Sample Question Papers 2024–25",
      url: "https://www.google.com/search?q=CBSE+Class+10+Sample+Question+Paper+2024-25+site:cbseacademic.nic.in+filetype:pdf",
      subjects: ["Maths", "Science", "Social Science", "English", "Hindi"],
      tag: "Sample Paper",
    },
    {
      year: "2023–24",
      label: "Class 10 Sample Question Papers 2023–24",
      url: "https://www.google.com/search?q=CBSE+Class+10+Sample+Question+Paper+2023-24+site:cbseacademic.nic.in+filetype:pdf",
      subjects: ["Maths", "Science", "Social Science", "English", "Hindi"],
      tag: "Sample Paper",
    },
    {
      year: "Official Portal",
      label: "CBSE Academic – Official Website",
      url: "https://cbseacademic.nic.in/",
      subjects: ["All Subjects"],
      tag: "Sample Paper",
    },
    {
      year: "2024",
      label: "Class 10 Board Exam 2024 Question Papers",
      url: "https://www.google.com/search?q=CBSE+Class+10+Board+Exam+2024+Question+Paper+PDF",
      subjects: ["Maths", "Science", "Social Science", "English", "Hindi"],
      tag: "PYQ",
    },
    {
      year: "2023",
      label: "Class 10 Board Exam 2023 Question Papers",
      url: "https://www.google.com/search?q=CBSE+Class+10+Board+Exam+2023+Question+Paper+PDF",
      subjects: ["Maths", "Science", "Social Science", "English", "Hindi"],
      tag: "PYQ",
    },
    {
      year: "2022",
      label: "Class 10 Board Exam 2022 Question Papers",
      url: "https://www.google.com/search?q=CBSE+Class+10+Board+Exam+2022+Question+Paper+PDF",
      subjects: ["Maths", "Science", "Social Science", "English", "Hindi"],
      tag: "PYQ",
    },
    {
      year: "2019–2021",
      label: "Class 10 Previous Year Papers 2019–2021",
      url: "https://www.google.com/search?q=CBSE+Class+10+Previous+Year+Question+Papers+2019+2020+2021+PDF",
      subjects: ["All Subjects"],
      tag: "PYQ",
    },
    {
      year: "Marking Schemes",
      label: "Class 10 Marking Schemes & Answer Keys",
      url: "https://www.google.com/search?q=CBSE+Class+10+Marking+Scheme+2024+cbseacademic.nic.in+filetype:pdf",
      subjects: ["All Subjects"],
      tag: "Marking Scheme",
    },
  ];
  res.json({ papers });
});

router.post("/weekly-analysis", async (req, res) => {
  const {
    subjectTotals,
    totalQuestions,
    totalXP,
    activeDays,
    daysSoFar,
    level,
    classNum,
    streak,
    bestStreak,
    totalSolved,
    allTimeSubjects,
    classroomSessions,
  } = req.body as {
    subjectTotals?: Record<string, number>;
    totalQuestions?: number;
    totalXP?: number;
    activeDays?: number;
    daysSoFar?: number;
    level?: string;
    classNum?: string;
    streak?: number;
    bestStreak?: number;
    totalSolved?: number;
    allTimeSubjects?: Record<string, number>;
    classroomSessions?: {
      sessions: number;
      totalCorrect: number;
      totalWrong: number;
      totalTimedOut: number;
      avgRank: number;
      subjects: string[];
    } | null;
  };

  const totals = subjectTotals ?? {};
  const subjectLines = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([s, c]) => `${s}: ${c}q`)
    .join(", ");
  const allTimeLines = Object.entries(allTimeSubjects ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, c]) => `${s}: ${c}`)
    .join(", ");
  const neglectedSubjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ]
    .filter((s) => !totals[s] || totals[s] === 0)
    .slice(0, 4)
    .join(", ");
  const crBlock = classroomSessions
    ? `- Classroom sessions: ${classroomSessions.sessions} (${classroomSessions.subjects.join(", ")})\n- Correct/Wrong/Timed-out: ${classroomSessions.totalCorrect}/${classroomSessions.totalWrong}/${classroomSessions.totalTimedOut}\n- Avg rank: #${classroomSessions.avgRank}`
    : "- No classroom quiz sessions this week";

  if (!totalQuestions || totalQuestions === 0) {
    res.json({
      summary:
        "No questions solved yet this week. Start with Daily Practice or the Solve page!",
      strengths: [],
      weakAreas: [],
      tips: [
        "Try at least 5 questions today.",
        "Use Daily Practice for a quick 3-question session.",
        "Invite a friend to a Classroom quiz for extra XP.",
      ],
      classroomNote: null,
      focusSubject: null,
      motivationLine: "Every expert was once a beginner — start today!",
    });
    return;
  }

  try {
    const text = await ask(
      `You are Stasis, a detailed CBSE tutor AI. A Class ${classNum ?? "10"} student (level: ${level ?? "developing"}) stats this week:

WEEKLY: Days active: ${activeDays ?? 0}/${daysSoFar ?? 7}, Questions: ${totalQuestions}, XP: ${totalXP ?? 0}
Subject breakdown: ${subjectLines || "none"}
Not practiced this week: ${neglectedSubjects || "none"}
All-time top subjects: ${allTimeLines || "none"}
Streak: ${streak ?? 0} days current, ${bestStreak ?? 0} best. Total ever: ${totalSolved ?? 0}q

CLASSROOM QUIZ:
${crBlock}

Return ONLY valid JSON:
{"summary":"3-4 sentence overview with specific subjects and numbers","strengths":["3-4 specific points with subject names/numbers"],"weakAreas":["2-3 gentle specific points on missed subjects"],"tips":["3-4 concrete actionable tips for next week"],"classroomNote":"1-2 sentences on classroom performance or null","focusSubject":"one subject to focus next week","motivationLine":"one punchy motivational line"}
Max 30 words per string. Use actual numbers and subject names from the data.`,
      950,
    );
    const parsed = safeJson(text) as Record<string, unknown> | null;
    if (parsed && (parsed.summary || parsed.strengths)) {
      res.json(parsed);
    } else {
      res.json({
        summary: text.slice(0, 400),
        strengths: [],
        weakAreas: [],
        tips: [],
        classroomNote: null,
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "weekly-analysis error");
    res.status(500).json({ error: "AI error" });
  }
});

// ── Nova Chatbot ─────────────────────────────────────────────────────────────
router.post("/chatbot", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history: Array<{ role: string; content: string }>;
  };
  if (!message) {
    res.status(400).json({ error: "Missing message" });
    return;
  }

  const system = `You are Nova, a smart casual AI assistant embedded in Stasis (a CBSE study app for Classes 6-10). You handle general knowledge, coding, science, current events, opinions, trivia, and everyday questions. You are NOT Stasis (the edu-bot) — that is a separate AI. Give complete, detailed answers — never cut short. Use markdown: headers, bold, bullet points, code blocks where relevant. Never say which model powers you.`;

  try {
    const msgs = (history as Array<{ role: string; content: string }>)
      .slice(-20)
      .map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      }));

    msgs.push({ role: "user", content: message });

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: system }, ...msgs],
      max_tokens: 2000,
    });

    const reply =
      response.choices[0].message.content ?? "Sorry, I couldn't process that.";
    res.json({ reply });
  } catch (e) {
    req.log.error({ err: e }, "nova-chatbot error");
    res.status(500).json({ error: "AI error" });
  }
});

// ============================================================
// CLASSROOM — in-memory multiplayer quiz rooms
// ============================================================
interface RoomPlayer {
  name: string;
  score: number;
  answers: Record<number, string>;
  joinedAt: number;
  done: boolean;
  personalQuestions?: { q: string; options: string[]; answer: string }[];
}
interface ClassroomRoom {
  code: string;
  host: string;
  subject: string;
  chapter: string;
  classNum: string;
  status: "waiting" | "active" | "finished";
  questions: { q: string; options: string[]; answer: string }[];
  players: Record<string, RoomPlayer>; // playerId -> player
  createdAt: number;
  startedAt?: number;
}
const ROOMS: Record<string, ClassroomRoom> = {};

// Prune old rooms every 10 min
setInterval(
  () => {
    const now = Date.now();
    for (const code of Object.keys(ROOMS)) {
      if (now - ROOMS[code].createdAt > 60 * 60 * 1000) delete ROOMS[code];
    }
  },
  10 * 60 * 1000,
);

function makeCode(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

// POST /api/classroom/create
router.post("/classroom/create", async (req, res) => {
  const { hostName, subject, chapter, classNum } = req.body as Record<
    string,
    string
  >;
  if (!hostName || !subject || !chapter || !classNum) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  let code = makeCode();
  while (ROOMS[code]) code = makeCode();
  const playerId = "p_" + Date.now() + Math.random().toString(36).slice(2, 5);
  ROOMS[code] = {
    code,
    host: playerId,
    subject,
    chapter,
    classNum,
    status: "waiting",
    questions: [],
    players: {
      [playerId]: {
        name: hostName,
        score: 0,
        answers: {},
        joinedAt: Date.now(),
        done: false,
      },
    },
    createdAt: Date.now(),
  };
  res.json({ code, playerId });
});

// POST /api/classroom/join
router.post("/classroom/join", (req, res) => {
  const { code, playerName } = req.body as Record<string, string>;
  const room = ROOMS[code?.toUpperCase()];
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.status !== "waiting") {
    res.status(400).json({ error: "Game already started" });
    return;
  }
  if (Object.keys(room.players).length >= 8) {
    res.status(400).json({ error: "Room full" });
    return;
  }
  const playerId = "p_" + Date.now() + Math.random().toString(36).slice(2, 5);
  room.players[playerId] = {
    name: playerName,
    score: 0,
    answers: {},
    joinedAt: Date.now(),
    done: false,
  };
  res.json({
    code: room.code,
    playerId,
    subject: room.subject,
    chapter: room.chapter,
    classNum: room.classNum,
  });
});

// POST /api/classroom/start — host starts, questions generated per player's level
router.post("/classroom/start", async (req, res) => {
  const { code, playerId, playerLevels, difficulty, count } = req.body as {
    code: string;
    playerId: string;
    playerLevels?: Record<string, string>;
    difficulty?: string;
    count?: number;
  };
  const room = ROOMS[code];
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.host !== playerId) {
    res.status(403).json({ error: "Only host can start" });
    return;
  }
  if (room.status !== "waiting") {
    res.status(400).json({ error: "Already started" });
    return;
  }
  try {
    const qCount = Math.min(count || 5, 10);
    const diff = difficulty || "easy";
    const diffDesc =
      diff === "easy"
        ? "straightforward basic recall, simple vocabulary"
        : diff === "hard"
          ? "challenging application questions, tricky options"
          : "very hard, higher-order thinking, conceptual and analytical";
    const masterPrompt = `Generate exactly ${qCount} multiple choice questions for CBSE Class ${room.classNum} ${room.subject}, chapter: "${room.chapter}". Difficulty: ${diffDesc}.
Return ONLY a JSON array (no markdown): [{"q":"...","options":["A","B","C","D"],"answer":"exact correct option text"}]`;
    const masterRaw = await ask(masterPrompt, 2000);
    const masterQs = safeJson(masterRaw) as
      | { q: string; options: string[]; answer: string }[]
      | null;
    if (!Array.isArray(masterQs) || masterQs.length < Math.min(3, qCount)) {
      res
        .status(500)
        .json({ error: "Failed to generate questions, try again" });
      return;
    }
    room.questions = masterQs.slice(0, qCount);

    // Generate personalised questions for each player based on their level
    if (playerLevels && Object.keys(playerLevels).length > 0) {
      const levelMap: Record<string, string> = {
        beginner: "very simple, basic recall questions, easy vocabulary",
        developing: "moderate difficulty, some application questions",
        proficient: "challenging questions with application and analysis",
        advanced: "hard, conceptual and higher-order thinking questions",
      };
      for (const [pid, level] of Object.entries(playerLevels)) {
        if (!room.players[pid]) continue;
        const diff = levelMap[level] || levelMap.developing;
        const lvlPrompt = `Generate exactly ${qCount} CBSE Class ${room.classNum} ${room.subject} MCQs for chapter "${room.chapter}". Difficulty: ${diff} — ${levelMap[level] || levelMap.developing}.
Return ONLY JSON array: [{"q":"...","options":["A","B","C","D"],"answer":"exact correct option text"}]`;
        try {
          const raw = await ask(lvlPrompt, 2000);
          const qs = safeJson(raw) as
            | { q: string; options: string[]; answer: string }[]
            | null;
          if (Array.isArray(qs) && qs.length >= Math.min(3, qCount)) {
            room.players[pid].personalQuestions = qs.slice(0, qCount);
          }
        } catch {
          /* fallback to master */
        }
      }
    }

    room.status = "active";
    room.startedAt = Date.now();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "AI error generating questions" });
  }
});

// POST /api/classroom/poll — get current room state
router.post("/classroom/poll", (req, res) => {
  const { code, playerId } = req.body as Record<string, string>;
  const room = ROOMS[code];
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  const me = room.players[playerId];
  // Use personal questions if available, else master
  const myQs =
    me?.personalQuestions && me.personalQuestions.length > 0
      ? me.personalQuestions
      : room.questions;
  // Always send full questions including answers — client already sees their own answers via _crAnswered
  const safeQuestions = myQs;
  const leaderboard = Object.entries(room.players)
    .map(([id, p]) => ({ id, name: p.name, score: p.score, done: p.done }))
    .sort((a, b) => b.score - a.score);
  res.json({
    status: room.status,
    questions: safeQuestions,
    players: leaderboard,
    myAnswers: me?.answers ?? {},
    isHost: room.host === playerId,
    totalPlayers: Object.keys(room.players).length,
    subject: room.subject,
    chapter: room.chapter,
  });
});

// POST /api/classroom/answer — submit an answer
router.post("/classroom/answer", (req, res) => {
  const { code, playerId, qIndex, chosen } = req.body as {
    code: string;
    playerId: string;
    qIndex: number;
    chosen: string;
  };
  const room = ROOMS[code];
  if (!room || room.status !== "active") {
    res.status(400).json({ error: "Invalid" });
    return;
  }
  const player = room.players[playerId];
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  if (player.answers[qIndex] !== undefined) {
    res.json({ ok: true, already: true });
    return;
  } // no re-answering
  player.answers[qIndex] = chosen;
  const correct = room.questions[qIndex]?.answer === chosen;
  if (correct) player.score += 10;
  // Check if player finished all questions
  if (Object.keys(player.answers).length >= room.questions.length)
    player.done = true;
  // Check if ALL players done → finish room
  const allDone = Object.values(room.players).every((p) => p.done);
  if (allDone) {
    room.status = "finished";
    // Now reveal answers in questions
  }
  res.json({ ok: true, correct, score: player.score });
});

// POST /api/classroom/finish-reveal — called after room finishes to get answers
router.post("/classroom/finish-reveal", (req, res) => {
  const { code } = req.body as { code: string };
  const room = ROOMS[code];
  if (!room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (room.status !== "finished") {
    res.status(400).json({ error: "Not finished" });
    return;
  }
  res.json({ questions: room.questions });
});

export default router;
