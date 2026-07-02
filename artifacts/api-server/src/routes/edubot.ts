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
  const systemPrompt = SOLVE_PROMPTS[level] ?? SOLVE_PROMPTS.developing;
  const chapterClause = chapter
    ? ` Focus specifically on CBSE Chapter: ${chapter}.`
    : "";
  const isHindi = language === "hi" || subject === "Hindi";
  console.log("SUBJECT:", subject, "LANGUAGE:", language, "ISHINDI:", isHindi);
  const langClause = isHindi
    ? " IMPORTANT: Respond ENTIRELY in Hindi using Devanagari script — this includes the solution, every step, and the memory trick. Do not use any English words except for proper nouns or technical terms with no Hindi equivalent."
    : "";
  const challengeField =
    level === "advanced"
      ? `, "challengeQuestion": "a deeper challenge question to push thinking further"`
      : "";
  const trimmedQuestion = question.slice(0, 800);
  const markMatch = trimmedQuestion.match(/\b(\d)\s*[-\u2013]?\s*marks?\b/i);
  const marks = markMatch ? parseInt(markMatch[1]) : null;
  const stepsCount = marks ? Math.max(marks, 3) : 4;
  const depthClause = marks
    ? ` This is a ${marks}-mark CBSE question — write exactly ${stepsCount} detailed steps, each 2-3 sentences with full explanation as expected in a board exam answer.`
    : ` Write 4 clear steps, each 1-2 sentences.`;
  try {
    const text = await ask(
      `${systemPrompt}${chapterClause}${langClause}${depthClause}\nClass ${classNum} ${subject} question: ${trimmedQuestion}\nReturn ONLY valid JSON: {"solution": "one-line summary of the answer", "steps": ["detailed step 1", "detailed step 2", "..."], "memoryTrick": "a short fun trick to remember this concept"${challengeField}}`,
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
  const { classNum, subject, chapter, level } = req.body as Record<
    string,
    string
  >;
  if (!classNum || !subject) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const chapterCtx = chapter ? `Chapter: ${chapter}` : "";
  const practicePrompts: Record<string, string> = {
    beginner: `Generate 3 CBSE Class ${classNum} ${subject} ${chapterCtx} practice questions. The student is a beginner (scored below 40%). All 3 questions must be easy, direct, and straightforward. Focus on basic definitions, simple recall, and one-step problems. Return ONLY valid JSON: {"questions":[{"question":"...","difficulty":"Easy"}]}`,
    developing: `Generate 3 CBSE Class ${classNum} ${subject} ${chapterCtx} practice questions. The student is developing (scored 40-65%). Give 2 easy questions and 1 medium question. Return ONLY valid JSON: {"questions":[{"question":"...","difficulty":"Easy|Medium"}]}`,
    proficient: `Generate 3 CBSE Class ${classNum} ${subject} ${chapterCtx} practice questions. The student is proficient (scored 65-85%). Give 1 easy, 1 medium, and 1 hard question. Return ONLY valid JSON: {"questions":[{"question":"...","difficulty":"Easy|Medium|Hard"}]}`,
    advanced: `Generate 3 CBSE Class ${classNum} ${subject} ${chapterCtx} practice questions. The student is advanced (scored above 85%). Give 1 medium and 2 hard questions. Include at least one HOTS (Higher Order Thinking Skills) question. Return ONLY valid JSON: {"questions":[{"question":"...","difficulty":"Medium|Hard"}]}`,
  };
  const prompt = practicePrompts[level] ?? practicePrompts.developing;
  try {
    const text = await ask(prompt);
    const parsed = safeJson(text) as { questions?: unknown[] } | null;
    if (parsed?.questions) {
      res.json(parsed);
    } else {
      res.json({
        questions: [
          {
            question: `Explain an important concept from Class ${classNum} ${subject}${chapter ? ` - ${chapter}` : ""}.`,
            difficulty: "Medium",
          },
          {
            question: `Solve a problem from Class ${classNum} ${subject}${chapter ? ` - ${chapter}` : ""}.`,
            difficulty: "Medium",
          },
          {
            question: `Give an example from Class ${classNum} ${subject}${chapter ? ` - ${chapter}` : ""}.`,
            difficulty: "Easy",
          },
        ],
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
  const { classNum, subject, chapter, level } = req.body as Record<
    string,
    string
  >;
  if (!classNum || !subject) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const chapterClause = chapter
    ? ` from CBSE Class ${classNum} ${subject} Chapter: ${chapter}`
    : ` for Class ${classNum} ${subject}`;
  const diffHints: Record<string, string> = {
    beginner:
      "Generate 5 EASY MCQ questions. Use simple language and straightforward options. Focus on basic recall and definitions.",
    developing: "Generate 5 MCQ questions (3 easy, 2 medium).",
    proficient: "Generate 5 MCQ questions (2 easy, 2 medium, 1 hard).",
    advanced:
      "Generate 5 MCQ questions (1 medium, 3 hard, 1 HOTS — Higher Order Thinking Skills). Make the hard questions application-based.",
  };
  const diffHint = diffHints[level] ?? diffHints.developing;
  try {
    const text = await ask(
      `${diffHint}${chapterClause}. Important: All 5 questions must be completely different from each other — no repeated topics or similar phrasing. Return ONLY valid JSON: {"questions":[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A"}]}`,
    );
    const parsed = safeJson(text) as { questions?: unknown[] } | null;
    if (parsed?.questions && (parsed.questions as unknown[]).length > 0) {
      res.json(parsed);
    } else {
      res.json({
        questions: [
          {
            question: `Which is a key concept in Class ${classNum} ${subject}${chapter ? ` - ${chapter}` : ""}?`,
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
  } = req.body as {
    subjectTotals?: Record<string, number>;
    totalQuestions?: number;
    totalXP?: number;
    activeDays?: number;
    daysSoFar?: number;
    level?: string;
    classNum?: string;
  };

  const totals = subjectTotals ?? {};
  const subjectLines = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([s, c]) => `${s}: ${c} question${c === 1 ? "" : "s"}`)
    .join(", ");

  if (!totalQuestions || totalQuestions === 0) {
    res.json({
      summary:
        "No questions solved or practiced yet this week — nothing to analyze. Solve or practice a few questions and check back!",
      strengths: [],
      weakAreas: [],
      tips: [
        "Try the Solve page for a quick question, or start today's Daily Practice to begin building your weekly stats.",
      ],
    });
    return;
  }

  try {
    const text = await ask(
      `You are Stasis, an encouraging CBSE tutor. A Class ${classNum ?? "10"} student (learning level: ${level ?? "developing"}) had this activity in the current week so far:
- Days active: ${activeDays ?? 0} out of ${daysSoFar ?? 1} days so far this week
- Total questions solved/practiced: ${totalQuestions}
- Total XP earned: ${totalXP ?? 0}
- Subject breakdown: ${subjectLines || "none"}

Write a short, encouraging weekly analysis for this student. Return ONLY valid JSON in this exact shape:
{"summary": "2-3 sentence friendly overview of their week", "strengths": ["1-3 short strength points based on the data, e.g. consistency or a strong subject"], "weakAreas": ["1-3 short points on subjects neglected or low activity, be gentle and specific"], "tips": ["2-3 short, concrete, actionable tips for next week"]}
Keep every string under 20 words. Do not invent subjects or numbers not present in the data above.`,
      700,
    );
    const parsed = safeJson(text) as {
      summary?: string;
      strengths?: string[];
      weakAreas?: string[];
      tips?: string[];
    } | null;
    if (parsed && (parsed.summary || parsed.strengths || parsed.tips)) {
      res.json(parsed);
    } else {
      res.json({
        summary: text.slice(0, 400),
        strengths: [],
        weakAreas: [],
        tips: [],
      });
    }
  } catch (e) {
    req.log.error({ err: e }, "weekly-analysis error");
    res.status(500).json({ error: "AI error" });
  }
});

export default router;
