# WrectifAI — AI Diagnosis Engine Architecture

**Date**: 2026-07-06  
**Scope**: Full architecture of the AI-powered vehicle diagnosis chat — from user input through multimodal media processing, RAG grounding, LLM inference, safety guardrails, and database persistence.

---

## Overview

The AI Diagnosis Engine is a two-stage, RAG-grounded diagnostic pipeline. It accepts free-text symptoms, optional images and audio recordings, and structured intake answers. It then produces a structured diagnosis (issues, confidence, risk level, DIY steps, next action) backed by a curated `known_issues` database rather than relying on pure LLM hallucination.

**Important**: Media (images/audio) submitted during Stage 1 is **not processed** until Stage 2. Only the symptom text is used for question generation.

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ai-diagnose-page.tsx                                           │
│                                                                 │
│  1. User enters symptom text + optional images / audio          │
│  2. POST /api/v1/diagnosis  { stage: 'questions' }              │
│     → Receives LLM-generated intake questions                   │
│  3. User answers questions                                      │
│  4. POST /api/v1/diagnosis  { stage: 'final' }                  │
│     → Receives structured DiagnosisResult                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               API Layer  (Express + Node 22)                    │
│  POST /api/v1/diagnosis                                         │
│  diagnosis.routes.ts                                            │
│  · authenticate middleware (JWT)                                │
│  · requireRole(['user','garage','vendor','admin'])              │
└────────────┬───────────────────────────┬────────────────────────┘
             │ stage='questions'          │ stage='final'
             ▼                           ▼
  DiagnosisService                DiagnosisService
  .generateQuestions()            .runDiagnosis()
```

---

## Stage 1 — Question Generation (`stage: 'questions'`)

**Note**: Only `symptomText` is used. Media (images/audio) submitted here is not processed until Stage 2.

```
symptomText
     │
     ▼
KnowledgeService.findMatchingIssues()    ← DB FTS lookup against known_issues
     │
     ├─ 0 matches → return { questions: [], matchedIssues: [] }
     │              (LLM bypassed, no API cost)
     │
     └─ N matches → LLM (Groq / OpenAI)
                    generateObject() with zod schema
                    → 3–5 targeted multiple-choice questions
                    → questionsWithIds + matchedIssues summary
```

The questions are dynamically generated to discriminate between the N matched known issues — not generic automotive questions.

---

## Stage 2 — Final Diagnosis (`stage: 'final'`)

```
User submits:
  symptomText + images[] + audio[] + intakeAnswers (Q&A)
                    │
                    ▼
        ┌───────────┼──────────────────┐
        ▼           ▼                  ▼
  DB Lookup    analyzeImage()     transcribeAudio()
  (vehicles,   llama-4-scout      whisper-large-v3-turbo
   history,    Groq Vision API    Groq STT (raw fetch
   known_issues via Vercel AI     FormData + Blob, no new deps)
   with intakeAnswers.category)       │
        │           │             transcript text
        │     text description       │
        │           │                  │
        └───────────┴──────────────────┘
                         │
                  finalSymptomText
               (with [Transcribed Audio]: suffix, persisted to DB)
                         │
              ┌──────────┴──────────┐
              │                     │
         0 DB matches          N DB matches
              │                     │
     Clarification Result    Main LLM (text-only)
     (no LLM call)           generateObject()
                             Groq llama-3.1-70b-versatile
                             or OpenAI (configurable)
                                     │
                             DiagnosisResult (zod schema)
                                     │
                             Safety Guardrail
                             applySafetyGuardrail()
                                     │
                             Final DiagnosisResult
                                     │
                        DB Transaction (BEGIN → COMMIT)
                        · diagnosis_requests
                        · diagnosis_media
                        · diagnosis_results
```

**Execution order**: DB lookup (vehicles, history, known_issues) runs first, then media files are saved to disk, then `Promise.all` runs image analysis and audio transcription in parallel. The DB lookup is **not** concurrent with media processing.

---

## Component Breakdown

### `diagnosis.routes.ts`
- `POST /api/v1/diagnosis` — authenticated, RBAC-guarded entry point
- `GET  /api/v1/diagnosis/:id` — fetch diagnosis by ID (ownership-verified, admin bypass)
- Dispatches to `DiagnosisService.generateQuestions()` or `DiagnosisService.runDiagnosis()` based on `stage`

---

### `DiagnosisService` (`diagnosis.service.ts`)

| Method | Purpose |
|---|---|
| `generateQuestions()` | Stage 1: fetch DB matches → LLM question generation |
| `runDiagnosis()` | Stage 2: full pipeline — media → RAG → LLM → guardrail → persist |
| `analyzeImage()` | Static: base64 image → text description via Groq Vision |
| `transcribeAudio()` | Static: base64 audio → transcript via Groq/OpenAI STT |
| `applySafetyGuardrail()` | Static: enforces `diyAllowed=false` / `nextAction=bookGarage` for safety-critical issues |
| `getDiagnosisById()` | Fetch stored diagnosis with ownership check |

---

### `KnowledgeService` (`knowledge.service.ts`)

Performs **PostgreSQL Full Text Search** against the `known_issues` table:

```sql
-- Converts tokens → FTS OR query with prefix matching
-- e.g. "clicking noise" → "clicking:* | noise:*"
SELECT *, ts_rank_cd(
  to_tsvector('english', issue_name || ' ' || description || ' ' || symptom_keywords),
  to_tsquery('english', $1)
) as match_count
FROM known_issues
WHERE category = $4 AND make matches AND year range matches
ORDER BY match_count DESC, base_confidence DESC
LIMIT 5
```

Features:
- Native Postgres stemming (`clicking` matches `click`)
- Stop-word filtering in the DB layer
- GIN indexes on `symptom_keywords` and `makes` for performance
- Category, make, and year filters
- Zero-match short-circuit → LLM bypass

---

### Multimodal Processing

#### Image Analysis — `analyzeImage()`
```
base64 image
     │
     ▼
createOpenAI({ baseURL: groq, apiKey })
generateText({
  model: llama-4-scout-17b-16e-instruct,
  messages: [{ role: 'user', content: [text prompt, image_url block] }]
})
     │
     ▼
Plain-text damage/wear description
```

- Uses OpenAI wire format `{ type: 'image_url', image_url: { url: 'data:image/...' } }`  
- Double-cast via `unknown` to bridge Vercel AI SDK's `ImagePart` type (SDK limitation)
- Fails silently (`''`) — diagnosis continues without image context on error

#### Audio Transcription — `transcribeAudio()`
```
base64 audio
     │
     ▼
FormData + Blob (Node 22 native fetch — no new npm packages)
POST {baseURL}/audio/transcriptions
     │
     ▼
Plain-text transcript
```

- Vercel AI SDK has no transcription support → raw `fetch` used
- Identical OpenAI-compatible endpoint for both Groq and OpenAI providers
- Fails silently (`''`) on error

---

### Safety Guardrail — `applySafetyGuardrail()`

Applied to every LLM result before returning or persisting:

```
result + symptomText + matchedIssues
           │
           ▼
safetyRegex: /\b(brake|steering|airbag|suspension|
               high-voltage|hybrid_battery|stabilizer|abs)\b/i
           │
    ┌──────┴──────┐
    │ match found │  OR  riskLevel = 'high'|'critical'
    │    in text, │  OR  any matchedIssue.safety_critical = true
    │  issue name │
    └──────┬──────┘
           ▼
    diyAllowed = false
    nextAction = 'bookGarage'
```

Word boundary regex prevents false positives (e.g. `absent` does not trigger `abs`).

---

## Database Schema (Relevant Tables)

```
known_issues
├── id, category, issue_name, description
├── symptom_keywords[]        ← GIN indexed, FTS source
├── makes[]                   ← GIN indexed
├── year_from, year_to
├── risk_level, diy_allowed, safety_critical
├── required_parts (JSONB)
├── estimated_cost_min/max
├── diy_steps[], garage_steps[]
└── base_confidence

diagnosis_requests
├── id, customer_id, vehicle_id
├── symptom_text              ← includes [Transcribed Audio]: suffix
├── status, created_at

diagnosis_media
├── id, diagnosis_request_id
├── media_type (image|audio|video)
└── url (/uploads/<filename>)

diagnosis_results
├── id, diagnosis_request_id
├── issues (JSONB array)
├── confidence_score, risk_level
├── diy_allowed, diy_steps[]
└── next_action (diy|bookGarage|buyParts)
```

---

## LLM & Provider Configuration

All LLM choices are runtime-configurable via environment variables — no code changes needed to swap providers:

| Variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `groq` | Main diagnosis LLM provider |
| `LLM_MODEL` | `llama-3.1-70b-versatile` | Main diagnosis model |
| `IMAGE_LLM_PROVIDER` | `groq` | Vision model provider |
| `IMAGE_LLM_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | Vision model |
| `AUDIO_PROVIDER` | `groq` | STT provider |
| `AUDIO_MODEL` | `whisper-large-v3-turbo` | STT model |
| `GROQ_API_KEY` | — | Shared key for Groq (all three) |
| `OPENAI_API_KEY` | — | Required only when switching to OpenAI |

To switch vision to OpenAI GPT-4o: set `IMAGE_LLM_PROVIDER=openai`, `IMAGE_LLM_MODEL=gpt-4o`.

---

## DiagnosisResult Schema (Zod)

```typescript
{
  issues: Array<{
    name: string;
    confidence: number;          // 0–100
    estimatedPriceRange: { min: number; max: number };  // USD
    requiredParts: string[];
  }>;
  confidenceScore: number;       // 0–100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  diyAllowed: boolean;
  diySteps: string[];
  nextAction: 'diy' | 'bookGarage' | 'buyParts';
}
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Two-stage chat (questions → final) | Narrows ambiguous symptoms before spending LLM tokens on diagnosis |
| RAG via `known_issues` DB + FTS | Grounds answers in curated data; avoids hallucinated costs/parts |
| Zero-match LLM bypass | Prevents hallucination for vague/unmatched queries; saves API cost |
| Media pre-processing with specialist models | Main LLM stays text-only; vision/STT handled by dedicated models |
| Raw `fetch` for audio transcription | Vercel AI SDK has no STT support; single fetch covers both providers |
| `Promise.all` for parallel media processing | Reduces latency when both images and audio are submitted |
| Safety guardrail post-LLM | Hard override ensures safety-critical issues never get `diyAllowed=true` regardless of LLM output |
| DB transaction for persistence | Atomically writes request + media + result; rolls back on any failure |

---

## File Map

```
apps/api/src/
├── modules/diagnosis/
│   ├── diagnosis.routes.ts       ← HTTP entry point, auth, RBAC
│   ├── diagnosis.service.ts      ← Core pipeline: media, RAG, LLM, guardrail, DB
│   ├── diagnosis.service.test.ts ← Unit tests (applySafetyGuardrail, etc.)
│   ├── knowledge.service.ts      ← PostgreSQL FTS matching against known_issues
│   └── knowledge.service.test.ts ← Unit tests for FTS matching
├── config/
│   ├── database.ts               ← query() helper, pool
│   └── env.ts                    ← All provider/model env vars
├── middleware/
│   └── auth.ts                   ← authenticate, requireRole
└── routes/
    └── index.ts                  ← Mounts diagnosisRouter at /api/v1/diagnosis

apps/web/src/
├── pages/ai-diagnose/
│   └── ai-diagnose-page.tsx      ← Two-stage chat UI, dynamic questions loop
└── lib/
    └── diagnosis-api.ts          ← Frontend API client (questions + final payloads)

db/migrations/
└── 004_known_issues.sql          ← known_issues table + GIN indexes + seed data
```
