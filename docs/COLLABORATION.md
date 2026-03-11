# Agent Collaboration Spec

How agents work together on complex tasks.

## Collaboration Flow

```
Feature Request
     │
     ▼
┌─────────────────┐
│ Product Manager │ ← Requirements, scope, priorities
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────────┐
│  UX   │  │  Backend  │
│Designer│  │ Architect │
└───┬───┘  └─────┬─────┘
    │            │
    │     ┌──────┴──────┐
    │     ▼             ▼
    │  ┌───────┐  ┌──────────┐
    │  │  API  │  │ Database │
    │  │ Spec  │  │  Schema  │
    │  └───┬───┘  └────┬─────┘
    │      │           │
    ▼      ▼           │
┌─────────────────┐    │
│    Frontend     │◄───┘
│    Developer    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌───────┐ ┌────────┐ ┌──────────┐
│ A11y  │ │Security│ │   Code   │
│Auditor│ │Engineer│ │ Reviewer │
└───────┘ └────────┘ └──────────┘
         │
         ▼
    ┌─────────┐
    │  Done   │
    └─────────┘
```

## Handoff Protocol

Each agent specifies:

### Before You Start (← Dependencies)

```markdown
## Before You Start

← Product Manager: Confirm requirements and acceptance criteria
← UX Designer: Get component specs and design tokens
← Backend Architect: Confirm API contract exists (OpenAPI spec)
← Check: Is there an existing component/pattern that does this?
```

### After You're Done (→ Handoffs)

```markdown
## After You're Done

→ Accessibility Auditor: Review for WCAG compliance
→ Security Engineer: Review auth/input handling
→ Code Reviewer: PR review before merge
→ Performance Benchmarker: Check Lighthouse/load tests
```

## Agent Relationships

| Agent | Depends On | Hands Off To |
|-------|------------|--------------|
| Product Manager | Stakeholders | UX, Backend, Frontend |
| UX Designer | Product Manager | Frontend Developer |
| Backend Architect | Product Manager | Frontend, Security, DevOps |
| Frontend Developer | UX, Backend | A11y, Security, Code Review |
| Security Engineer | Any code changes | DevOps |
| Code Reviewer | Any PR | Merge |
| DevOps | Code Review pass | Production |

## Blocking vs Non-Blocking

### Blocking Dependencies (must wait)

- Frontend → Backend API spec (can't build without contract)
- Security review → Merge (can't ship without sign-off)
- Database migration → Deploy (schema must exist)

### Non-Blocking Dependencies (can proceed in parallel)

- Frontend ↔ Backend implementation (if spec agreed)
- A11y audit ↔ Performance benchmark
- Docs ↔ Implementation

## Conflict Resolution

When agents disagree:

```
Priority Order:
1. Security concerns (always wins)
2. User accessibility (legal requirement)
3. Performance (measurable impact)
4. Code style (defer to project conventions)
5. Personal preference (defer to code owner)
```

## Example: Adding User Authentication

```
1. Product Manager
   └─ Defines: OAuth providers, session length, 2FA requirement

2. Backend Architect (parallel with UX)
   └─ Designs: Auth endpoints, token storage, session management
   └─ Outputs: OpenAPI spec, database schema

3. UX Designer (parallel with Backend)
   └─ Designs: Login flow, error states, loading states
   └─ Outputs: Figma specs, design tokens

4. Frontend Developer (after 2 & 3)
   └─ Implements: Login form, auth context, protected routes
   └─ Inputs: API spec from Backend, specs from UX

5. Security Engineer (parallel review)
   └─ Reviews: Token handling, CSRF, session fixation

6. Accessibility Auditor (parallel review)
   └─ Reviews: Form labels, focus management, error announcements

7. Code Reviewer (after implementation)
   └─ Reviews: Code quality, test coverage, patterns

8. DevOps (after review)
   └─ Deploys: Feature flag, monitoring, rollback plan
```

## Communication Format

When handing off, include:

```markdown
## Handoff: [From Agent] → [To Agent]

**What was done:**
- Implemented X
- Added Y
- Configured Z

**What you need to review:**
- [ ] Check A
- [ ] Verify B
- [ ] Test C

**Known issues/decisions:**
- Chose approach X because Y
- Deferred Z to future iteration

**Files changed:**
- `src/auth/login.tsx` - Login form
- `src/hooks/useAuth.ts` - Auth hook
- `prisma/migrations/xxx` - User table
```

## Agent Availability

Not all agents are needed for every task:

| Task Type | Required Agents | Optional Agents |
|-----------|-----------------|-----------------|
| Bug fix (UI) | Frontend, Code Review | A11y if visible change |
| Bug fix (API) | Backend, Code Review | Security if auth-related |
| New feature | PM, UX, Frontend, Backend, Security, Review | Performance, A11y |
| Refactor | Code Review | Performance if perf-related |
| Docs only | Code Review | None |
| Config change | DevOps | Security if secrets |
