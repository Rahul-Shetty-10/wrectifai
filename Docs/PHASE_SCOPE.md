# Phase Scope

## Phase 0: Foundation (Completed / In Progress)
- Nx monorepo setup
- apps/api, apps/web, apps/mobile structure
- base architecture and requirements baseline

## Phase 1: MVP (From PRD)
### In Scope
- AI diagnosis (basic multimodal wrapper)
- Vehicle onboarding and management
- Garage onboarding with admin approval
- Garage discovery and filtering
- Booking (instant + quote-based)
- In-app payments
- Ratings and verified reviews
- Trust badges (Top Rated, Budget Friendly, EV Specialist)
- Basic spare-parts marketplace
- Flexible fulfillment model (in-house or third-party shipping integration ready)
- Strict RBAC and audit logging
- Component-first frontend with reusable common components

### Explicitly Out of Scope
- Predictive maintenance
- Real-time OBD diagnostics
- Insurance integration
- Emergency roadside assistance
- Human mechanic live chat

## Phase 2: Intelligence and Expansion
- Automotive-trained diagnosis model
- Better recommendation quality
- Expanded trust and anti-fraud scoring
- Logistics improvements and vendor scaling
- Monetization expansion: listing fee automation and premium subscriptions

## Phase 3: Advanced Platform
- Predictive maintenance
- OBD/telemetry integrations
- Insurance partnerships
- Roadside assistance partnerships

## Release Gates for MVP
- Functional: all P0 user journeys pass
- Security: authz tests for RBAC boundaries pass
- Payments: webhook + reconciliation tested
- Data: schema constraints and indexes validated
- UX: common component reuse confirmed (no duplicate primitives)
