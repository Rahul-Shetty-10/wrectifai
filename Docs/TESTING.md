# Wrectifai — Test Suite Documentation

## Overview

The project uses **Node.js built-in test runner** (`node:test` + `node:assert`) with **SWC** for TypeScript transpilation. No Jest or Vitest — just native `node --test` via `@swc-node/register`.

## Running Tests

| Command | What it runs |
|---------|-------------|
| `npm test` | All tests across all apps (API + web) |
| `npm run test:api` | All API tests (unit + integration) |
| `npm run test:api:unit` | API tests **excluding** DB-dependent ones (skips tests whose name contains "DB") |
| `npm run test:web` | Web client tests |

The API test runner loads `.env.test` which points to a local Docker PostgreSQL instance on port `5433` with database `wrectifai_test`. Start it with `npm run db:test-up`.

### Test configuration

Defined in `apps/api/project.json` → `targets.test`:

- **Full run**: `node -r @swc-node/register --test apps/api/src/**/*.test.ts`
- **Unit-only** (config `unit`): same command with `--test-name-pattern '^(?!.*DB)'` to exclude integration tests whose names start with "DB -".

---

## API Tests

### 1. `apps/api/src/config/env.test.ts` — Environment Config (Unit)

**3 tests.** Validates the `getEnv()` function that parses and validates environment variables.

| Test | What it checks |
|------|---------------|
| `default keys and warnings in development` | In dev mode, missing JWT secrets get safe defaults instead of throwing |
| `throws in production on missing JWT_SECRET` | Production without `JWT_SECRET` → fatal error |
| `throws in production on missing JWT_REFRESH_SECRET` | Production without `JWT_REFRESH_SECRET` → fatal error |

**Mocking:** None. Pure function, no I/O.

---

### 2. `apps/api/src/config/database.test.ts` — Database Connectivity (Integration)

**4 tests.** These hit a real PostgreSQL database (prefixed with "DB -" to allow unit-only filtering).

| Test | What it checks |
|------|---------------|
| `DB - can connect to test database` | `SELECT 1 AS alive` returns 1 |
| `DB - migrations created expected tables` | `users`, `roles`, `vehicles`, `garages` tables exist |
| `DB - seeded roles exist` | Roles table has `admin`, `customer`, `garage`, `vendor` |
| `DB - can insert and delete a user` | Full CRUD cycle: insert user, assign role via `user_roles`, verify join, cleanup |

**Mocking:** None. Uses real DB via the `query()` helper from `database.ts`.

---

### 3. `apps/api/src/middleware/auth.test.ts` — Auth Middleware (Unit)

**5 tests.** Tests the `authenticate` and `requireRole` Express middleware functions.

| Test | What it checks |
|------|---------------|
| `authenticate valid token` | Valid JWT → calls `next()`, populates `req.user` with decoded payload |
| `authenticate missing token` | No `Authorization` header → 401 + `UNAUTHORIZED` error code |
| `authenticate expired token` | Invalid/malformed token → 401 + `UNAUTHORIZED` error code |
| `requireRole checks user roles mapping from token` | User without required role → 403 `FORBIDDEN`; user with role → calls `next()` |
| `requireRole maps customer to user` | Role aliasing: `customer` in token satisfies `requireRole(['user'])` |

**Mocking:** `Pool.prototype.query` is mocked to return empty rows for `user_roles` lookups. JWT tokens are generated using the real `generateAccessToken` from `jwt.service`.

---

### 4. `apps/api/src/modules/auth/auth.service.test.ts` — JWT Service (Unit)

**3 tests.** Tests the token lifecycle functions: generation, verification, and DB-backed refresh token operations.

| Test | What it checks |
|------|---------------|
| `Access Token roundtrip` | Generate access token → verify → payload matches (userId, email, roles) |
| `Refresh Token roundtrip` | Generate refresh token → verify → userId matches |
| `Database-backed refresh token operations` | Store → validate → delete refresh token. Verifies correct SQL is issued (INSERT/DELETE) and params are correct |

**Mocking:** `Pool.prototype.query` is mocked to return a valid row for SELECT queries. Tracks all calls in `mockDbCalls` array for assertion.

---

### 5. `apps/api/src/modules/auth/auth.routes.test.ts` — Auth Routes (Integration)

**3 tests.** Tests the Express route handlers for `/auth/google`, `/auth/refresh`, and `/auth/logout`.

| Test | What it checks |
|------|---------------|
| `POST /auth/google creates user and returns tokens` | New user registration returns 200 with user object + access/refresh tokens |
| `POST /auth/refresh rotates tokens` | Valid refresh token → 200 with new access/refresh token pair |
| `POST /auth/logout invalidates refresh token` | Logout → 200 with success message |

**Mocking:** `Pool.prototype.query` is mocked with pattern-based routing: different SQL fragments return different mock data. Sets up a minimal Express app and routes requests through it via a custom `request()` helper.

---

### 6. `apps/api/src/modules/vehicles/vehicles.routes.test.ts` — Vehicle Routes (Integration)

**7 tests.** Tests the full CRUD operations on `/vehicles` endpoints with authentication and ownership checks.

| Test | What it checks |
|------|---------------|
| `GET /vehicles lists user's active vehicles` | Returns 200 with array of vehicles scoped to the authenticated user |
| `POST /vehicles adds a vehicle` | Creates vehicle → 201 with vehicle data + `customerId` matches token user |
| `GET /vehicles/:id returns vehicle details for owner` | Owner requests their vehicle → 200 with correct data |
| `GET /vehicles/:id returns 403 Forbidden for non-owner` | Non-owner requests vehicle → 403 "Access denied" |
| `DELETE /vehicles/:id soft deletes vehicle` | Owner deletes → 200 success, verifies SQL sets `is_active = false` |
| `PATCH /vehicles/:id updates vehicle details for owner` | Owner updates → 200 with updated fields |
| `PATCH /vehicles/:id returns 403 Forbidden for non-owner` | Non-owner update attempt → 403 "Access denied" |

**Mocking:** `Pool.prototype.query` is mocked with pattern matching for SELECT/INSERT/UPDATE/INSERT on vehicles. Generates a real JWT token for the test user and injects it via `Authorization: Bearer` header.

---

### 7. `apps/api/src/modules/diagnosis/diagnosis.service.test.ts` — Diagnosis Service (Unit)

**7 tests.** Tests the safety guardrail logic and input validation for the AI diagnosis feature.

| Test | What it checks |
|------|---------------|
| `applySafetyGuardrail correctly overrides high risk issues` | High risk level → DIY disabled, nextAction forced to `bookGarage` |
| `applySafetyGuardrail overrides safety-critical components (e.g. brakes)` | Issue name contains "brake" → forced to `bookGarage` even at medium risk |
| `applySafetyGuardrail overrides based on symptom keywords (e.g. steering)` | Symptom text contains "steering" → forced to `bookGarage` |
| `applySafetyGuardrail leaves safe issues alone` | Safe issue (wiper blades) at low risk → DIY stays allowed |
| `applySafetyGuardrail overrides based on safety_critical flag in matchedIssues` | Even at low risk, if knowledge base marks issue as `safety_critical: true` → forced to `bookGarage` |
| `runDiagnosis rejects invalid media mime types` | Sending `text/html` as image → rejection with MIME type error |
| `runDiagnosis rejects files exceeding size limits` | 11MB image (>10MB limit) → rejection with size error |

**Mocking:** None for guardrail tests (pure logic). The `runDiagnosis` validation tests use `assert.rejects` without hitting any external service.

---

### 8. `apps/api/src/modules/diagnosis/knowledge.service.test.ts` — Knowledge Service (Integration)

**3 tests.** Tests the `findMatchingIssues` function that queries the knowledge base database.

| Test | What it checks |
|------|---------------|
| `findMatchingIssues resolves matching issues from keywords` | Engine noise symptom → returns engine_noise category matches with correct issue data |
| `findMatchingIssues filters by category correctly` | Forcing `ac_not_cooling` category → only returns matches from that category |
| `findMatchingIssues handles vehicle specific filters` | Query with dummy make (Ferrari) → still matches (seed data has `makes = NULL` = all vehicles); verifies `safety_critical` and `diy_allowed` flags on brake issues |

**Mocking:** None. Hits real database with seeded knowledge base data.

---

## Web Tests

### 9. `apps/web/src/lib/api-client.test.ts` — API Client (Unit)

**5 tests.** Tests the frontend `apiClient` function that wraps `fetch` with auth, token refresh, and error handling.

| Test | What it checks |
|------|---------------|
| `Base URL construction` | Default URL `http://localhost:3000/api/v1/...`; custom URL via `NEXT_PUBLIC_API_URL` env var |
| `Auth header injection` | If `accessToken` exists in localStorage → `Authorization: Bearer <token>` header is sent |
| `Response envelope unwrapping` | Response `{ data: { id: 42 } }` → returns unwrapped `{ id: 42 }` |
| `Error normalization` | 401 response with error envelope → throws `ApiError` with correct `status`, `code`, `message`, `details` |
| `401 silent retry token refresh logic` | Expired token → client silently calls `/auth/refresh` with the refresh token → retries original request with new token → verifies localStorage is updated with new access token |

**Mocking:** `globalThis.fetch` is replaced with a mock that returns canned responses. `localStorage` is shimmed with an in-memory implementation. `window.dispatchEvent` is stubbed.

---

## Summary

| Area | Unit Tests | Integration Tests | Total |
|------|-----------|-------------------|-------|
| Config (`env`) | 3 | — | 3 |
| Config (`database`) | — | 4 | 4 |
| Middleware (`auth`) | 5 | — | 5 |
| Auth Service (`jwt.service`) | 3 | — | 3 |
| Auth Routes | — | 3 | 3 |
| Vehicles Routes | — | 7 | 7 |
| Diagnosis Service | 7 | — | 7 |
| Knowledge Service | — | 3 | 3 |
| Web API Client | 5 | — | 5 |
| **Total** | **23** | **17** | **40** |

### Integration vs Unit distinction

- **Integration tests** (prefixed with "DB -" or route tests that hit a mock DB through the full Express stack) require the test PostgreSQL container to be running.
- **Unit tests** run entirely in-memory with mocked `Pool.prototype.query` or no I/O at all.
- The `npm run test:api:unit` command filters out integration tests using `--test-name-pattern '^(?!.*DB)'`.

### Mocking patterns

- **DB mocking**: Most unit tests mock `Pool.prototype.query` at the prototype level using `node:test`'s `mock.method()`. Pattern-matching on SQL text strings routes to different mock responses.
- **Fetch mocking**: The web API client tests replace `globalThis.fetch` with a sequential mock that returns different responses per call index.
- **Express routing**: Route integration tests create a minimal Express app, mount the router, and use a custom `request()` helper that invokes `app.handle()` directly without a real HTTP server.
