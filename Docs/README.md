# Wrectifai Requirements

This folder contains implementation-ready requirements derived from `WRECTIFAI PRD V_0.1.pdf`.

## Source of Truth
- PRD reviewed twice: `WRECTIFAI PRD V_0.1.pdf`
- Scope: US launch, mobile-first with web support

## Documents
- `SPEC.md`: full product and engineering specification
- `APP_FLOW.md`: detailed user and system flows
- `ARCHITECTURE.md`: system architecture and component architecture
- `DATA_API.md`: API contracts and RBAC matrix
- `schema.md`: database schema, relations, and constraints
- `PHASE_SCOPE.md`: MVP and phased roadmap
- `solutions/`: technical logs and step-by-step implementation notes for each Sprint
- `solutions/2026-07-06-ai-diagnosis-architecture.md`: full technical specification of the RAG-grounded AI Diagnosis Engine

## Mandatory Platform Rules
- Strict RBAC across all APIs and admin actions (using the `user_roles` database table)
- Component-first frontend architecture (reusable UI primitives in common components only)
- No unsafe DIY guidance for high-risk diagnosis (enforced via safety guardrails on vehicle subsystems)
- Reviews only by verified post-booking users
- Payments must happen inside the platform (no off-platform settlement)
- Raw SQL only for database operations (no ORMs)

