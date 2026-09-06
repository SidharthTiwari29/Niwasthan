# NIWASTHAN

**Your home. Designed your way.**

> **Ghar mein ghusne se pehle, ghar ko experience karo.**

## The Home Intelligence Platform

Niwasthan is an AI-native home-interior platform for India that takes a homeowner from their **real property and floor plan** to an exceptionally well-designed, transparent, budget-aware, purchasable, buildable and experienceable home.

Niwasthan is not merely an AI image generator, catalogue, BOQ calculator, marketplace, designer directory, project-management tool or 360° viewer. Its differentiation is the connected intelligence system linking the customer's actual home to design, real materials and products, choices, savings, buildability, visualization, procurement, execution and persistent home intelligence.

> **Status rule:** This README is the canonical end-to-end product and engineering contract. It describes the agreed target vision and implementation foundations. It must never be used to claim that an unfinished capability is already production-complete.

---

# 1. NORTH STAR

```text
REAL PROPERTY
      ↓
FLOOR PLAN / PHOTOS / USER BRIEF
      ↓
SPATIAL UNDERSTANDING
      ↓
ROOM + ELEMENT MODEL
      ↓
EXCEPTIONAL DESIGN INTELLIGENCE
      ↓
MULTIPLE STRONG DESIGN DIRECTIONS
      ↓
REAL MATERIALS + COMPONENTS + PRODUCTS
      ↓
MORE OPTIONS → BETTER OPTIONS → BETTER DEALS
      ↓
WHAT-IF / SAVINGS
      ↓
SMART HOME
      ↓
BUILDABILITY / BOQ / BUDGET
      ↓
LOCALIZATION / ASSISTANT / NOTIFICATIONS
      ↓
COMMERCIAL / VISUALIZATION
      ↓
NIWASTHAN IMMERSIVE
      ↓
WALK THROUGH MY FUTURE HOME
      ↓
PROCUREMENT
      ↓
EXECUTION
      ↓
QUALITY / SNAGGING / HANDOVER
      ↓
HOME MEMORY / NIWASTHAN DNA™
```

**Product promise:**

> **Understand my home → design my home → show me my home → explain what it costs → help me choose better → help me save → help me buy → help me build it → let me experience it → remember my home.**

**Customer promise:** **More Options. Better Options. Better Deals. Better Decisions. Better Homes.**

---

# 2. NON-NEGOTIABLE PRINCIPLES

### Real Home First
The customer's actual property is the source of truth wherever information has been confirmed. Inputs can include floor plans, photographs, videos, measurements, property details, existing furniture, lifestyle requirements, preferences, budget and constraints.

### Design First
Designs must respect actual dimensions where known, scale, circulation, ergonomics, storage, natural light, ventilation, electrical/plumbing requirements, furniture dimensions, kitchen workflow, durability, maintenance, constructability, lifestyle and budget.

### Transparency First
Important decisions expose recommendation, rationale, price basis, source, freshness, specifications, brand, warranty where available, alternatives, trade-offs, potential savings, confidence/evidence and downstream impact.

### Value First
```text
CHEAPEST ≠ BEST VALUE ≠ BEST QUALITY ≠ BEST DEAL
```
A genuine deal requires evidence.

### User Control
Users can accept, reject, compare, modify, replace, upgrade, downgrade, lock, preserve and revert important decisions. A locked decision must not be silently changed by later AI generation.

### No Fabricated Certainty
Unknown or AI-inferred information remains explicitly `UNKNOWN` or `ESTIMATED / INFERRED` with confidence until confirmed. Niwasthan must never fabricate dimensions, prices, availability, warranties, product identity, evidence, supplier success, execution completion or savings claims.

### Buildability Matters
> **Beautiful must also be buildable.**

AI-generated visual quality is never sufficient acceptance evidence for a real-world design decision.

---

# 3. CANONICAL DEVELOPMENT SEQUENCE

```text
INTELLIGENCE
      ↓
WHAT-IF / SAVINGS
      ↓
SMART HOME
      ↓
BUILDABILITY / BOQ
      ↓
LOCALIZATION / ASSISTANT / NOTIFICATIONS
      ↓
COMMERCIAL / VISUALIZATION
      ↓
WALKTHROUGH / IMMERSIVE
      ↓
PROCUREMENT / EXECUTION
      ↓
QUALITY / HANDOVER / HOME MEMORY
```

Supporting foundations such as authentication, authorization, database integrity, migrations, jobs, observability, security and CI are dependencies of this sequence.

No feature bypasses intelligence and data foundations merely because it is visually exciting or commercially attractive.

---

# 4. CUSTOMER EXPERIENCE — PRODUCTION WEB + MOBILE

Niwasthan is a **single product delivered through multiple customer surfaces**, not separate products with duplicated business logic.

```text
                         NIWASTHAN CORE
                              │
              ┌───────────────┴───────────────┐
              │                               │
       PRODUCTION WEBSITE                MOBILE APP
              │                               │
              └───────────────┬───────────────┘
                              │
                    SHARED DOMAIN / API
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
     INTELLIGENCE          WORKFLOWS          HOME MEMORY
```

## 4.1 Production Website

The production web experience is the primary rich workspace for discovery, onboarding, design, comparison, budgeting, visualization and procurement.

Core surfaces should include:

1. Premium Niwasthan landing/brand experience.
2. Secure account creation and onboarding.
3. Property creation and actual-home profile.
4. Floor-plan/photo/video/measurement upload.
5. Spatial analysis and confidence/uncertainty review.
6. Room and element explorer.
7. Design brief and lifestyle preferences.
8. Multiple design directions.
9. Design version/revision workspace.
10. Real product/material discovery.
11. More Options / Better Options / Better Deals.
12. Substitution and upgrade/downgrade intelligence.
13. What-if and savings workspace.
14. BOQ and budget workspace.
15. Visualization generation and asset library.
16. Niwasthan Immersive / future-home walkthrough.
17. Quote and purchase journey.
18. Procurement/order tracking.
19. Execution/site progress.
20. Snagging, quality and handover.
21. Notifications and AI assistant.
22. Home Memory / NIWASTHAN DNA™.

The website must be production-grade, responsive, accessible, observable and secure. The cinematic experience must enhance the product rather than become a disconnected marketing demo.

## 4.2 Mobile App

The mobile application is a **first-class Niwasthan client**, not a reduced website wrapper.

It shares the same identity, permissions, domain services, intelligence graph, jobs, notifications, project state and Home Memory as the web application.

Mobile priorities:

- onboarding and profile
- property/home access
- camera-based photos and videos
- floor-plan/document capture
- design review and approvals
- product/material comparison
- price/deal/savings alerts
- budget and BOQ monitoring
- visualization and immersive viewing
- purchase/order status
- execution/site updates
- delivery and installation notifications
- snag capture using camera/media
- task approvals and decision locks
- AI assistant
- push notifications
- Home Memory / NIWASTHAN DNA™

Mobile must support poor/intermittent network conditions where practical, safe retries, resumable uploads, secure local state and explicit synchronization status.

## 4.3 Shared Web/Mobile Rules

Neither client may contain authoritative business rules that should live in domain services. Both consume the same governed APIs/use cases and receive the same evidence, confidence, pricing and lifecycle states.

```text
WEB ───────┐
           ├──→ API / APPLICATION SERVICES → DOMAIN SERVICES → DATA
MOBILE ────┘
```

A decision made on web must appear consistently on mobile and vice versa.

---

# 5. PROPERTY + SPATIAL INTELLIGENCE

Niwasthan maintains a persistent spatial representation of the customer's actual home.

Where supported by evidence it represents property/floor, rooms, walls, doors, windows, openings, dimensions, circulation, fixed architectural elements, electrical/plumbing constraints, known structural constraints, usable zones, furniture zones, storage zones, lighting zones, confidence and uncertainty.

Target workflow:

```text
FLOOR PLAN / PHOTOS / MEASUREMENTS
        ↓
PLAN ANALYSIS
        ↓
ROOM / WALL / DOOR / WINDOW DETECTION
        ↓
DIMENSION EXTRACTION
        ↓
SPATIAL MODEL
        ↓
DESIGN SYSTEM
```

Incorrect geometry can corrupt design, product selection, BOQ, visualization and execution; spatial uncertainty therefore remains explicit.

---

# 6. DESIGN INTELLIGENCE

When a customer uploads their apartment layout, Niwasthan should reason like an exceptionally strong interior designer grounded in the **actual home**.

It reasons about space planning, furniture placement, circulation, proportions, storage, lighting, colour/texture, kitchen workflow, wardrobes, TV/storage units, utility, living, bedrooms, bathrooms, dining, balconies, study/home office, children, elderly-friendly requirements, smart-home requirements, budget and buildability.

Niwasthan should challenge poor decisions:

```text
USER REQUEST
    ↓
DESIGN ANALYSIS
    ↓
ISSUE / TRADE-OFF
    ↓
EXPLANATION
    ↓
BETTER ALTERNATIVES
    ↓
USER DECISION
```

Multiple strong directions can include Luxury, Premium, Smart Luxury, Value, Budget, Minimal, Modern, Contemporary, Warm, Low-maintenance and personalised combinations.

Design remains a persistent lifecycle:

```text
DESIGN PROJECT → VERSION → REVISION → ELEMENT CHANGES → DOWNSTREAM IMPACT
```

Changes preserve what changed, why, who, when, previous/new value and downstream material/product, BOQ, budget, visualization and procurement impact.

---

# 7. INTERIOR INTELLIGENCE GRAPH

Canonical entities include Product, Material, Component, Assembly, Service, Brand, Manufacturer, Seller and Design Element.

Relationships include:

```text
ALTERNATIVE_TO
COMPATIBLE_WITH
PART_OF
USES_MATERIAL
SOLD_BY
MANUFACTURED_BY
BRANDED_AS
SUITABLE_FOR
REQUIRES_SERVICE
```

The graph connects design to real products, materials, prices, buildability and execution.

The long-term interior universe includes furniture, modular interiors, plywood/MDF/HDF/boards, laminates, acrylic, veneer, PU, paint, texture, wallpaper, glass, stone, tiles, countertops, hardware, hinges, channels, handles, organisers, lighting, electrical, plumbing, appliances, soft furnishing, decor, smart home and execution services.

---

# 8. SOURCE → OBSERVATION → EVIDENCE → CANONICAL ENTITY

Imported, scraped or supplied information is never automatically authoritative.

```text
SOURCE
  ↓
GOVERNED SOURCE ADAPTER
  ↓
RAW RECORD
  ↓
NORMALIZATION
  ↓
OBSERVATION
  ↓
EVIDENCE / PROVENANCE
  ↓
CANONICAL ENTITY
  ↓
VARIANT / SKU
  ↓
MARKET OBSERVATION
  ↓
PROJECT INTELLIGENCE
```

Market observations should preserve source identity/reference, external ID, timestamps, geography, currency, price, reference/MRP, availability, seller, evidence, confidence and freshness.

The long-term ambition may include **500+ legitimate sources**, but source quality, governance and evidence matter more than count.

---

# 9. MORE / BETTER / DEAL / SUBSTITUTION INTELLIGENCE

Niwasthan groups and ranks useful choices rather than overwhelming the homeowner with duplicates.

Better-option signals can include quality, compatibility, durability, design fit, maintenance, warranty, availability, service, confidence, budget fit and project compatibility.

Deal intelligence can consider observed price, reference price, price history, same-SKU comparison, equivalent-specification comparison, seller, geography, availability and evidence quality.

Substitution intelligence explains:

```text
CURRENT CHOICE
      ↓
ALTERNATIVE
      ↓
PRICE DIFFERENCE
      ↓
POTENTIAL SAVING
      ↓
QUALITY / PERFORMANCE IMPACT
      ↓
DESIGN / MAINTENANCE IMPACT
      ↓
USER DECISION
```

Savings truth must distinguish:

- **Potential saving** — calculated opportunity.
- **Accepted saving** — user accepted the recommendation.
- **Realised/verified saving** — supported by authoritative transaction evidence.

AI suggestions must never be reported as realised savings automatically.

---

# 10. PROJECT-LEVEL OPTIMIZATION

Niwasthan should eventually optimize the complete interior project rather than isolated products.

It can evaluate combinations across rooms, materials, products, suppliers, alternatives, quality, warranty, delivery, installation, budget and execution risk.

Example:

```text
PREMIUM KITCHEN
+
VALUE LIVING
+
CUSTOM BEDROOM
+
BUDGET UTILITY
+
SMART-HOME PRIORITIES
      ↓
GLOBAL PROJECT OPTIMIZATION
```

Recommendations must expose trade-offs and downstream effects.

---

# 11. BOQ / BUDGET / BUILDABILITY

The budget engine is connected to design intent, quantities, products/materials and project decisions.

A budget view should distinguish authoritative values from estimates and show:

- category/subcategory
- quantity/unit
- selected product/material
- source and freshness
- unit price and price basis
- labour/service cost where known
- taxes/fees where authoritative
- estimated vs confirmed values
- contingency where applicable
- alternatives and savings
- budget variance
- downstream impact

A design should be considered buildable only when relevant dimensions, assemblies, products, services and execution assumptions have sufficient evidence.

---

# 12. VISUALIZATION + NIWASTHAN IMMERSIVE

Visualization is a governed pipeline, not an isolated image generator.

```text
DESIGN
  ↓
AI JOB
  ↓
RENDERING PROVIDER ADAPTER
  ↓
ASSET
  ↓
3D / PANORAMA / WALKTHROUGH / VIDEO
  ↓
CUSTOMER REVIEW
```

The signature experience is:

> **Walk through my future home.**

The premium production website should support a cinematic, high-quality immersive experience while retaining actual-property grounding, selected design state and evidence boundaries.

Visual output must never be presented as proof that an execution detail is technically or structurally valid.

---

# 13. PROCUREMENT / EXECUTION / QUALITY

The downstream lifecycle is:

```text
DESIGN LOCK
   ↓
BOQ / QUOTE
   ↓
PURCHASE
   ↓
PAYMENT
   ↓
PROCUREMENT
   ↓
DELIVERY
   ↓
INSTALLATION
   ↓
QUALITY CHECK
   ↓
SNAGS
   ↓
RESOLUTION
   ↓
HANDOVER
```

Every meaningful state transition must be observable and auditable. Customers should be able to see what is confirmed, what is pending, who owns the next action and where uncertainty remains.

---

# 14. AI ASSISTANT + NOTIFICATIONS

The assistant is not the product's only AI. It is the customer-facing conversational interface to the broader intelligence system.

It can explain decisions, compare options, answer project questions, summarize changes, surface risks, explain budget impact and help customers navigate workflows.

Notifications should be event-driven and relevant, including design completion, price/deal changes, stale information, budget thresholds, approvals, purchase/payment state, delivery, installation, snags and important execution events.

The assistant must use authoritative domain state and evidence rather than inventing answers.

---

# 15. AGENTIC OPERATIONS — AI WATCHES THE BUSINESS

Niwasthan includes an **Agentic Operations Layer** above domain services. The objective is that every important operational workflow has a specialist AI watching it continuously, while a **Process Lead Agent** coordinates the complete operating picture.

```text
                    PROCESS LEAD AGENT
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
 SPECIALIST AGENTS   OPERATIONAL EVENTS   BUSINESS METRICS
       │                                       │
       └───────────────────┬───────────────────┘
                           │
                   DOMAIN SERVICES
                           │
                 NIWASTHAN DATA / JOBS
```

## Specialist agents

The target specialist roster includes:

- Property & Spatial Operations Agent
- Design Operations Agent
- Catalogue & Product Intelligence Agent
- Pricing / Deal / Savings Agent
- BOQ & Budget Operations Agent
- Visualization Operations Agent
- Procurement Operations Agent
- Execution & Quality Agent
- Customer Journey Agent
- Commercial & Revenue Intelligence Agent
- Security & Reliability Agent

Each specialist watches its workflow, detects anomalies, validates evidence, diagnoses failures, proposes or performs bounded remediation and escalates when authority is insufficient.

## Process Lead Agent

The Process Lead:

- correlates signals across specialist agents
- prioritizes by customer, financial, security and operational impact
- diagnoses cross-workflow root causes
- coordinates safe corrective work
- verifies recovery
- identifies recurring patterns
- recommends process improvements
- prepares daily and weekly founder reports
- escalates only matters requiring human/operator decisions

The control loop is:

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

### Action classes

- **A — Observe only:** monitor and record.
- **B — Safe autonomous remediation:** bounded, reversible/low-risk action.
- **C — Controlled remediation:** action requiring explicit policy/approval boundary.
- **D — Founder/human decision required:** financial, security, legal, irreversible, high-impact or ambiguous decisions.

Prompt instructions are never authorization. Agents must use existing domain services and durable job infrastructure and must not mutate Prisma directly as a shortcut.

Agents must fail closed when authority is ambiguous, preserve locked decisions, use bounded/idempotent actions where possible and create an auditable record for every material action.

---

# 16. OPERATIONAL EVENT MODEL

The agentic layer consumes persisted operational events rather than relying only on chat context or transient logs.

Representative events include:

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

Each event should carry event identity, type, timestamp, actor/scope, correlation and causation IDs, domain object, severity, state transition, safe metadata and provenance/evidence where applicable.

---

# 17. AGENT MEMORY / INCIDENT / AUDITABILITY

Agent memory is structured as:

```text
FACTS
OBSERVATIONS
HYPOTHESES
DECISIONS
ACTIONS
OUTCOMES
ESCALATIONS
```

Agent memory is never the sole source of truth.

Target operational primitives include, where justified by the existing schema:

- OperationalEvent
- AgentObservation
- AgentIncident
- AgentDecision
- AgentAction
- AgentActionAttempt
- AgentEscalation
- OperationalMetricSnapshot
- ProcessReport
- ProcessReportDelivery
- AgentPolicy

Existing AI job, audit-log, notification, purchase and entitlement lifecycle records should be reused where they already provide authoritative state. Exact schema names must be finalized during implementation rather than duplicated unnecessarily.

Incident lifecycle:

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
  ↓
RESOLVED / ESCALATED
  ↓
HUMAN DECISION (if required)
  ↓
REMEDIATED
  ↓
VERIFIED
```

---

# 18. PROCESS LEAD BUSINESS INTELLIGENCE

The Process Lead must have a complete operational view.

### Customer metrics

- visitors
- unique visitors
- registrations
- properties created
- floor plans uploaded
- designs generated
- designs viewed/selected
- quotes
- purchases
- repeat customers
- funnel conversion
- abandonment

### Commercial metrics

- orders
- GMV / sales
- authoritative net revenue where available
- AOV
- plan mix
- upgrades/downgrades
- refunds/cancellations
- conversion

### Value metrics

- potential savings
- accepted savings
- verified realised savings
- better-deal opportunities
- substitutions
- upgrades/downgrades

### Operational metrics

- workflow success/failure rates
- latency
- queue depth
- retries
- provider failures
- stale data
- incident volume
- MTTR
- recurring incidents
- customer-impacting failures

The Process Lead must distinguish **VERIFIED FACT**, **ESTIMATE**, **INFERENCE**, **RECOMMENDATION** and **UNRESOLVED**. It must never present inferred revenue, savings, customer counts, uptime or resolution as verified facts.

---

# 19. FOUNDER / PROCESS LEAD REPORTING

The Process Lead should produce a daily founder operations report and periodic trend reports.

Default cadence:

- **Daily:** operational health and business summary.
- **Weekly:** trends, revenue, conversion, customer, value and reliability analysis.
- **Immediate:** critical security, payment or major customer-impacting incidents.
- **On demand:** detailed Process Lead investigation.

Daily report structure:

1. Executive health.
2. What is working well.
3. Customer activity — including visitors, registrations, properties and journey progression where authoritative.
4. Commercial performance — sales/orders/GMV/revenue where authoritative.
5. Value created — potential, accepted and verified savings separately.
6. Concerns and incidents.
7. What specialist agents detected and fixed.
8. Root-cause and recurring-pattern analysis.
9. Areas for improvement.
10. Founder decisions required.

Reporting flow:

```text
OPERATIONAL EVENTS
      ↓
SPECIALIST AGENT ANALYSIS
      ↓
PROCESS LEAD CORRELATION
      ↓
PERSISTED REPORT SNAPSHOT
      ↓
REPORT VALIDATION
      ↓
IDEMPOTENT EMAIL DELIVERY
      ↓
DELIVERY AUDIT
```

No report may fabricate a number merely to make the business appear healthier.

---

# 20. SECURITY / GOVERNANCE / HUMAN AUTHORITY

High-impact financial, security, legal, privacy, customer-facing, irreversible or commercially material actions require appropriate policy controls and, where required, human approval.

Agents cannot silently:

- alter locked customer decisions
- claim a purchase or execution is complete without authoritative evidence
- claim savings are realised without transaction evidence
- change financial truth
- bypass authorization
- delete or rewrite audit history
- override safety/security controls
- represent inference as fact

The agentic layer is an operating/control layer, not a replacement for domain authorization or source-of-truth systems.

---

# 21. PRODUCTION ARCHITECTURE

```text
                         CUSTOMER SURFACES
                  ┌────────────┴────────────┐
                  │                         │
              WEB APP                 MOBILE APP
                  │                         │
                  └────────────┬────────────┘
                               │
                         API / APPLICATION
                               │
       ┌───────────────────────┼────────────────────────┐
       │                       │                        │
 DOMAIN SERVICES          AI / JOB SYSTEM          NOTIFICATIONS
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               │
                     POSTGRES / OBJECT STORAGE
                               │
                       OPERATIONAL EVENTS
                               │
                ┌──────────────┴──────────────┐
                │                             │
       SPECIALIST AGENTS               PROCESS LEAD
                │                             │
                └──────────────┬──────────────┘
                               │
                     REPORTS / ESCALATIONS
                               │
                           FOUNDER
```

Domain services remain the source of truth. Agents observe and act through governed application/domain capabilities.

The production platform must preserve authentication, authorization, database integrity, durable jobs, observability, security, auditability, rate limiting, payment/webhook correctness and CI/CD controls.

---

# 22. IMPLEMENTATION STATUS RULE

Documentation and architecture define the target. They do **not** imply that every target capability is production-complete.

Current architectural work includes the Agentic Operations design and Process Lead contract. Runtime implementation must still be verified feature-by-feature.

Before calling a capability production-ready, Niwasthan must have appropriate:

- implementation
- tests
- authorization
- error handling
- observability
- auditability
- migrations/data integrity
- production configuration
- CI validation
- failure/recovery behaviour

This prevents documentation from becoming a false claim of completion.

---

# 23. NIWASTHAN DEVELOPMENT RULE

Every feature must answer:

1. Does it strengthen the homeowner journey?
2. Does it use or strengthen the intelligence graph?
3. Does it create measurable value through better design, transparency, affordability, quality, confidence or execution?
4. Does it have a clear dependency position?
5. Can it be production-grade rather than a demo?
6. Can it be tested, secured, observed and supported?
7. Does it preserve user control and commercial integrity?
8. Can the specialist agent and Process Lead observe it appropriately?
9. Does it expose authoritative truth and uncertainty correctly?

If not, it does not enter the production build queue.

---

# 24. STRATEGIC END STATE

```text
YOU RUN NIWASTHAN
        ↓
PROCESS LEAD RUNS THE OPERATION
        ↓
SPECIALIST AGENTS WATCH THE WORKFLOWS
        ↓
DOMAIN SERVICES REMAIN THE SOURCE OF TRUTH
        ↓
WEB + MOBILE SHARE THE SAME NIWASTHAN INTELLIGENCE
        ↓
HUMANS RETAIN AUTHORITY OVER HIGH-IMPACT DECISIONS
        ↓
NIWASTHAN LEARNS FROM EVERY HOME, DECISION AND OUTCOME
```

> **Niwasthan should not merely help a homeowner design a home. It should understand the home, help make every important decision, connect those decisions to real products and execution, continuously watch the journey, protect the customer from bad outcomes, improve its own processes, and remember the home for the long term.**

**More Options. Better Options. Better Deals. Better Decisions. Better Homes.**
