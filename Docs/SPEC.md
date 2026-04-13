# SPEC.md
# WRECTIFAI Functional Requirements Specification

## 1. Purpose
This specification translates PRD v0.3 requirements into concrete, testable MVP behaviors for WRECTIFAI.

## 2. Roles
- User (Customer)
- Garage (Rectifier)
- Vendor
- Admin

Phase-1 note:
- Active implementation roles from `task.md`: `user`, `garage`, `admin`.

## 3. Functional Requirements

### 3.0 Dynamic Configuration and Content (PostgreSQL)
- `FR-CFG-001`: System shall load app identity (including app name) from PostgreSQL at runtime.
- `FR-CFG-002`: System shall load all user-visible UI copy from PostgreSQL-backed content APIs.
- `FR-CFG-003`: System shall load workflow labels, guided questions, and lookup options from PostgreSQL.
- `FR-CFG-004`: System shall load feature flags and role visibility rules from PostgreSQL.
- `FR-CFG-005`: Frontend shall not rely on hardcoded runtime product content.
- `FR-CFG-006`: Seed JSON files shall only initialize PostgreSQL tables; runtime reads must query PostgreSQL.
- `FR-UI-001`: Shadcn UI theme tokens (colors, typography, spacing/radius semantics) shall be centrally defined at global level and reused across all screens.
- `FR-UI-002`: Components shall consume global theme tokens; no page-level hardcoded color palette overrides for core branding.

Acceptance checks:
- Changing app name in DB updates both web and mobile without code changes.
- Changing button label/content key in DB updates UI on next content fetch/version refresh.
- Disabling feature flag in DB hides/blocks feature without redeploy.

### 3.1 Authentication and Onboarding
- `FR-AUTH-001`: System shall support OTP-based sign-in for customers.
- `FR-AUTH-002`: System shall support social sign-in via Google and Apple.
- `FR-AUTH-003`: Customer onboarding shall capture name and required basic details.
- `FR-AUTH-004`: System shall enforce role-based access controls across all protected functions.
- `FR-AUTH-005`: API protection shall be token-based by default; only login/register entry endpoints are public.

Acceptance checks:
- User can complete OTP flow and access customer area.
- Role-restricted endpoint access is denied for unauthorized roles.
- Requests to protected APIs without valid token are rejected.

### 3.2 Vehicle Management
- `FR-VEH-001`: Vehicle onboarding shall be mandatory before diagnosis or booking.
- `FR-VEH-002`: Customer shall be able to add multiple vehicles.
- `FR-VEH-003`: Required vehicle fields: make, model, year, fuel type.
- `FR-VEH-004`: Optional fields: mileage, trim, engine type, VIN/chassis.
- `FR-VEH-005`: System shall support VIN/plate/RC-assisted auto-population with user validation.
- `FR-VEH-006`: Customer shall be able to edit, delete, and set default vehicle.

Acceptance checks:
- Attempting diagnosis without a vehicle returns onboarding requirement.
- User can update default vehicle and retrieve it as default.

### 3.3 AI Diagnosis
- `FR-DIAG-001`: System shall accept diagnosis input via text, image, video, and audio.
- `FR-DIAG-002`: System shall ask contextual follow-up questions.
- `FR-DIAG-003`: System shall return one or more possible diagnoses with short explanations.
- `FR-DIAG-004`: Each diagnosis suggestion shall include urgency and risk-if-ignored.
- `FR-DIAG-005`: System shall provide DIY guidance only for safe/minor issues.
- `FR-DIAG-006`: For high-risk issues, system shall route user toward garage booking flow.
- `FR-DIAG-007`: AI shall use available vehicle history to improve relevance.
- `FR-DIAG-008`: AI output shall include draft quotation hints with suggested parts and pricing context.
- `FR-DIAG-009`: AI diagnosis response shall strictly conform to JSON schema with `possible_issues`, `urgency`, `diy_allowed`, `risk`, `next_questions`.

Acceptance checks:
- High-risk category response contains no DIY steps.
- Multi-issue responses allow user issue selection.

### 3.4 Quote System and Booking
- `FR-QUOTE-001`: Customer shall be able to raise issue requests for garage quotations.
- `FR-QUOTE-002`: Garages shall submit quotes against issue requests.
- `FR-QUOTE-003`: Customer shall compare multiple quotes and select one.
- `FR-QUOTE-004`: System shall generate fair price estimate with min-max, parts, labor, confidence.
- `FR-QUOTE-005`: System shall label quotes as below market, fair, or above market.
- `FR-QUOTE-006`: AI shall recommend best quotation based on trust and pricing factors.
- `FR-QUOTE-007`: Quote classification (below/fair/above) shall be computed by backend from PostgreSQL seed price references.
- `FR-BOOK-001`: Customer shall create appointment with date/time and mode (self check-in/home pickup).
- `FR-BOOK-002`: Customer and garage shall support reschedule/cancel handling per permissions.
- `FR-BOOK-003`: Garage shall accept/reject bookings and manage appointment status.

Acceptance checks:
- Selected quote can be converted into booking.
- Booking cannot reach service-complete without a valid lifecycle progression.

### 3.5 Garage Ecosystem
- `FR-GAR-001`: Garage onboarding shall support self-registration.
- `FR-GAR-002`: Garage activation shall require admin approval.
- `FR-GAR-003`: Garage profile shall include specializations and business hours.
- `FR-GAR-004`: Garage profile shall support document/image/certification submission.
- `FR-GAR-005`: Garage shall manage appointment queue and quote responses.
- `FR-GAR-006`: System shall expose a garage registration action compatible with `POST /garages/register` for phase-1 flow.

Acceptance checks:
- Unapproved garage cannot submit quotes.
- Approved garage can set availability and manage bookings.

### 3.6 Marketplace
- `FR-MKT-001`: Marketplace shall support parts listing from platform, garages, and vendors.
- `FR-MKT-002`: System shall support AI-based parts recommendations and DIY kit suggestions.
- `FR-MKT-003`: Marketplace shall support inventory and order management baseline.
- `FR-MKT-004`: Delivery mode shall allow in-house or third-party logistics.

Acceptance checks:
- Customer can place order and track status transitions.

### 3.7 Payments
- `FR-PAY-001`: Payments for service booking shall be mandatory in-app.
- `FR-PAY-002`: Supported methods shall include card, Apple Pay, and Google Pay.
- `FR-PAY-003`: System shall generate receipt/invoice and expose payment history.

Acceptance checks:
- Booking confirmation requires successful payment status.
- Failed payments are recorded and visible in transaction history.

### 3.7A Notifications
- `FR-NOTIF-001`: System shall provide notification categories: System, Bookings, and Reminders.
- `FR-NOTIF-002`: System shall expose APIs to retrieve notifications and mark a notification as read.

Acceptance checks:
- User can fetch notifications and update `is_read` state.

### 3.8 Ratings, Trust, and Complaints
- `FR-REV-001`: Only verified post-booking users shall be able to submit reviews.
- `FR-REV-002`: Review dimensions shall include price, quality, time, and behavior.
- `FR-REV-003`: System shall allow complaint reporting for overcharging/poor service.
- `FR-TRUST-001`: Trust score inputs shall include pricing consistency and complaint rate.

Acceptance checks:
- Non-verified user review submission is rejected.
- Complaint creation is linked to booking and garage.

### 3.9 Admin and Reporting
- `FR-ADM-001`: Admin shall approve/reject garage and vendor onboarding.
- `FR-ADM-002`: Admin shall manage users, bookings, quotes, payments, and complaints.
- `FR-ADM-003`: Admin shall access analytics for usage, bookings, repair trends, and revenue.

Acceptance checks:
- Admin-only actions are denied to non-admin roles.

## 4. Non-Functional Requirements
- US launch readiness.
- Scalability for future geography expansion.
- Multilanguage readiness.
- Secure authentication and encrypted data handling.
- Secure payment processing.
- Configuration-driven UX: all runtime text/config comes from PostgreSQL.

## 5. Explicit MVP Exclusions
- Predictive maintenance.
- Real-time OBD diagnostics.
- Insurance integrations.
- Emergency roadside assistance.
