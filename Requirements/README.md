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

## Mandatory Platform Rules
- Strict RBAC across all APIs and admin actions
- Component-first frontend architecture
- Reusable UI primitives in common component folders only
- No unsafe DIY guidance for high-risk diagnosis
- Reviews only by verified post-booking users
- Payments must happen inside platform (no off-platform settlement)
