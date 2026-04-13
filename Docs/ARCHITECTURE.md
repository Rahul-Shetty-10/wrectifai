# ARCHITECTURE.md
# WRECTIFAI System Architecture

## 1. Scope and Platform
- Primary client: Mobile app
- Secondary client: Web app
- Initial geography: US market
- Runtime configuration/content source: PostgreSQL (no hardcoded product content).

## 2. High-Level Architecture

### 2.1 Client Layer
- Mobile Client
  - User onboarding/auth
  - Vehicle management
  - AI diagnosis interaction
  - Quote comparison and booking
  - Marketplace checkout and payments
- Web Client
  - Customer and garage workflows (non-primary)
  - Admin access surfaces (if web-based in implementation)
  - Shadcn-based UI with globally controlled design tokens/theme

### 2.2 Backend Service Layer
- Auth Service
  - OTP login
  - Social login federation
  - Session/token handling
- Profile and Vehicle Service
  - Customer profile and vehicle lifecycle
  - Repair history and warranty records
- AI Diagnosis Service
  - LLM wrapper in Phase 1
  - Contextual follow-up questions
  - Multi-diagnosis response with risk and urgency
  - Draft quote generation with parts suggestion
- Quote and Booking Service
  - Issue raise flow
  - Quote submission/comparison
  - Appointment scheduling and lifecycle
- Garage and Vendor Service
  - Onboarding, verification status, offerings, and availability
  - Inventory and order management
- Payment Service
  - In-app checkout and transaction tracking
  - Invoice/receipt generation
- Ratings and Trust Service
  - Verified review enforcement
  - Trust score computation inputs (pricing consistency, complaint rate)
- Notification Service
  - SMS/email/push event dispatch
- Runtime Content Service
  - Serves app config, UI copy, workflow copy, and feature flags from PostgreSQL
  - Provides versioned content bundles per platform and locale
- Admin Service
  - Approval workflows
  - Platform governance and reporting

### 2.3 Data Layer
- PostgreSQL relational storage for:
  - Users, roles, profiles
  - Vehicles and history
  - Garages/vendors and verification
  - Quotes/bookings/payments
  - Reviews/complaints/trust metrics
  - Marketplace products/orders
  - Dynamic app content/config and workflow metadata

### 2.4 Integration Layer
- Maps and navigation
- Payment gateway (US-supported, e.g., Stripe)
- Notification engines (SMS/email/push)
- Future: Car data APIs for OBD/real-time diagnostics

## 3. Module Boundaries
- Clients never call external providers directly for protected operations.
- Backend owns all business rules for pricing labels, review eligibility, and booking state transitions.
- AI module does not execute payment or booking actions; it returns recommendations and draft outputs only.
- Admin actions are isolated behind admin role permissions.
- Clients render UI text/config from backend content endpoints backed by PostgreSQL.
- No hardcoded product copy, workflow labels, or user-facing decision rules in client code.
- Theme/color decisions are centralized globally (Shadcn tokens), not per-component hardcoded styles.

## 4. Security and Compliance Baselines
- Secure authentication and role-based authorization.
- API protection model: all APIs are protected by auth token except login/register entry endpoints.
- Encrypted user data and secure payment handling.
- Privacy policy and terms enforcement points in onboarding/checkout.
- No unsafe DIY suggestions for high-risk issues.

## 5. Non-Functional Priorities
- Scalability for multi-city and multi-country expansion.
- Multilanguage readiness.
- Reliability for booking and payment workflows.
- Observability on quote conversion, booking completion, and payment failures.

## 6. Phase-Oriented AI Architecture
- Phase 1: LLM wrapper for diagnosis and guidance.
- Phase 2+: Automotive-trained model for improved accuracy and predictive capabilities.

## 7. Engineering Standards (Implementation-Level)
- API-first contracts across clients and backend.
- Strict RBAC checks on every protected route.
- Event-driven notifications for lifecycle actions.
- Deterministic state transitions for booking/payment/review eligibility.
- Content-first rendering: app title, labels, forms, question banks, and policy links are loaded from PostgreSQL-backed content APIs.
- Shadcn theme governance: colors, radii, typography, and semantic tokens are defined in global theme files and consumed uniformly.
