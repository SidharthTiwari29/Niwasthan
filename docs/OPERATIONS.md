# Niwasthan Production Operations

## Scope

This document defines the operational boundary for the Phase 0 / Phase 0.1 production foundation. It is intentionally infrastructure-oriented: provider credentials are configuration, not fixtures, and an unavailable provider must fail explicitly.

The cross-cutting autonomous operations design is defined in `docs/AGENTIC-OPERATIONS.md` and is an architectural target until its implementation gates pass.

## Required configuration

Use `.env.example` as the canonical variable inventory. Never commit `.env`, credentials, API keys, private keys or signed URLs.

At minimum, production deployments require:

- PostgreSQL connection configuration.
- Auth.js secret and host configuration.
- OAuth/email provider configuration for the authentication methods enabled in production.
- Redis configuration when background workers are enabled.
- S3-compatible storage configuration for private assets.
- Razorpay configuration when payments are enabled.
- Provider-specific AI/rendering configuration only for capabilities that are actually enabled.

Keep secrets in the deployment platform's secret manager. Do not pass secrets to browser bundles or persist them in application logs.

## Database

- Apply committed Prisma migrations as part of a controlled deployment process.
- Run `npx prisma generate` during the build/install lifecycle used by production.
- Never use destructive development commands against production data.
- Treat schema migrations as immutable deployment artifacts.
- Review indexes, foreign keys and monetary precision before introducing high-volume writes.

## Authentication and authorization

Authentication is server-authoritative. Role checks must occur on the server before privileged operations.

Roles are:

- `USER`: normal customer access.
- `DESIGNER`: authorized design workflows.
- `ADMIN`: operational administration.
- `SUPER_ADMIN`: highest-privilege administration.

Do not rely on client-side route hiding as an authorization control. Administrator operations must use the server-side admin authorization boundary.

## Background jobs

Jobs are persisted in the database and designed to be idempotent and retryable. Workers must treat external calls as side effects:

1. Persist the job state before execution.
2. Claim work using the job's durable identity.
3. Execute the provider call only through the provider abstraction.
4. Persist success only after a real provider result is available.
5. Persist explicit failure/configuration state when execution cannot proceed.
6. Retry only according to the configured retry policy.

Never manufacture a successful AI, render, video or BOQ result because a provider is unavailable.

## Agentic operations

The target production model adds specialist Operations Agents and a Process Lead Agent above the domain services.

```text
Domain Services
      ↓
Operational Events / Signals
      ↓
Specialist Operations Agents
      ↓
Process Lead Agent
      ↓
Authorised Domain Actions
      ↓
Domain Services
```

Specialist agents observe, validate, diagnose, act within explicit server-side policy and verify recovery. The Process Lead correlates technical, customer, commercial and workflow signals and produces the founder report.

The initial specialist responsibilities are:

- Property / Spatial Operations
- Design Operations
- Catalogue / Product Intelligence
- Pricing / Deal / Savings
- BOQ / Budget
- Visualization
- Procurement
- Execution / Quality
- Customer Journey
- Commercial / Revenue Intelligence
- Security / Reliability

Agents must not mutate Prisma directly or bypass domain services. Autonomous actions must be bounded, idempotent where possible and auditable. Financially consequential, security-sensitive, legal, customer-impacting or irreversible actions require the appropriate controlled or human approval boundary.

## Object storage

All user assets are private by default. Object keys are generated server-side and namespaced by ownership. Signed URLs are short-lived and must not be logged or exposed as permanent identifiers.

Ownership is checked before asset creation and download/signing operations.

## Payments and entitlements

Paid entitlements are activated from verified provider events, not from a browser success callback. Webhooks must be signature-verified and processed idempotently.

Credit usage uses transactional reserve/confirm/release semantics. A failed external operation must not permanently consume reserved credits.

Commercial agents must use verified purchase/payment/entitlement state when reporting sales, upgrades, refunds and conversion outcomes.

## Observability and auditability

Operational logs should contain request/job identifiers, event type, duration and safe outcome metadata. Never log access tokens, passwords, provider secrets, signed URLs or raw payment credentials.

Security-sensitive and commercial mutations should remain auditable through the application's audit facilities.

Agent observations, decisions, actions and escalations must also be auditable. Agent memory must never be the only source of truth for customer or commercial state.

## CI and release gate

The clean-checkout CI chain is the release gate:

```text
format check → lint → Prisma generate → typecheck → tests → Prisma validate → production build → diff check
```

A red check is a release blocker. Environment-dependent provider integration may remain unconfigured in CI, but deterministic tests must prove the application's safe failure path.

## Incident handling

For authentication, payment, storage, AI or agent incidents:

1. Identify the affected capability and job/request/event IDs.
2. Stop or disable the affected provider integration if continued execution could create duplicate side effects.
3. Preserve database, event and audit records.
4. Reconcile payment/entitlement state before replaying work.
5. Disable autonomous remediation for the affected policy if it is producing repeated or unsafe actions.
6. Re-run idempotent jobs only after the underlying provider condition is understood.
7. Record the remediation and follow-up action in the operational change history.
8. Allow the Process Lead to report the incident only from persisted facts and clearly labelled inference/recommendation.

## Founder reporting

The target Process Lead report should provide:

- overall technical/workflow health;
- what is working well;
- visitors and customer activity;
- registrations, property uploads and active projects;
- designs, quotes and purchases;
- sales/GMV and average order value where authoritative data exists;
- upgrades, downgrades, refunds and cancellations;
- potential, accepted and realised/verified savings;
- incidents and customer/financial impact;
- problems the agents detected and fixed;
- recurring root causes and trends;
- areas for improvement;
- founder decisions required.

Reports must distinguish `VERIFIED FACT`, `ESTIMATE`, `INFERENCE`, `RECOMMENDATION` and `UNRESOLVED`. A suspected conversion cause or AI-estimated saving must never be presented as a verified business fact.

The intended delivery flow is:

```text
Operational Events
      ↓
Specialist Agent Analysis
      ↓
Process Lead Correlation
      ↓
Persisted Report Snapshot
      ↓
Report Validation
      ↓
Idempotent Email Delivery
      ↓
Delivery Audit
```

Daily reports are the default target. Critical security/payment/customer-impacting incidents use immediate escalation according to policy. Weekly reports should add trend and root-cause analysis.

## Product-scope guardrail

The production foundation must not be simplified into an image-generation demo. Future phases must preserve the end-to-end model of property, floor plan, room understanding, design revisions, real catalogue/costing/BOQ, actual-apartment visualization, 3D/360/walkthrough/video generation, purchase and execution.
