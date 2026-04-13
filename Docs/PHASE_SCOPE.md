# PHASE_SCOPE.md
# WRECTIFAI Phase Scope and Delivery Plan

## 1. Product Delivery Principle
- Build around the MVP journey: diagnosis -> quote comparison -> booking -> payment -> review.
- Keep mobile-first execution while maintaining web app support.
- Enforce trust, safety, and RBAC from day one.

## 2. Phase 1 (MVP - In Scope)
From PRD MVP include section and core flow requirements.

### 2.1 Core Features In Scope
- AI diagnosis (basic) with contextual follow-up.
- Garage onboarding and approval flow.
- Quote-based system for issue requests.
- Booking and appointment management baseline.
- Mandatory in-app payments (card/Apple Pay/Google Pay).
- Ratings and verified reviews.
- Basic spare parts marketplace.

### 2.2 Supporting Capabilities In Scope
- Customer onboarding (OTP + profile basics).
- Vehicle onboarding and management baseline.
- Fair price estimate and quote labels (below/fair/above market).
- Notification integration (OTP/booking/reminder/payment events).
- Admin capability to manage approvals and operational entities.
- PostgreSQL-driven runtime config/content system (app name, UI copy, labels, prompts, feature flags) with no hardcoded product copy.
- Phase-1 active roles and workflows: `user`, `garage`, `admin` (vendor flow can be enabled in later phase).

## 3. Explicitly Out of Scope for MVP
From PRD exclude and future roadmap.

- Predictive maintenance.
- OBD/real-time diagnostics.
- Insurance integration.
- Emergency roadside assistance.
- Human mechanic chat.
- Expanded partner ecosystem (banks, parking centers, gift vouchers, insurance tie-ups).

## 4. Phase 2+ Direction
- Automotive-trained AI model for improved diagnosis quality.
- Real-time OBD integration and deeper car data API usage.
- Predictive maintenance workflows.
- Extended ecosystem integrations and advanced monetization features.

## 5. Priority Order (Execution)
1. Authentication, onboarding, and RBAC foundation.
2. Vehicle management and diagnosis flow.
3. Issue raise, quote comparison, and booking lifecycle.
4. Payment completion and receipt history.
5. Ratings/trust and basic marketplace stabilization.
6. Admin monitoring and analytics baseline.

## 6. Scope Control Rules
- Any requirement not in Phase 1 sections must be logged as Phase 2+ candidate.
- No feature enters MVP without clear linkage to core journey KPIs (quote conversion, booking completion, paid transaction rate).
- Safety and trust rules are non-negotiable and not deferrable.
- Dynamic content governance is mandatory: runtime product content must be editable via PostgreSQL records, not code edits.
