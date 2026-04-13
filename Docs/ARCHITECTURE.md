# System Architecture

## 1. High-Level Architecture
- Frontend:
  - `apps/web` (Next.js)
  - `apps/mobile` (Expo React Native)
- Backend:
  - `apps/api` (Node.js + Express)
- Data:
  - MongoDB (document model)
  - Object storage for media uploads
- External services:
  - Payment gateway (Stripe-like)
  - Maps/location provider
  - Notifications (SMS/email/push)
  - LLM provider wrapper

## 2. Backend Module Architecture
Recommended feature modules under `apps/api/src/modules`:
- `auth`
- `users`
- `vehicles`
- `diagnosis`
- `garages`
- `quotes`
- `bookings`
- `payments`
- `marketplace`
- `orders`
- `reviews`
- `admin`
- `notifications`

Shared folders:
- `config`
- `middleware`
- `routes`
- `services`

## 3. API Security + RBAC Enforcement
- JWT authentication with role claims.
- Role resolution must use these MongoDB collections only:
  - `users`
  - `roles`
  - `user_roles`
- Central authorization middleware:
  - `requireAuth`
  - `requireRole([...])`
- `user_roles` is the source for user-role mapping; do not infer role from other business collections.
- Tenant scoping:
  - Customer resources scoped by `customer_id`
  - Garage resources scoped by `garage_id`
  - Vendor resources scoped by `vendor_id`
- Every write operation must produce audit logs.

## 4. Frontend Component Architecture (Strict)
All reusable UI primitives must be created once and consumed everywhere.

Required common component folders:
- Web: `apps/web/src/components/common`
- Mobile: `apps/mobile/src/components/common`

Required reusable primitives:
- Button
- SearchBar
- Filter
- Modal/Dialog
- Input controls
- Cards
- Status badges
- Toast/Alert

Enforcement rules:
- No duplicated primitive components inside feature folders.
- Feature modules can compose common components only.
- Variant-based styling (size, tone, state) must be centralized.

## 5. AI Architecture
Phase 1:
- LLM wrapper for multimodal symptom interpretation.
- Rule-based safety layer:
  - blocks unsafe DIY outputs
  - redirects major risk to booking discovery

Phase 2:
- Automotive-trained model for better accuracy and personalization.

## 6. Integrations
- Payment service adapter (authorize/capture/refund/webhook).
- Maps adapter (geocoding, distance, nearby discovery).
- Notifications adapter (email/SMS/push templates).
- Storage adapter for diagnosis media.
- Future adapter: car data APIs for OBD/vehicle telemetry expansion.

## 7. Operational Architecture
- Structured logging and centralized error handler.
- Event/audit trail for critical actions.
- Retry handling for external services.
- Webhook idempotency for payment state transitions.
