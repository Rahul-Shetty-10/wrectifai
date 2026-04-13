# DATA_API.md
# WRECTIFAI Data and API Contract

## 1. Data Contract (Logical Entities)
- `User`: identity, role, auth source, profile basics.
- `Vehicle`: vehicle core attributes, optional identifiers, ownership.
- `VehicleHistory`: repairs, services, pricing, timeline.
- `Garage`: business profile, verification, specializations, availability.
- `Vendor`: spare-parts seller profile and status.
- `IssueRequest`: user-raised diagnostic request.
- `Quote`: garage response to issue request with parts/labor pricing.
- `Booking`: selected quote converted into appointment lifecycle.
- `Payment`: in-app transaction and receipt linkage.
- `Review`: verified post-booking feedback.
- `Complaint`: service quality or overcharging report.
- `Part` / `Order`: marketplace catalog and purchase flow.
- `AppConfig`: global runtime configuration (app name, branding, legal links, support metadata).
- `UiContent`: key-value content catalog for all user-visible copy by locale/platform.
- `FeatureFlag`: runtime toggles for feature enablement and role visibility.
- `WorkflowDefinition`: DB-defined step metadata and question catalogs used by guided flows.
- `SeedDiagnosis` / `SeedPrice` / `SeedPart`: DB tables loaded from JSON seed files for controlled MVP logic.

## 2. Relationship Contract
- One user can own many vehicles.
- One user can raise many issue requests.
- One issue request can receive many quotes (from many garages).
- One booking is created from exactly one selected quote.
- One booking can have zero or one payment record.
- Reviews are allowed only when booking status is completed and tied to that booking.
- Garage/vendor operations are enabled only after admin approval.

## 3. Access Rules (RBAC)
- Customer:
  - Can manage own profile/vehicles/issues/bookings/payments/reviews.
  - Cannot approve garages/vendors or access platform analytics.
- Garage:
  - Can manage own profile, availability, quotes, and assigned bookings.
  - Can view relevant customer request context and available vehicle history.
- Vendor:
  - Can manage own inventory and order processing.
- Admin:
  - Can approve/reject garages/vendors.
  - Can manage users, pricing database references, bookings, quotes, payments, complaints.

Phase note:
- Phase 1 implementation can run with `user`, `garage`, and `admin` active roles (per task.md), while keeping vendor contracts reserved.

## 4. API Surface (MVP-Oriented)

### 4.1 Authentication
Public (no auth token required):
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `POST /auth/social/google`
- `POST /auth/social/apple`

If explicit register endpoints are introduced, they are public:
- `POST /auth/register` (if implemented)

### 4.2 Profile and Vehicle
- `GET /me`
- `PATCH /me`
- `POST /vehicles`
- `GET /vehicles`
- `GET /vehicles/{vehicleId}`
- `PATCH /vehicles/{vehicleId}`
- `DELETE /vehicles/{vehicleId}`
- `POST /vehicles/{vehicleId}/set-default`

### 4.3 AI Diagnosis
- `POST /diagnosis/sessions`
  - Input: vehicleId + symptom payload (text/image/video/audio/common symptoms)
  - Output: possible issues, urgency, risk, draft quote hints, DIY eligibility
- `POST /diagnosis/sessions/{sessionId}/answers`
  - Input: follow-up answers
  - Output: refined diagnosis and recommendations

### 4.4 Issue, Quote, and Booking
- `POST /issues`
- `GET /issues/{issueId}`
- `POST /issues/{issueId}/quotes` (garage)
- `GET /issues/{issueId}/quotes`
- `POST /quotes/{quoteId}/select`
- `POST /garages/register` (phase-1 onboarding API from task.md)
- `POST /bookings`
- `GET /bookings`
- `PATCH /bookings/{bookingId}` (reschedule/cancel/status changes by authorized role)

Auth note:
- Endpoints in sections 4.2 to 4.10 are protected and require a valid authentication token.

### 4.5 Payments
- `POST /payments/intent`
- `POST /payments/confirm`
- `GET /payments/history`
- `GET /payments/{paymentId}/receipt`

### 4.6 Reviews and Complaints
- `POST /bookings/{bookingId}/reviews`
- `GET /garages/{garageId}/reviews`
- `POST /bookings/{bookingId}/complaints`

### 4.7 Marketplace
- `GET /parts`
- `GET /parts/{partId}`
- `POST /orders`
- `GET /orders`

### 4.8 Admin
- `POST /admin/garages/{garageId}/approve`
- `POST /admin/vendors/{vendorId}/approve`
- `GET /admin/analytics/overview`

### 4.9 Runtime Content and Config (PostgreSQL-backed)
- `GET /runtime/app-config`
- `GET /runtime/content?locale={locale}&platform={platform}`
- `GET /runtime/feature-flags`
- `GET /runtime/workflows/{workflowKey}`
- `GET /runtime/lookups/{lookupKey}` (symptoms, urgency labels, booking options, etc.)
- `GET /runtime/seed/diagnosis`
- `GET /runtime/seed/pricing`
- `GET /runtime/seed/parts`

### 4.10 Notifications
- `GET /notifications`
- `PATCH /notifications/{id}/read`

## 5. Contract Rules
- API security default: every endpoint requires a valid authentication token unless explicitly marked public.
- Public endpoint scope is limited to login/register entry endpoints in section 4.1.
- All write APIs require authenticated identity and role validation.
- Payments must be processed in-app before booking reaches confirmed-paid state.
- Quote comparison labels (below/fair/above market) must be backend-generated for consistency.
- Review creation must fail if booking is not completed by the reviewing user.
- DIY instructions must be blocked for high-risk diagnosis categories.
- Frontend must not ship hardcoded product copy for runtime screens; it must consume `/runtime/*` APIs.
- Seed JSON files are import-only artifacts; runtime execution must query PostgreSQL tables.
