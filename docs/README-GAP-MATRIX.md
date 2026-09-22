# README-to-Code Gap Matrix

**Audit date:** 2026-09-21

The README is the canonical product contract. This matrix separates capabilities that are already implemented, capabilities that have real backend foundations but are not surfaced end to end, and capabilities that still require provider or infrastructure work. It is intentionally conservative: a route or service is not counted as production-complete unless the customer workflow, authorization, evidence states, persistence, tests, and failure behavior are present.

| README area | Current evidence | Status | Next implementation boundary |
|---|---|---|---|
| Property and spatial intelligence | Property, floor-plan upload/review, room understanding, confirmation routes, geometry checks | **Implemented core** | Add richer photo/video capture and additional spatial consistency checks |
| Design intelligence | Design projects, directions, revisions, layout objects, drag persistence, reality checks, approval-gated BOQ | **Implemented core** | Expand lifestyle brief, revision impact history, and mobile approval parity |
| Catalogue intelligence | Catalogue pages, product merits, curation, verification, substitutions, bargain routes | **Backend + web surface** | Connect project-level recommendations and evidence-rich deal comparison to each design |
| What-if and savings | What-if, budget reduction, savings optimizer, bargain services; property Intelligence workspace | **Customer preview implemented** | Add richer product-linked candidates and accepted/verified saving history |
| Smart home | Smart-home service/API; property Intelligence workspace with explicit preview state | **Customer preview implemented** | Add room-level device mapping, provider availability, and installation confirmation |
| BOQ and budget | Budget, BOQ, reconciliation, timeline, reduction APIs and design consequences | **Backend + partial design surface** | Add a consolidated BOQ/budget workspace with source/freshness and variance display |
| Visualization | AI/rendering provider abstractions, render jobs, asset APIs, scene-description services | **Provider-dependent foundation** | Add asset library and governed render-status workspace; production provider configuration remains required |
| Immersive walkthrough | Plan-gated home-scene API | **API foundation only** | Add customer immersive entry state and clearly labeled provider/unavailable states |
| Procurement | Supplier invites, quote comparison, negotiation, acceptance, orders | **Implemented core** | Add payment/order detail and supplier communication status surfaces |
| Execution, quality, handover | Execution lifecycle, structured snags, handover gating, Execution & Quality agent | **Implemented core** | Add media evidence capture, richer SLA monitoring, and operational dashboard |
| Assistant | Anthropic tool-grounded assistant API with FAQ, budget, room context; authenticated Humsafar workspace | **Customer workspace implemented** | Add design, catalogue, lifecycle, and Home Memory tools |
| Notifications | Authenticated list/read/mark-all APIs and notification service | **Implemented API** | Complete event coverage, push adapter, and customer notification center UI |
| Home Memory / DNA | Property memory route and DNA API | **Implemented core** | Add edit/history controls and mobile parity |
| Agentic operations | Events, incidents, agent memory primitives, bounded Execution & Quality agent; admin agent-operation query | **Partial** | Add specialist roster, Process Lead correlation, policy records, and operational UI |
| Process Lead reporting | Authoritative metrics, persisted validated snapshots, idempotent email delivery, snapshot retrieval, admin report listing | **Persisted daily/on-demand foundation** | Add scheduled cadence, trend reports, report validation, and delivery worker |
| Mobile | First-class Expo client shell and truth-state UX | **Prototype surface, not shared authenticated client** | Connect auth/session, governed APIs, uploads, push, offline queue, and shared Home Memory |
| Production operations | Tests, migrations, rate limits, authorization foundations | **Strong foundation** | Verify deployment secrets/providers, CI on main, background workers, push/email delivery, and production health |

## Implementation order

The next product-completing sequence is:

1. **Property Intelligence workspace:** expose existing intelligence, What-if, Smart Home, budget, and immersive states from one property surface.
2. **Assistant workspace:** make Humsafar visible and context-aware in the authenticated product, not only available as an API.
3. **BOQ/budget and deal transparency:** expose existing calculations and evidence boundaries in a customer decision workspace.
4. **Process Lead reporting:** persist reproducible report snapshots and agent action outcomes without fabricating unavailable metrics.
5. **Mobile shared-client boundary:** connect the first shared authenticated workflow and preserve explicit sync states.
6. **Provider and deployment closure:** configure and verify rendering, LLM, email, push, storage, and background-worker dependencies.

A capability remains marked partial when a required external provider, background worker, or deployment credential is not available in the repository environment.

## Latest validation notes

The Intelligence workspace and Process Lead snapshot changes pass Prisma generation, TypeScript validation, and the complete **790-test** suite. The production build reaches Next.js route collection but cannot complete in the current sandbox because `AUTH_SECRET` is not configured for build-time validation; the build also reports an existing optional BullMQ dependency warning for `@valkey/valkey-glide`. These are deployment/configuration gaps, not silently treated as feature completion.
