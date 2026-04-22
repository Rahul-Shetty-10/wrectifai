import questionBank from '@/data/diagnosis-question-bank.json';

type DiagnosisCategory = 'engine' | 'battery' | 'brake' | 'ac' | 'electrical' | 'tyre' | 'other';
type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type QuestionItem = {
  id: string;
  label: string;
  type: 'single_select' | 'boolean' | 'text';
  options?: string[];
  required: boolean;
};

type ClassifyRequest = {
  mode: 'classify';
  issue: string;
};

type SummarizeRequest = {
  mode: 'summarize';
  issue: string;
  category: DiagnosisCategory;
  answers: Record<string, string>;
};

type DiagnosisRequest = ClassifyRequest | SummarizeRequest;

const KNOWN_CATEGORIES: DiagnosisCategory[] = [
  'engine',
  'battery',
  'brake',
  'ac',
  'electrical',
  'tyre',
  'other',
];

const CATEGORY_DESCRIPTIONS: Record<DiagnosisCategory, string> = {
  engine: 'Engine performance, smoke, overheating, rpm, knocking, misfire',
  battery: 'Battery, starting failure, cranking, ignition power',
  brake: 'Brake response, pads, discs, braking noise/vibration',
  ac: 'Air conditioning cooling, vents, compressor behavior',
  electrical: 'Headlights, wiring, windows, fuses, indicators, electronics',
  tyre: 'Tyre/tire puncture, pressure loss, wheel and alignment',
  other: 'Issues that do not clearly match the above categories',
};

function parseJsonObject<T>(text: string): T | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function normalizeCategory(raw: string | undefined): DiagnosisCategory {
  const lower = (raw ?? '').toLowerCase().trim();
  if (KNOWN_CATEGORIES.includes(lower as DiagnosisCategory)) {
    return lower as DiagnosisCategory;
  }
  return 'other';
}

function heuristicCategory(issue: string): DiagnosisCategory {
  const lower = issue.toLowerCase();
  if (/\b(brake|braking|pad|disc|rotor)\b/.test(lower)) return 'brake';
  if (/\b(battery|start|starter|crank|ignition)\b/.test(lower)) return 'battery';
  if (/\b(ac|air ?condition|cooling|compressor|vent)\b/.test(lower)) return 'ac';
  if (/\b(tyre|tire|puncture|wheel|alignment)\b/.test(lower)) return 'tyre';
  if (/\b(headlight|electrical|window|fuse|wiring|indicator)\b/.test(lower)) return 'electrical';
  if (/\b(engine|misfire|smoke|rpm|overheat|knock)\b/.test(lower)) return 'engine';
  return 'other';
}

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? '').join('\n').trim();
  return text || null;
}

async function classifyIssue(issue: string) {
  const categoryGuide = KNOWN_CATEGORIES.map(
    (category) => `- ${category}: ${CATEGORY_DESCRIPTIONS[category]}`
  ).join('\n');
  const masterPrompt = [
    'MASTER PROMPT: CATEGORY MAPPING',
    'Task: Map the user issue to one and only one category from the allowed categories.',
    'Rules:',
    '1) User input may contain typos; infer intent robustly.',
    '2) If explicit subsystem wording exists (example: engine, battery, brake, ac, electrical, tyre), prefer that category.',
    '3) Never invent a new category. Must return one of the allowed categories only.',
    'Allowed categories:',
    categoryGuide,
    'Return strict JSON only:',
    '{"category":"engine|battery|brake|ac|electrical|tyre|other","confidence":0-1,"reason":"short reason"}',
    `User issue: ${issue}`,
  ].join('\n');

  const raw = await callGemini(masterPrompt);
  const parsed = raw
    ? parseJsonObject<{
        category?: string;
        confidence?: number;
        reason?: string;
      }>(raw)
    : null;

  const fallbackCategory = heuristicCategory(issue);
  const parsedCategory = parsed?.category ? normalizeCategory(parsed.category) : null;
  const parsedConfidence =
    typeof parsed?.confidence === 'number' && Number.isFinite(parsed.confidence)
      ? Math.max(0, Math.min(1, parsed.confidence))
      : null;

  let category: DiagnosisCategory;
  if (!parsedCategory) {
    category = fallbackCategory;
  } else if (parsedCategory === 'other' && fallbackCategory !== 'other') {
    // Guardrail: explicit keyword-based category should beat weak "other" responses.
    category = fallbackCategory;
  } else {
    category = parsedCategory;
  }

  const confidence =
    parsedConfidence !== null
      ? category === fallbackCategory && parsedCategory === 'other' && fallbackCategory !== 'other'
        ? Math.max(parsedConfidence, 0.8)
        : parsedConfidence
      : category === fallbackCategory
      ? 0.75
      : 0.6;
  const reason =
    parsed?.reason?.trim() ||
    `Mapped by symptom keywords to ${category}.`;

  return { category, confidence, reason };
}

async function summarizeIssue(
  issue: string,
  category: DiagnosisCategory,
  answers: Record<string, string>
) {
  const categoryQuestions =
    ((questionBank as Record<string, QuestionItem[]>)[category] ?? []).map((question) => ({
      id: question.id,
      label: question.label,
      answer: answers[question.id] ?? '',
      required: question.required,
    })) ?? [];

  const masterPrompt = [
    'MASTER PROMPT: FINAL AUTOMOTIVE DIAGNOSIS',
    'You are an automotive diagnostic assistant.',
    'Analyze the user issue and full questionnaire answers.',
    'Provide practical, safety-first output.',
    'Return strict JSON only with keys:',
    '{"summary":"...", "probableProblem":"...", "severity":"LOW|MEDIUM|HIGH|CRITICAL", "risk":"...", "diySteps":["..."], "likelyCauses":["..."], "recommendedActions":["..."], "serviceSuggestion":"...", "estimatedCostRange":"..."}',
    `Original issue: ${issue}`,
    `Mapped category: ${category}`,
    `Category Q&A pairs: ${JSON.stringify(categoryQuestions)}`,
    `Raw answers object: ${JSON.stringify(answers)}`,
  ].join('\n');

  const raw = await callGemini(masterPrompt);
  const parsed = raw
    ? parseJsonObject<{
        summary?: string;
        probableProblem?: string;
        severity?: string;
        risk?: string;
        diySteps?: string[];
        likelyCauses?: string[];
        recommendedActions?: string[];
        serviceSuggestion?: string;
        estimatedCostRange?: string;
      }>(raw)
    : null;

  const severityRaw = (parsed?.severity ?? 'MEDIUM').toUpperCase();
  const severity: SeverityLevel =
    severityRaw === 'LOW' || severityRaw === 'MEDIUM' || severityRaw === 'HIGH' || severityRaw === 'CRITICAL'
      ? severityRaw
      : 'MEDIUM';

  return {
    summary: parsed?.summary?.trim() || `Initial diagnosis suggests a ${category} related issue.`,
    probableProblem:
      parsed?.probableProblem?.trim() || `Likely ${category} system malfunction that requires inspection.`,
    severity,
    risk: parsed?.risk?.trim() || 'Further inspection required to avoid escalation.',
    diySteps:
      parsed?.diySteps?.map((item) => item.trim()).filter(Boolean).slice(0, 6) || [
        'Park safely and switch off engine.',
        'Check visible warning signs and fluid leakage.',
        'Avoid driving aggressively until inspection.',
      ],
    likelyCauses:
      parsed?.likelyCauses?.map((item) => item.trim()).filter(Boolean).slice(0, 4) ||
      ['Component wear', 'Electrical/mechanical imbalance'],
    recommendedActions:
      parsed?.recommendedActions?.map((item) => item.trim()).filter(Boolean).slice(0, 5) ||
      ['Avoid aggressive driving', 'Book a professional inspection'],
    serviceSuggestion: parsed?.serviceSuggestion?.trim() || 'Schedule a diagnostic inspection.',
    estimatedCostRange: parsed?.estimatedCostRange?.trim() || 'Inspection required for accurate estimate.',
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DiagnosisRequest;

    if (body.mode === 'classify') {
      const issue = body.issue?.trim();
      if (!issue) {
        return Response.json({ error: 'Issue is required.' }, { status: 400 });
      }

      const result = await classifyIssue(issue);
      return Response.json({
        category: result.category,
        confidence: result.confidence,
        reason: result.reason,
      });
    }

    if (body.mode === 'summarize') {
      const issue = body.issue?.trim();
      if (!issue) {
        return Response.json({ error: 'Issue is required.' }, { status: 400 });
      }
      const category = normalizeCategory(body.category);
      const answers = body.answers ?? {};
      const summary = await summarizeIssue(issue, category, answers);

      return Response.json({
        ...summary,
        masterPromptUsed: {
          classify: 'MASTER PROMPT: CATEGORY MAPPING',
          diagnose: 'MASTER PROMPT: FINAL AUTOMOTIVE DIAGNOSIS',
        },
        masterPrompt: {
          issue,
          category,
          answers,
          questionBankCategoryCount: Object.keys(questionBank).length,
        },
      });
    }

    return Response.json({ error: 'Unsupported mode.' }, { status: 400 });
  } catch {
    return Response.json({ error: 'Unable to process diagnosis request.' }, { status: 500 });
  }
}
