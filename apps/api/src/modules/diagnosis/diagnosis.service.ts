import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { getDbPool, query } from '../../config/database';
import { getEnv } from '../../config/env';
import { KnowledgeService, type RetrievedIssue } from './knowledge.service';

// Schema matching frontend requirements and future sprints
export const diagnosisResultSchema = z.object({
  issues: z.array(z.object({
    name: z.string(),
    confidence: z.number().min(0).max(100),
    estimatedPriceRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
    requiredParts: z.array(z.string()),
  })),
  confidenceScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  diyAllowed: z.boolean(),
  diySteps: z.array(z.string()),
  nextAction: z.enum(['diy', 'bookGarage', 'buyParts']),
});

export type DiagnosisResult = z.infer<typeof diagnosisResultSchema>;

export interface MediaInput {
  mediaType: 'image' | 'video' | 'audio';
  base64: string;
}

const ALLOWED_MEDIA = {
  image: {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  },
  audio: {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/webm': 'webm',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a',
  },
  video: {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogg',
    'video/quicktime': 'mov',
  },
} as const;

const MAX_SIZES = {
  image: 10 * 1024 * 1024,   // 10MB
  audio: 15 * 1024 * 1024,   // 15MB
  video: 15 * 1024 * 1024,   // 15MB
} as const;

export class DiagnosisService {
  // ponytail: raw fetch — Vercel AI SDK has no transcription support; both Groq and OpenAI use identical OpenAI-compatible multipart endpoint
  static async transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    const env = getEnv();
    const baseURL = env.audioProvider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : 'https://api.openai.com/v1';
    const apiKey = env.audioProvider === 'groq' ? env.groqApiKey : env.openaiApiKey;

    const rawBase64 = base64Audio.includes(';base64,') ? base64Audio.split(';base64,')[1] : base64Audio;
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(Buffer.from(rawBase64, 'base64'))], { type: mimeType }), 'audio.wav');
    formData.append('model', env.audioModel);
    formData.append('response_format', 'text');

    try {
      const res = await fetch(`${baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });
      return res.ok ? res.text() : '';
    } catch (err) {
      console.error('Audio transcription failed:', err);
      return '';
    }
  }

  static async analyzeImage(base64Image: string): Promise<string> {
    const { generateText } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const env = getEnv();
    const apiKey = env.imageLlmProvider === 'groq' ? env.groqApiKey : env.openaiApiKey;
    const baseURL = env.imageLlmProvider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined;

    if (!apiKey) throw new Error(`API key for ${env.imageLlmProvider} is not set`);

    const imageUrl = base64Image.startsWith('data:image/')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    let mimeType = 'image/jpeg';
    const match = imageUrl.match(/^data:([^;]+);base64,/);
    if (match) {
      mimeType = match[1];
    }

    const aiProvider = createOpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

    try {
      const { text } = await generateText({
        model: aiProvider(env.imageLlmModel),
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this vehicle image. Describe any visible damage, wear, warning lights, or mechanical issues you can see.' },
            {
              type: 'file',
              data: imageUrl,
              mediaType: mimeType,
            },
          ],
        }],
      });
      return text;
    } catch (err) {
      console.error('Image analysis failed:', err);
      return '';
    }
  }

  /**
   * Stage 1: Generate dynamic intake questions based on database matches
   */
  static async generateQuestions(
    customerId: string,
    vehicleId: string,
    symptomText: string
  ) {
    const env = getEnv();

    // Verify vehicle exists (customer ownership check deferred)
    const vehicleRes = await query(
      'SELECT make, model, year FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleRes.rows.length === 0) {
      throw new Error('Vehicle not found or does not belong to the user');
    }
    const vehicle = vehicleRes.rows[0];

    // Fetch matching issues from database for grounding
    let matchedIssues: RetrievedIssue[] = [];
    try {
      matchedIssues = await KnowledgeService.findMatchingIssues(
        symptomText,
        vehicle.make,
        vehicle.year
      );
    } catch (dbErr) {
      console.error('Failed to retrieve matched issues from database:', dbErr);
    }

    if (matchedIssues.length === 0) {
      // Bypasses LLM directly on zero DB matches (Option A)
      return {
        questions: [],
        matchedIssues: [],
      };
    }

    // Call LLM to generate targeted questions based on database matches
    const { generateObject } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    let aiProvider;
    if (env.llmProvider === 'groq') {
      if (!env.groqApiKey) {
        throw new Error('GROQ_API_KEY is not defined in the environment');
      }
      aiProvider = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: env.groqApiKey,
      });
    } else {
      if (!env.openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not defined in the environment');
      }
      aiProvider = createOpenAI({
        apiKey: env.openaiApiKey,
      });
    }

    const modelInstance = aiProvider(env.llmModel);

    const systemPrompt = `You are an expert automotive diagnostic assistant.
The user has reported a symptom: "${symptomText}".
Our database indicates this could be one of the following known issues:
${matchedIssues.map(issue => `- Issue: ${issue.issue_name}\n  Description: ${issue.description}`).join('\n')}

Your task is to generate exactly 5 highly specific multiple choice questions to ask the user.
These questions should be designed to narrow down WHICH of the database issues is the correct one.
Do not ask generic questions (e.g. "what model is your car?"). Focus strictly on symptoms, sound patterns, warning lights, or operating conditions related to the potential issues listed.
For each question, provide 2 to 4 concise multiple choice options (e.g., ["Crank is slow", "Starter clicks only", "No crank at all"]).
Output your response as a strict JSON array under a "questions" field, where each item is an object containing "question" (string) and "options" (array of strings).`;

    const llmResponse = await generateObject({
      model: modelInstance,
      schema: z.object({
        questions: z.array(z.object({
          question: z.string(),
          options: z.array(z.string()),
        })),
      }),
      prompt: systemPrompt,
    });

    // ponytail: map dynamic questions to clean structured objects with dynamic IDs
    const questionsWithIds = llmResponse.object.questions.map((q, idx) => ({
      id: `dyn-q-${idx}-${Date.now()}`,
      question: q.question,
      options: q.options,
    }));

    return {
      questions: questionsWithIds,
      matchedIssues: matchedIssues.map(issue => ({
        id: issue.id,
        issue_name: issue.issue_name,
        safety_critical: issue.safety_critical,
      })),
    };
  }

  /**
   * Run the diagnosis engine synchronously:
   * 1. Query vehicle details & recent service history.
   * 2. Save media files to local disk.
   * 3. Send prompt & media context to LLM.
   * 4. Enforce safety guardrails.
   * 5. Save all results inside a DB transaction.
   */
  static async runDiagnosis(
    customerId: string,
    vehicleId: string,
    symptomText: string,
    mediaInputs: MediaInput[] = [],
    intakeAnswers?: { 
      category?: string; 
      answers?: Record<string, string>; 
      questions?: string[]; 
      qas?: Record<string, string>;
    }
  ) {
    const env = getEnv();

    // Validate and decode media inputs upfront
    const validatedMedia = mediaInputs.map(input => {
      const matches = input.base64.match(/^data:([A-Za-z0-9+/.-]+);base64,(.+)$/);
      let buffer: Buffer;
      let mime = '';

      if (matches && matches.length === 3) {
        mime = matches[1].toLowerCase();
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(input.base64, 'base64');
        if (input.mediaType === 'image') mime = 'image/jpeg';
        if (input.mediaType === 'audio') mime = 'audio/wav';
        if (input.mediaType === 'video') mime = 'video/mp4';
      }

      const allowedMimes = ALLOWED_MEDIA[input.mediaType];
      if (!allowedMimes) {
        throw new Error(`Unsupported mediaType: ${input.mediaType}`);
      }

      const extension = allowedMimes[mime as keyof typeof allowedMimes];
      if (!extension) {
        throw new Error(`Unsupported or invalid MIME type for ${input.mediaType}: ${mime}`);
      }

      const maxSize = MAX_SIZES[input.mediaType];
      if (buffer.length > maxSize) {
        throw new Error(`File size exceeds the limit of ${maxSize / (1024 * 1024)}MB for ${input.mediaType}`);
      }

      return {
        mediaType: input.mediaType,
        buffer,
        extension,
      };
    });

    // 1. Fetch vehicle (customer ownership check deferred)
    const vehicleRes = await query(
      'SELECT make, model, year, mileage FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleRes.rows.length === 0) {
      throw new Error('Vehicle not found or does not belong to the user');
    }
    const vehicle = vehicleRes.rows[0];

    // Fetch last 5 service history records
    const historyRes = await query(
      'SELECT service_date, description, cost FROM vehicle_service_history WHERE vehicle_id = $1 ORDER BY service_date DESC LIMIT 5',
      [vehicleId]
    );
    const serviceHistory = historyRes.rows;

    // Fetch matching issues from database for grounding
    let matchedIssues: RetrievedIssue[] = [];
    try {
      matchedIssues = await KnowledgeService.findMatchingIssues(
        symptomText,
        vehicle.make,
        vehicle.year,
        intakeAnswers?.category
      );
    } catch (dbErr) {
      console.error('Failed to retrieve matched issues from database:', dbErr);
    }

    // 2. Save media files to local disk
    const savedMediaPaths: { mediaType: 'image' | 'video' | 'audio'; url: string }[] = [];
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const media of validatedMedia) {
      // ponytail: generate unique filename using stdlib
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${media.extension}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.promises.writeFile(filePath, new Uint8Array(media.buffer));

      savedMediaPaths.push({
        mediaType: media.mediaType,
        url: `/uploads/${filename}`,
      });
    }

    let result: DiagnosisResult;
    let finalSymptomText = symptomText;

    if (matchedIssues.length === 0) {
      // ponytail: bypass LLM entirely to save latency & costs when there are 0 DB matches
      result = {
        issues: [{
          name: 'Clarification Required',
          confidence: 0,
          estimatedPriceRange: { min: 0, max: 0 },
          requiredParts: [],
        }],
        confidenceScore: 0,
        riskLevel: 'low',
        diyAllowed: false,
        diySteps: ["I couldn't find a direct match. Can you describe the noise it's making, or when exactly it happens?"],
        nextAction: 'diy',
      };
    } else {
      // 3. Call LLM (Vercel AI SDK OpenAI or Groq)
      const { generateObject } = await import('ai');
      const { createOpenAI } = await import('@ai-sdk/openai');
      let aiProvider;
      if (env.llmProvider === 'groq') {
        if (!env.groqApiKey) {
          throw new Error('GROQ_API_KEY is not defined in the environment');
        }
        aiProvider = createOpenAI({
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: env.groqApiKey,
        });
      } else {
        if (!env.openaiApiKey) {
          throw new Error('OPENAI_API_KEY is not defined in the environment');
        }
        aiProvider = createOpenAI({
          apiKey: env.openaiApiKey,
        });
      }

      const modelInstance = aiProvider(env.llmModel);

      // Format service history for the prompt
      const serviceHistoryText = serviceHistory.length > 0
        ? serviceHistory.map(h => `- [${new Date(h.service_date).toLocaleDateString()}] ${h.description} ($${h.cost || 0})`).join('\n')
        : 'No prior service history recorded.';

      const systemPrompt = `You are WrectifAI, an advanced automotive diagnostic expert system.
Analyze the vehicle details, recent service history, user symptoms, and any provided media descriptions.
Provide a highly structured diagnosis conforming exactly to the required JSON schema.
Be realistic about whether a repair is DIY-safe. Safety-critical components (brakes, steering, suspension, airbags, high-voltage EV battery systems) should NEVER have diyAllowed = true. Always output prices in US dollars.`;

      let groundingText = '';
      if (matchedIssues.length > 0) {
        groundingText = `\n\nKnown Issues for this vehicle (from diagnostic database):
---
${matchedIssues.map(issue => `
Issue: ${issue.issue_name}
- Risk Level: ${issue.risk_level}
- DIY Allowed: ${issue.diy_allowed ? 'Yes' : 'No'}
- Required Parts: ${JSON.stringify(issue.required_parts)}
- Cost Range: $${issue.estimated_cost_min} - $${issue.estimated_cost_max}
- DIY Steps: ${JSON.stringify(issue.diy_steps)}
- Garage Steps: ${JSON.stringify(issue.garage_steps)}
- Base Confidence: ${issue.base_confidence}%
`).join('\n---\n')}
---
Use these known issues as PRIMARY reference. Adjust confidence based on how well the user's symptoms match. Only suggest issues NOT in this list if no known issue fits well. Make sure estimated prices and steps reflect this database grounding.`;
      }

      const finalSystemPrompt = `${systemPrompt}${groundingText}`;

      let intakeText = '';
      if (intakeAnswers) {
        const qas = intakeAnswers.qas || intakeAnswers.answers;
        if (qas && Object.keys(qas).length > 0) {
          intakeText = `\nIntake Answers:\n${Object.entries(qas).map(([q, a]) => `- ${q}: ${a}`).join('\n')}`;
        }
      }

      // Process media in parallel before LLM call
      const [imageDescriptions, audioTranscripts] = await Promise.all([
        Promise.all(
          mediaInputs
            .filter(m => m.mediaType === 'image')
            .map(m => DiagnosisService.analyzeImage(m.base64))
        ),
        Promise.all(
          mediaInputs
            .filter(m => m.mediaType === 'audio')
            .map(m => DiagnosisService.transcribeAudio(m.base64, 'audio/wav'))
        ),
      ]);

      // Append transcripts to symptomText so they persist to DB too
      const transcriptText = audioTranscripts.filter(Boolean).join('\n');
      finalSymptomText = transcriptText
        ? `${symptomText}\n\n[Transcribed Audio]: ${transcriptText}`
        : symptomText;

      // Build image context for prompt
      const imageContext = imageDescriptions.filter(Boolean).length > 0
        ? `\n\nImage Analysis:\n${imageDescriptions.map((d, i) => `- Image #${i + 1}: ${d}`).join('\n')}`
        : '';

      const userPrompt = `Vehicle Context:
- Make: ${vehicle.make}
- Model: ${vehicle.model}
- Year: ${vehicle.year}
- Mileage: ${vehicle.mileage} miles

Prior Service History:
${serviceHistoryText}

Reported Symptoms:
${finalSymptomText}
${intakeText}

Please diagnose the issue.`;

      const contentPayload: { type: 'text'; text: string }[] = [{ type: 'text', text: userPrompt + imageContext }];

      const llmResponse = await generateObject({
        model: modelInstance,
        schema: diagnosisResultSchema,
        system: finalSystemPrompt,
        messages: [
          {
            role: 'user',
            content: contentPayload,
          },
        ],
      });

      result = DiagnosisService.applySafetyGuardrail(llmResponse.object, symptomText, matchedIssues);
    }

    // 5. Database Transaction Persistence
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert Request
      const requestInsertRes = await client.query(
        `INSERT INTO diagnosis_requests (customer_id, vehicle_id, symptom_text, status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [customerId, vehicleId, finalSymptomText, 'completed']
      );
      const dbRequest = requestInsertRes.rows[0];

      // Insert Media records
      const dbMediaList = [];
      for (const mediaPath of savedMediaPaths) {
        const mediaInsertRes = await client.query(
          `INSERT INTO diagnosis_media (diagnosis_request_id, media_type, url)
           VALUES ($1, $2, $3) RETURNING *`,
          [dbRequest.id, mediaPath.mediaType, mediaPath.url]
        );
        dbMediaList.push(mediaInsertRes.rows[0]);
      }

      // Insert Result
      const resultInsertRes = await client.query(
        `INSERT INTO diagnosis_results (diagnosis_request_id, issues, confidence_score, risk_level, diy_allowed, diy_steps, next_action)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          dbRequest.id,
          JSON.stringify(result.issues),
          result.confidenceScore,
          result.riskLevel,
          result.diyAllowed,
          result.diySteps,
          result.nextAction,
        ]
      );
      const dbResult = resultInsertRes.rows[0];

      await client.query('COMMIT');

      return {
        id: dbRequest.id,
        customerId: dbRequest.customer_id,
        vehicleId: dbRequest.vehicle_id,
        symptomText: dbRequest.symptom_text,
        status: dbRequest.status,
        createdAt: dbRequest.created_at,
        media: dbMediaList,
        result: {
          id: dbResult.id,
          issues: dbResult.issues,
          confidenceScore: dbResult.confidence_score,
          riskLevel: dbResult.risk_level,
          diyAllowed: dbResult.diy_allowed,
          diySteps: dbResult.diy_steps,
          nextAction: dbResult.next_action,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get single diagnosis request and result details
   */
  static async getDiagnosisById(diagnosisId: string, customerId: string) {
    // Ownership verification built directly into the query
    const queryStr = `SELECT dr.*, dr.customer_id as "customerId", dr.vehicle_id as "vehicleId", dr.symptom_text as "symptomText",
              dr.created_at as "createdAt",
              dr.status,
              dr.id as id
       FROM diagnosis_requests dr
       WHERE dr.id = $1`;
    
    const params = [diagnosisId];
    const reqRes = await query(queryStr, params);

    if (reqRes.rows.length === 0) {
      return null;
    }
    const dbRequest = reqRes.rows[0];

    // Fetch media
    const mediaRes = await query(
      'SELECT id, media_type as "mediaType", url FROM diagnosis_media WHERE diagnosis_request_id = $1',
      [diagnosisId]
    );

    // Fetch results
    const resultRes = await query(
      `SELECT id, issues, confidence_score as "confidenceScore", risk_level as "riskLevel",
              diy_allowed as "diyAllowed", diy_steps as "diySteps", next_action as "nextAction"
       FROM diagnosis_results
       WHERE diagnosis_request_id = $1`,
      [diagnosisId]
    );

    return {
      id: dbRequest.id,
      customerId: dbRequest.customerId,
      vehicleId: dbRequest.vehicleId,
      symptomText: dbRequest.symptomText,
      status: dbRequest.status,
      createdAt: dbRequest.createdAt,
      media: mediaRes.rows,
      result: resultRes.rows[0] ? {
        id: resultRes.rows[0].id,
        issues: resultRes.rows[0].issues,
        confidenceScore: resultRes.rows[0].confidenceScore,
        riskLevel: resultRes.rows[0].riskLevel,
        diyAllowed: resultRes.rows[0].diyAllowed,
        diySteps: resultRes.rows[0].diySteps,
        nextAction: resultRes.rows[0].nextAction,
      } : null,
    };
  }

  /**
   * Apply hardcoded safety guardrails to LLM result
   */
  static applySafetyGuardrail(
    result: DiagnosisResult,
    symptomText: string,
    matchedIssues: RetrievedIssue[] = []
  ): DiagnosisResult {
    // ponytail: compile regex once with word boundaries to prevent false positives (like "absent" matching "abs")
    const safetyRegex = /\b(brake|steering|airbag|suspension|high-voltage|hybrid_battery|hybrid battery|stabilizer|abs)\b/i;
    let hasSafetyCriticalIssue = result.issues.some(issue => safetyRegex.test(issue.name)) || 
                                 safetyRegex.test(symptomText);

    if (matchedIssues.some(issue => issue.safety_critical)) {
      hasSafetyCriticalIssue = true;
    }

    const finalResult = { ...result };
    if (
      finalResult.riskLevel === 'medium' ||
      finalResult.riskLevel === 'high' ||
      finalResult.riskLevel === 'critical' ||
      hasSafetyCriticalIssue
    ) {
      finalResult.diyAllowed = false;
      finalResult.nextAction = 'bookGarage';
    }
    return finalResult;
  }
}
