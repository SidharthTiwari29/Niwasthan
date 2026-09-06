# Niwasthan Agentic Operations

**Status:** Target architecture / implementation contract

This document extends the canonical Niwasthan product vision with an **Agentic Operations Layer**. It does not claim that these agents are already production-complete. A capability becomes operationally live only after its implementation, persistence, authorization, tests, CI and deployment evidence pass the repository acceptance gates.

## 1. Purpose

Niwasthan should operate as a self-monitoring, self-diagnosing and selectively self-healing business platform.

Every critical workflow has a specialised **Operations Agent** responsible for:

1. continuously observing its workflow;
2. validating outcomes against domain invariants and service-level expectations;
3. detecting anomalies, failures, bottlenecks and data-quality problems;
4. diagnosing likely root causes using authoritative application state;
5. performing only explicitly authorised corrective actions;
6. validating that the correction actually worked;
7. recording the incident, decision and action in an auditable form;
8. escalating unresolved, high-risk or irreversible matters to the **Process Lead Agent**.

The Process Lead Agent is the cross-functional operational intelligence layer. It coordinates specialist agents, correlates signals across the complete customer journey, prioritises issues, identifies systemic causes and produces management reports.

## 2. Relationship to the Niwasthan product graph

The agent layer sits above the existing domain services. It must not become a second business-logic implementation.

```text
Customer / Business Workflow
            |
            v
      Domain Services
            |
            v
     Domain Events / Signals
            |
            v
   Agentic Operations Layer
            |
     +------+------+
     |             |
     v             v
Specialist      Process Lead
Agents            Agent
     |             |
     +------+------+
            |
            v
   Authorised Actions
            |
            v
      Domain Services
```

The agent reads authoritative state from the database and domain services. It requests actions through existing service boundaries rather than mutating Prisma records directly.

## 3. Specialist agent roster

### 3.1 Property & Spatial Operations Agent

Owns operational monitoring for:

- property creation;
- floor-plan upload and analysis;
- room detection;
- dimensions and geometry observations;
- user corrections;
- spatial consistency;
- confidence/uncertainty states;
- failed or stalled spatial jobs.

Typical corrective actions:

- retry an idempotent analysis;
- requeue a failed job;
- reconcile stale job state;
- request human review when geometry confidence is insufficient.

It must never invent dimensions or silently convert an inference into confirmed spatial truth.

### 3.2 Design Operations Agent

Monitors:

- design generation;
- design directions;
- revisions;
- locked decisions;
- downstream impact propagation;
- design-quality validation;
- stale or inconsistent design state.

It can safely trigger downstream recalculation where the existing domain contract permits it, such as regenerating an affected BOQ after an approved design change.

It must never modify a `LOCKED` decision without an explicit user-authorised unlock/change workflow.

### 3.3 Catalogue & Product Intelligence Agent

Monitors:

- source ingestion;
- product identity;
- variant/SKU matching;
- duplicate candidates;
- provenance;
- price observations;
- freshness;
- availability;
- warranty evidence;
- source failures.

It can request revalidation or quarantine suspicious observations. It must not fabricate missing catalogue facts.

### 3.4 Pricing / Deal / Savings Agent

Monitors:

- price changes;
- stale price observations;
- same-SKU opportunities;
- equivalent-specification alternatives;
- upgrade/downgrade economics;
- project-level savings;
- expired or invalid deal signals.

Every savings claim must retain its calculation basis, source/evidence state and timestamp.

### 3.5 BOQ & Budget Operations Agent

Monitors:

- BOQ generation;
- quantity anomalies;
- catalogue-rate linkage;
- budget variance;
- revision propagation;
- stale totals;
- finalised snapshot integrity.

It can initiate deterministic recalculation where permitted. It must not rewrite a finalised BOQ or locked budget silently.

### 3.6 Visualization Operations Agent

Monitors:

- AI/render jobs;
- provider latency;
- provider failures;
- asset creation;
- asset availability;
- design-version linkage;
- 3D/panorama/walkthrough/video lifecycle.

It can retry idempotent work and route work according to configured provider policy. Provider failure must remain an explicit failure, never a fabricated success.

### 3.7 Procurement Operations Agent

Monitors:

- approved product selections;
- RFQs;
- quotes;
- seller status;
- order state;
- delivery;
- installation;
- substitutions;
- commercial reconciliation.

Financially consequential or irreversible actions require the relevant approval boundary.

### 3.8 Execution & Quality Agent

Monitors:

```text
SITE
 -> DELIVERY
 -> INSTALLATION
 -> QUALITY CHECK
 -> SNAG
 -> RESOLUTION
 -> HANDOVER
```

It identifies stalled milestones, recurring quality issues and unresolved snags, and escalates execution risks before they become customer complaints.

### 3.9 Customer Journey Agent

Monitors the funnel:

```text
VISITOR
 -> SIGNUP
 -> PROPERTY
 -> DESIGN
 -> PRODUCT DISCOVERY
 -> QUOTE
 -> PURCHASE
 -> UPGRADE
 -> EXECUTION
 -> HANDOVER
```

It identifies conversion loss, abnormal behaviour, broken journeys and customer-friction signals.

### 3.10 Commercial & Revenue Intelligence Agent

Monitors:

- plan purchases;
- paid entitlements;
- revenue/GMV;
- average order value;
- upgrade/downgrade behaviour;
- refunds/cancellations;
- conversion rates;
- product/plan performance.

It consumes verified payment and entitlement state rather than browser-side success claims.

### 3.11 Security & Reliability Agent

Monitors:

- authentication failures;
- authorization anomalies;
- job queue health;
- database/Redis/storage health signals;
- rate-limit events;
- provider outages;
- repeated application errors;
- operational SLO breaches.

Security-sensitive events are escalated conservatively. This agent never weakens security controls to restore availability.

## 4. Process Lead Agent

The Process Lead Agent is the operational executive layer.

It receives signals from all specialist agents and maintains a current operational picture across four dimensions:

```text
TECHNICAL HEALTH
CUSTOMER HEALTH
COMMERCIAL HEALTH
PRODUCT / WORKFLOW HEALTH
```

Its responsibilities are:

- correlate related incidents;
- distinguish symptoms from root causes;
- prevent multiple agents from performing conflicting actions;
- prioritise incidents by customer, financial, security and operational impact;
- assign or request corrective work;
- verify recovery;
- track unresolved issues;
- identify recurring patterns;
- identify opportunities for process improvement;
- produce daily/weekly management intelligence;
- escalate only matters requiring founder/operator attention.

The Process Lead is a coordinator and decision layer, not a replacement for deterministic domain services.

## 5. Operational event model

Every important domain transition should eventually emit a structured operational event.

Examples:

```text
PROPERTY_CREATED
FLOOR_PLAN_ANALYSIS_STARTED
FLOOR_PLAN_ANALYSIS_FAILED
ROOM_CONFIDENCE_LOW
DESIGN_CREATED
DESIGN_REVISED
DESIGN_DECISION_LOCKED
DESIGN_DOWNSTREAM_SYNC_FAILED
PRODUCT_OBSERVATION_CREATED
PRODUCT_PRICE_STALE
DEAL_FOUND
SAVINGS_RECALCULATED
BOQ_GENERATED
BOQ_STALE
BUDGET_THRESHOLD_EXCEEDED
RENDER_STARTED
RENDER_FAILED
RENDER_RECOVERED
PURCHASE_CREATED
PAYMENT_CAPTURED
ENTITLEMENT_ACTIVATED
ORDER_DELAYED
INSTALLATION_COMPLETED
SNAG_CREATED
SNAG_RESOLVED
CUSTOMER_REGISTERED
PROPERTY_UPLOADED
DESIGN_VIEWED
QUOTE_CREATED
PURCHASE_COMPLETED
PLAN_UPGRADED
CUSTOMER_ABANDONED
```

Each event should carry, where applicable:

- event ID;
- event type;
- occurred-at timestamp;
- actor type and actor ID where appropriate;
- user/project/property scope;
- correlation ID;
- causation ID;
- domain object type/ID;
- severity;
- current state;
- previous state where meaningful;
- safe metadata;
- provenance/evidence references where applicable.

Events are facts. Agent interpretations are separate records and must never overwrite the underlying fact.

## 6. Agent observation cycle

Every specialist agent follows the same control loop:

```text
OBSERVE
   ↓
CLASSIFY
   ↓
VALIDATE
   ↓
DIAGNOSE
   ↓
DECIDE
   ↓
AUTHORISE
   ↓
ACT
   ↓
VERIFY
   ↓
RECORD
   ↓
ESCALATE IF REQUIRED
```

An agent must not execute an action merely because an anomaly exists. It must first establish that the proposed action is within its authority and is idempotent or otherwise safely bounded.

## 7. Agent action classes

### A — Observe only

Reading metrics, events and domain state.

### B — Safe autonomous remediation

Examples:

- retry an idempotent AI job;
- requeue a stale notification;
- refresh a stale market observation through a governed adapter;
- reconcile a derived cache;
- recalculate a deterministic projection.

### C — Controlled remediation

Requires stronger policy checks and/or a human approval depending on the domain:

- supplier substitution;
- customer-facing commercial changes;
- quote changes;
- entitlement correction;
- provider failover with material cost implications.

### D — Founder / human decision required

Examples:

- material financial commitment;
- legal/compliance decision;
- security incident requiring policy change;
- irreversible customer action;
- material pricing/packaging decision;
- provider contract/cost decision.

Agents must fail closed when the authority is ambiguous.

## 8. Agent memory and audit trail

Agent memory must be separated into:

1. **Facts** — authoritative domain/event state.
2. **Observations** — agent-detected signals.
3. **Hypotheses** — possible causes, explicitly uncertain.
4. **Decisions** — selected response and reasoning.
5. **Actions** — actual service calls and outcomes.
6. **Outcomes** — whether the action resolved the condition.
7. **Escalations** — why human attention was required.

No hidden agent memory may be the sole source of truth for a commercial or customer-impacting decision.

## 9. Incident lifecycle

```text
DETECTED
   ↓
ACKNOWLEDGED
   ↓
DIAGNOSING
   ↓
ACTION_PLANNED
   ↓
ACTION_EXECUTED
   ↓
VERIFYING
   ├──> RESOLVED
   └──> ESCALATED
          ↓
       HUMAN DECISION
          ↓
       REMEDIATED
          ↓
       VERIFIED
```

Incidents should retain:

- severity;
- affected capability;
- affected customer/project scope where safe;
- first detected time;
- time acknowledged;
- time resolved;
- root-cause classification;
- actions attempted;
- final outcome;
- recurrence count;
- prevention recommendation.

## 10. Business intelligence contract

The Process Lead must have access to verified operational metrics sufficient to answer:

### Customer

- visitors;
- unique visitors where measurement permits;
- registrations;
- properties created;
- floor plans uploaded;
- designs generated;
- designs viewed/selected;
- quotes created;
- purchases;
- repeat customers;
- funnel conversion and abandonment.

### Sales

- orders;
- gross sales/GMV;
- net revenue where authoritative data permits;
- average order value;
- plan mix;
- upgrades;
- downgrades;
- refunds/cancellations;
- conversion rate.

### Value delivered

- potential savings identified;
- savings accepted by customers;
- upgrades accepted;
- substitutions accepted;
- budget overruns avoided;
- better-deal recommendations acted upon.

Savings must be clearly separated into **potential**, **accepted**, and **realised/verified** categories. An AI suggestion is not automatically realised savings.

### Operational health

- success/failure rate by workflow;
- job latency;
- queue depth;
- retries;
- provider failure rate;
- stale data;
- incident volume;
- incident resolution time;
- recurring incident classes.

## 11. Founder report

The Process Lead should generate a concise daily report with the following structure:

```text
NIWASTHAN DAILY OPERATIONS REPORT

1. EXECUTIVE HEALTH
   Overall operational health
   Customer health
   Commercial health
   Product/workflow health

2. WHAT IS WORKING WELL
   Highest-value positive signals

3. CUSTOMER ACTIVITY
   Visitors
   New customers
   Active projects
   Funnel movement

4. COMMERCIAL PERFORMANCE
   Sales/GMV
   Orders
   Conversion
   Average order value
   Upgrades/downgrades

5. VALUE CREATED
   Potential savings
   Accepted savings
   Verified realised savings
   Better deals / substitutions / upgrades

6. CONCERNS
   High/medium/low priority issues
   Customer impact
   Financial impact
   Technical impact

7. WHAT THE AGENTS FIXED
   Incident → action → result

8. ROOT-CAUSE / TREND ANALYSIS
   Recurring failures
   Emerging bottlenecks
   Process degradation/improvement

9. AREAS OF IMPROVEMENT
   Recommended product/process/engineering changes

10. FOUNDER DECISIONS REQUIRED
    Only unresolved decisions requiring human authority
```

## 12. Email delivery

The reporting pipeline is:

```text
Operational Events
      ↓
Specialist Agent Analysis
      ↓
Process Lead Correlation
      ↓
Report Snapshot
      ↓
Report Validation
      ↓
Email Delivery
      ↓
Delivery Audit
```

The email must be generated from a persisted report snapshot so that the report can be reproduced and audited later.

Email delivery must be idempotent. A transient email-provider failure must not duplicate the underlying report or business actions.

The report should include links into an authenticated operational view for deeper investigation when that UI exists.

## 13. Reporting cadence

Default target cadence:

- **Daily:** founder operations report;
- **Weekly:** trend, revenue, conversion, customer and reliability analysis;
- **Immediate:** critical security, payment, customer-impacting or execution incidents;
- **On demand:** founder-triggered Process Lead analysis.

Quiet hours apply to non-critical notifications. Critical incidents follow the established incident policy.

## 14. Customer privacy and data minimisation

Operational analytics must be privacy-aware.

Agents should use aggregate metrics wherever individual-level data is unnecessary. Reports must not expose passwords, tokens, payment credentials, signed URLs or unnecessary personal information.

Customer-level details should be included only when needed to resolve a legitimate operational issue and only within the authorised scope.

## 15. Architecture integration

The existing Niwasthan architecture already has the correct foundations for this layer:

```text
Next.js / API
      ↓
Services
      ↓
Repositories / Prisma
      ↓
PostgreSQL

Services
      ↓
BullMQ / Redis
      ↓
Durable AIJob
      ↓
Provider adapters
```

The agentic layer should extend this with:

```text
Domain Services
      ↓
Operational Event / Signal Publisher
      ↓
Agent Observation Workers
      ↓
Agent Decision / Action Boundary
      ↓
Existing Domain Services

All agents
      ↓
Process Lead
      ↓
Report Snapshot
      ↓
Email / Operational UI
```

Agents should use the existing durable job infrastructure where appropriate rather than introducing a second queue architecture.

## 16. Required future domain primitives

The implementation should introduce these concepts deliberately, reusing existing models where possible:

- `OperationalEvent`;
- `AgentObservation`;
- `AgentIncident`;
- `AgentDecision`;
- `AgentAction`;
- `AgentActionAttempt`;
- `AgentEscalation`;
- `OperationalMetricSnapshot`;
- `ProcessReport`;
- `ProcessReportDelivery`;
- `AgentPolicy` / capability permissions;
- correlation/causation identifiers.

Exact Prisma names may differ after schema review. Existing `AIJob`, `AuditLog`, notification, purchase, entitlement and domain lifecycle records must not be duplicated unnecessarily.

## 17. Agent policies

Every agent must have an explicit policy containing:

- owned workflow;
- readable scopes;
- allowed tools/services;
- autonomous action classes;
- prohibited actions;
- maximum retry/action limits;
- escalation thresholds;
- financial limits where relevant;
- customer-impact rules;
- audit requirements;
- model/provider configuration;
- timeout and failure policy.

Policy must be enforced server-side. Prompt instructions alone are not an authorization mechanism.

## 18. Reliability requirements

Agent execution must be:

- idempotent where possible;
- retryable where safe;
- bounded by time and action count;
- observable;
- auditable;
- tenant-aware;
- authorization-aware;
- resilient to provider failure;
- safe when AI output is malformed or uncertain.

The system must never enter an autonomous retry/action loop without a hard upper bound.

## 19. No fabricated management intelligence

The Process Lead must follow the same truth rules as the customer-facing product.

It must distinguish:

```text
VERIFIED FACT
ESTIMATE
INFERENCE
RECOMMENDATION
UNRESOLVED
```

Examples:

- A recorded payment is verified sales data.
- A projected conversion improvement is an estimate.
- A suspected reason for abandonment is an inference unless supported by evidence.
- A proposed pricing change is a recommendation.

The Process Lead must never present inferred revenue, savings, customer counts, uptime or issue resolution as verified facts.

## 20. Acceptance gates

The Agentic Operations Layer is not production-complete until:

- operational events are persisted and scoped correctly;
- specialist agents can observe their assigned workflows;
- agent actions pass server-side policy enforcement;
- actions are auditable and idempotent where required;
- incident lifecycle is persisted;
- Process Lead correlation works across specialist agents;
- business metrics come from authoritative sources;
- daily report snapshots are reproducible;
- email delivery is idempotent;
- critical escalation works;
- privacy/security controls pass review;
- unit/integration/acceptance tests pass;
- complete CI is green on `main`;
- deployment health is verified.

Until those gates pass, documentation and schemas must remain explicitly marked as target architecture rather than completed capability.

## 21. Strategic outcome

The intended end state is:

> **You run Niwasthan. The Process Lead runs the operation. Specialist agents watch the workflows. Domain services remain the source of truth. Humans retain authority over high-impact decisions.**

The objective is not to remove humans from the business. It is to remove unnecessary manual monitoring, shorten detection-to-resolution time, expose business intelligence continuously and allow the founder to focus on strategy, customer value and growth.
