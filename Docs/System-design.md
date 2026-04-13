# WRECTIFAI System Design Strategy (MVP)

## 1. Core Principle
WRECTIFAI is a controlled workflow system with AI as a helper layer, not an autonomous decision engine.
All runtime behavior and display content are PostgreSQL-driven; hardcoded UI/business content is not allowed.

## 2. Architecture Stance
### 2.1 Backend is the source of truth
- Backend owns orchestration using deterministic workflow/state transitions.
- Backend enforces all business rules for safety, routing, quote handling, booking, and payment transitions.
- AI cannot bypass backend constraints.

### 2.2 AI role is bounded
- AI is used to:
  - Interpret user symptom text.
  - Suggest possible diagnosis candidates.
  - Generate human-readable explanations.
- AI is not used to:
  - Make pricing decisions.
  - Make safety decisions.
  - Make booking decisions.
  - Compute/override trust score outcomes directly.

## 3. JSON-Driven Interface Contract
Every diagnosis response must conform to this strict schema:

```json
{
  "possible_issues": [],
  "urgency": "",
  "diy_allowed": false,
  "risk": "",
  "next_questions": []
}
```

### Why this is mandatory
- Enables guided, step-based diagnosis flow.
- Supports multi-issue handling consistently.
- Integrates directly into quote and booking workflows.
- Reduces ambiguous AI outputs and parsing failures.

## 4. Seed-Data Grounding (MVP)
The system is seed-data driven for MVP, not dataset-driven.

### Required seeds
- `diagnosis_seed.json`
- `price_seed.json`
- `parts_seed.json`

### Seed purpose
- Ground AI explanations in known categories/options.
- Provide backend fallback logic when AI confidence/shape is insufficient.
- Define baseline pricing bands and parts references for comparisons.

### Explicit MVP constraint
- No external datasets in MVP.
- Runtime reads must come from PostgreSQL tables, not directly from JSON files.
- JSON seed files are bootstrap assets for initial DB population/migrations only.

## 4A. PostgreSQL-Driven Dynamic Product Model
No user-visible or rule-driving content should be hardcoded in frontend or backend source code.

### Must come from PostgreSQL at runtime
- App identity: app name, logo URL, brand text, app-store/legal display strings.
- UI copy: screen titles, subtitles, button labels, placeholders, helper text, empty states.
- Validation and errors: user-facing error messages, success toasts, warning messages.
- Workflow content: onboarding step labels, diagnosis question bank, symptom options, urgency labels.
- Marketplace and service catalogs: service labels, categories, part metadata shown in UI.
- Feature controls: feature flags, rollout toggles, role visibility rules.
- Policy content: terms/privacy links and policy versions shown to users.
- Notification templates: title/body templates for SMS/email/push.
- Pricing reference data and seed mappings used for quote comparison.

### Allowed hardcoded values
- Technical constants only (e.g., protocol-level defaults, retry/backoff limits, cache TTLs).
- Security and compliance defaults that must not be remotely editable.
- Database schema/migration metadata.

## 4B. Global Shadcn Theme Governance
- UI is built with Shadcn and a global theme contract.
- Colors, semantic tokens, radius, and typography are defined once in global theme files and applied app-wide.
- No local component-level hardcoded brand palette values for core UI surfaces.

## 5. Hybrid AI Execution Model
Primary flow:
1. User submits issue input.
2. AI parses symptoms into structured diagnostic candidates.
3. Backend matches/validates against seed data.
4. AI refines explanation for user clarity.
5. Backend enforces final routing and allowed actions.

Implementation meaning:
- AI = reasoning/explanation layer.
- Backend = control/enforcement layer.

## 6. Safety and Routing Rules (Non-Overridable)
- If `diy_allowed = false`, system must force garage flow.
- If `urgency = high`, system must skip DIY path.
- AI output can inform but cannot override backend safety/routing rules.

## 6A. API Protection Rules
- Default: all APIs require authentication token validation and RBAC checks.
- Exceptions: only login/register entry APIs are public.
- Any new API must be treated as protected unless explicitly listed as public in the API contract.

## 7. Quote System Design
Quotes are structured submissions from garages, not AI-generated values:

```json
{
  "parts_cost": 200,
  "labor_cost": 100,
  "total": 300
}
```

### Pricing comparison model
- Backend compares quote totals to `price_seed.json` bands.
- Output classification: `below`, `fair`, or `above`.
- AI may explain the classification but does not calculate or approve pricing.

## 8. MVP End-to-End Workflow
### Customer journey
1. Enter issue.
2. Receive structured AI diagnosis.
3. Raise issue request.
4. Receive garage quotes.
5. Select quote.
6. Book appointment.
7. Complete in-app payment (sandbox gateway mode is acceptable for MVP build/testing).
8. Submit review.

### Garage journey
1. View customer issue request.
2. Submit structured quote.

## 9. Out of Scope for Current MVP
- Real datasets.
- VIN decoding.
- Image/audio AI pipelines.
- Advanced pricing engine.
- Advanced trust analytics model beyond baseline trust-score inputs defined in PRD/MVP docs.

## 9A. Phase-1 Implementation Alignment (task.md)
- Phase 1 build targets roles `admin`, `user`, `garage` for active workflow delivery.
- Vendor remains a product role in PRD and can be enabled in a later implementation phase.
- Phase 1 data/backend implementation is raw PostgreSQL + explicit RBAC.

## 10. Rationale
- Aligns with PRD needs: guided diagnosis, quote comparison, booking completion.
- Keeps system predictable and testable.
- Reduces hallucination risk by constraining AI outputs and authority.
- Feasible for a one-week MVP build window.

## 11. Team Summary
We are building a JSON-driven, backend-controlled workflow system where AI assists with diagnosis and explanation, while all logic, pricing, safety, and decisions are enforced by backend rules using seed data.
