# Niwasthan Architecture

## Boundary

UI and route handlers call server services. Services own business rules and transactions. Repositories own persistence. Provider adapters are server-only and fail closed when not configured.

```text
UI
 -> app/api
 -> validators / auth
 -> services
 -> repositories
 -> Prisma/PostgreSQL

services -> BullMQ/Redis -> durable AIJob state -> AI/render provider adapters
services -> payments -> Razorpay adapter -> verified webhook -> purchase -> entitlement
services -> storage -> S3-compatible signed URLs
```

## Product pipeline

Property -> Floor Plan -> Room Understanding -> Design -> Revisions -> Catalogue -> Costing -> BOQ -> Apartment Visualization -> 3D -> 360° -> Walkthrough -> Cinematic Video.

Phase 0.1 establishes the durable persistence, lifecycle, queue, storage, AI, rendering, payments and entitlement boundaries for the complete pipeline. Concrete AI and rendering vendors remain replaceable provider adapters. The application never treats an unconfigured provider as a successful operation.

## Agentic Operations Layer

Niwasthan also has a cross-cutting **Agentic Operations Layer**. This is an operational control plane above the domain services, not a replacement for them.

```text
DOMAIN SERVICES
      |
      v
OPERATIONAL EVENTS / SIGNALS
      |
      +-----------------------------+
      |                             |
      v                             v
SPECIALIST OPERATIONS AGENTS    PROCESS LEAD AGENT
      |                             |
      |                             v
      |                       CORRELATE / PRIORITISE
      |                       / DIAGNOSE / ESCALATE
      |                             |
      +-------------+---------------+
                    v
          AUTHORISED DOMAIN ACTION
                    |
                    v
              DOMAIN SERVICES
```

Specialist agents monitor their assigned workflow, diagnose anomalies and perform only policy-authorised, bounded corrective actions. The Process Lead Agent correlates signals across property, design, catalogue, pricing, BOQ/budget, visualization, procurement, execution, customer journey, commercial and reliability workflows.

The canonical operating contract is documented in `docs/AGENTIC-OPERATIONS.md`.

Agents must use existing domain services and durable job infrastructure for mutations. They must not mutate Prisma state directly, bypass authorization, silently change locked decisions or invent business facts.

## Jobs

Every asynchronous operation receives a durable `AIJob` identity and idempotency key before it is queued. BullMQ provides retries and backoff; the database is authoritative for job state. A worker records `RUNNING` before provider execution and records `SUCCEEDED` only after a real provider result. Provider/configuration failures become explicit `FAILED` state.

Agent observation and remediation jobs should reuse this durable job infrastructure where appropriate. Autonomous remediation must have bounded retries/action counts and an explicit policy; an AI prompt is never an authorization mechanism.

## Operational events and reporting

Meaningful domain transitions should emit structured operational events containing safe scope, correlation/causation identifiers, timestamps, state transitions and severity where relevant. Events are facts; agent observations, hypotheses, decisions and actions are separate auditable records.

The Process Lead consumes these signals to produce reproducible operational report snapshots covering technical health, customer activity, commercial performance, value delivered, incidents, agent remediation, trends and founder decisions required. The reporting contract must distinguish verified facts from estimates, inferences and recommendations.

## Commercial system

Packages are backend-owned. Purchase creation reads the package from PostgreSQL, creates the provider order server-side and persists the provider order identifier. Paid entitlements are activated only from a signature-verified Razorpay webhook. The activation transaction is idempotent and creates the entitlement exactly once.

Commercial metrics consumed by agents must come from authoritative purchase/payment/entitlement state rather than browser success callbacks.

## Security

Secrets are server-only. Client-exposed environment variables must be explicitly prefixed and must never contain provider credentials. Authorization is enforced server-side. Asset keys are private identifiers. Security headers are applied globally. Redis-backed rate-limit primitives are available for abuse-sensitive endpoints.

Agent permissions are server-enforced. High-impact financial, security, legal, customer-facing and irreversible actions require the appropriate controlled or human approval boundary. Agent memory must not be the sole source of truth for customer or commercial decisions.
