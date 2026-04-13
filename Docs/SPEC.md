# Product Specification (MVP)

## 1. Product Summary
WRECTIFAI is an AI-powered automotive assistance platform for the US market that combines:
- AI diagnosis
- Garage discovery and booking
- Quote-based service marketplace
- Spare-parts marketplace
- In-app payments
- Vehicle lifecycle records

Primary platforms:
- Mobile app (primary)
- Web app (support)

## 2. User Roles
- Customer
- Garage (Rectifier)
- Vendor
- Admin

## 3. Strict RBAC Requirements
All APIs must enforce role and permission checks server-side.

Base rule set:
- Customer can manage only their own profile, vehicles, bookings, orders, and reviews.
- Garage can manage only its own garage profile, services, slots, quotes, parts listings, and booking updates assigned to it.
- Vendor can manage only its own catalog, inventory, and order fulfillment states.
- Admin has elevated platform controls including onboarding approvals, compliance checks, dispute handling, and payment monitoring.

Additional rules:
- No direct access to another tenant's records.
- Soft-deleted records are hidden by default for non-admin roles.
- Permission checks must be audited (who, when, action, resource).

## 4. Functional Requirements
### 4.1 AI Diagnosis
- Inputs: text, image, video, audio.
- Outputs: probable issue(s), confidence score, risk level, recommended action.
- Safety policy:
  - High-risk diagnosis cannot return DIY instructions.
  - High-risk diagnosis must direct user to garage flow.
- AI diagnosis should use stored vehicle history context to improve relevance and accuracy.
- Diagnosis must include disclaimers (assistant guidance, not guaranteed mechanical certification).

### 4.2 Vehicle Management
- Vehicle onboarding is mandatory before full diagnosis/booking.
- Customer can add multiple vehicles.
- Vehicle records include: make, model, year, VIN(optional), mileage, warranty fields.
- Service history must be attachable to each vehicle.

### 4.3 Garage Ecosystem
- Self-registration with admin approval.
- Verification via document + images + certifications.
- Garage profile includes specialization, certifications, service area, pricing signals.
- Booking models:
  - Instant booking
  - Quote-based booking (primary USP)

### 4.4 Marketplace
- Sellers: platform first-party, garages, vendors.
- Product catalog and inventory required.
- AI-assisted part suggestions based on diagnosis + vehicle context.
- Logistics must support either in-house fulfillment or third-party shipping integration.

### 4.5 Payments
- In-app payment is mandatory for booking/order completion.
- Support commissions, listing fees, subscriptions (phase-based rollout).
- Payment events must be reconciled and auditable.

### 4.6 Ratings and Trust
- Reviews only from verified customers with completed booking.
- Rating dimensions: price, quality, time, behavior.
- Badge eligibility based on rating and fulfillment metrics.
- Initial trust badges: Top Rated, Budget Friendly, EV Specialist.

### 4.7 Discovery
- Auto location + manual location search.
- Filters: distance, price, rating, specialization.

## 5. Component-First Frontend Requirements
All UI must be built from reusable components.

Mandatory shared component locations:
- Web: `apps/web/src/components/common/*`
- Mobile: `apps/mobile/src/components/common/*`

Must be reusable components (not page-local duplicates):
- Button
- Input
- SearchBar
- Select/Dropdown
- FilterSheet / FilterPanel
- Modal / Dialog
- Toast / Alert
- Card
- Pagination
- EmptyState
- Skeleton loader

Rule:
- Page/screen code can compose components but cannot re-implement primitive behavior/styles already present in common components.

## 6. Non-Functional Requirements
- Security: JWT-based auth, encrypted secrets, secure payment flow.
- Availability: graceful degradation for AI service outages.
- Observability: structured logs, audit logs, error tracking.
- Performance:
  - P95 API latency targets for read APIs under normal load.
  - Image/video/audio uploads via pre-signed URLs.
- Compliance:
  - Data retention policy.
  - US privacy and consent handling.

## 7. Out of Scope (MVP)
- Predictive maintenance
- Real-time OBD telemetry diagnostics
- Insurance integrations
- Roadside assistance orchestration
- Live mechanic chat

## 8. Acceptance Criteria (MVP)
- Customer can complete diagnosis -> booking -> payment -> review flow.
- Garage and vendor onboarding is approval-gated by admin.
- Quote flow supports request, multiple quotes, selection, booking conversion.
- Marketplace supports add-to-cart, checkout, order tracking states.
- RBAC violations return authorization errors and generate audit entries.
