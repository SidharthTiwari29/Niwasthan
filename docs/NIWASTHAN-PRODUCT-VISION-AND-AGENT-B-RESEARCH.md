# Niwasthan Product Vision and Production Build Research

## Executive conclusion

Niwasthan should be positioned as an **India-first home intelligence platform**, not as another AI room-image generator. The canonical promise in the repository README is a connected journey from a customer’s real property and floor plan to design, evidence-backed materials, budget, buildability, procurement, execution, quality, and persistent Home Memory. The most important product advantage is not visual novelty. It is the governed connection between actual-home truth, design decisions, commercial evidence, and downstream build execution.

The repository already contains a serious backend foundation. It includes property and spatial intelligence, design directions and revisions, market-intelligence governance, catalogue and substitution services, budget and BOQ boundaries, rendering jobs, procurement, execution, notifications, authentication, authorization, auditability, and agentic operations. The active customer-facing Next.js application also contains landing, how-it-works, pricing, sign-in, properties, catalogue, design workspace, checkout, and several API surfaces. The main delivery gap is not product ambition. It is a coherent production web workspace, a first-class mobile client, and end-to-end integration of the existing domain services into a clear customer journey.

## Current-state audit

| Area | Evidence found | Assessment |
|---|---|---|
| Product vision | Root `README.md` defines the North Star, principles, canonical sequence, product surfaces, and integrity rules | Strong and unusually explicit |
| Backend architecture | `ARCHITECTURE.md`, `src/server`, Prisma schema, API routes, durable jobs, provider adapters | Substantial foundation; production completeness must still be verified by CI and configured providers |
| Web surface | `src/app` includes cinematic home, how-it-works, pricing, onboarding, properties, designs, catalogue, checkout, and legal pages | Present but needs a consistent workspace system and stronger cross-surface UX |
| Mobile surface | Handoff says no frontend UI existed at the earlier checkpoint; the current checkout has a Capacitor-related branch but no complete first-class mobile product was found on the active tree | Primary implementation gap |
| Commercial integrity | README and architecture distinguish estimates, potential savings, accepted savings, and verified savings | Preserve this as a product differentiator |
| Agentic operations | The repository contains specialist agents and a process-lead model with bounded actions and auditability | Useful for reliability and operations; should not be confused with customer-facing AI autonomy |

## Product vision synthesis

The product should be organized around five customer questions.

| Customer question | Product answer | Trust requirement |
|---|---|---|
| What is actually true about my home? | Property profile, plan/photo capture, room and element model, confidence review | Unknown and inferred values remain visibly labeled |
| What could my home become? | Multiple strong design directions grounded in the actual property | Visual output is not proof of buildability |
| What will it cost and what are the trade-offs? | Live budget, BOQ, substitutions, What-If scenarios, savings modes | Every price has a source, freshness, basis, and confidence |
| How do I turn the decision into reality? | Procurement, quotes, execution milestones, snagging, handover | Locked decisions cannot be silently changed |
| How will the product remember and help later? | Home Memory and NIWASTHAN DNA | Durable ownership, history, and explicit permissions |

## Agent B competitive audit

Agent B Studio is a credible adjacent competitor. Its public website presents a unified space-and-product visualization environment for designers, brands, and real-estate teams. It offers a wide workflow catalog that includes Quick Generate, Smart Project, Design Product, Quick Layout, Photo Edit, Layout Editor, Moodboard, Facade Rendering, Sketch to 3D, 2D Layout to 3D, material changes, camera-angle changes, atmosphere changes, and other specialized visualization tools. Its public positioning emphasizes speed, client-ready visuals, product visualization, product customization, and team workspaces.

Agent B’s public pricing signals are materially higher than the intended Niwasthan consumer entry point. The public page presents individual and studio plans from approximately $31 per month, a Designer Pro tier at approximately $73, Unlimited Pro at approximately $126, and Business Pro at approximately $282 for five seats. These plans are designed around render volume and professional studio usage rather than an end-to-end homeowner journey.

The public launch announcement describes Agent B’s larger thesis as connecting visualization, procurement, customization, and execution. This validates several parts of Niwasthan’s direction but also shows that Niwasthan should differentiate on evidence, India-specific materials and suppliers, homeowner decision support, budget transparency, buildability, and a persistent home record.

### What Niwasthan should incorporate

| Agent B pattern | Niwasthan adaptation | Why it matters |
|---|---|---|
| Unified space plus product workflow | A single design workspace that binds rooms, elements, products, materials, and downstream budget lines | Prevents disconnected inspiration and purchasing |
| Smart Project from layout to render | Home intelligence pipeline from plan/photo to spatial review to design direction to governed visualization | Keeps the actual property as source of truth |
| Product customization | Product/material swap with compatibility, price delta, quality, maintenance, and buildability consequences | Makes alternatives useful rather than merely visual |
| Floor-plan and layout editing | Prompt-assisted layout review with explicit inferred geometry and user confirmation | Increases trust and reduces bad downstream decisions |
| Rapid focused tools | A small set of customer-facing tools: capture, compare, What-If, budget, review, and Humsafar | Avoids a confusing 20-tool toolbox while preserving speed |
| Team workspace | Family, designer, supplier, and execution roles with decision locks and audit trail | Fits Indian household and delivery realities |
| Catalog surface | Evidence-backed catalogue with source, freshness, geography, seller, warranty, and confidence | Differentiates from generic generated product imagery |

### What Niwasthan should not copy

Niwasthan should not lead with a gallery of AI effects, make render count the primary value metric, or present generated imagery as evidence of product identity or technical validity. It should also avoid launching every specialized visualization mode before the core property-to-decision loop is reliable.

## Production web experience

The web application should be a rich workspace with a premium brand layer. The home screen should answer status, next best action, confidence, budget, and design direction at a glance. The design workspace should combine an actual-home context panel, direction comparison, evidence drawer, product/material selections, and downstream impact. The catalogue should make “more options, better options, better deals” concrete without overwhelming the homeowner. The budget workspace should clearly separate estimates from confirmed values and show the effect of substitutions. Procurement and execution should use a lifecycle view rather than disconnected status pages.

The first production web slice implemented in the companion web workspace uses a warm editorial visual system: mineral neutrals, clay accent, brass signal, charcoal command surfaces, serif display typography, and restrained motion. It includes responsive navigation, a command center, home health metrics, evidence-aware next steps, design direction comparison, shortlist interactions, upload entry points, Humsafar entry point, and add-home flow.

## First-class mobile experience

Mobile should prioritize the actions that naturally happen away from a desktop: capture property photos and floor plans, review and approve decisions, compare products, receive price and execution alerts, capture snags, and communicate with the project. It should share the same domain model and permissions as the web client. It should support explicit sync state, safe retries, resumable media upload, local drafts, push notifications, and offline-friendly read access where practical.

The initial mobile slice should include five tabs: Home, Design, Budget, Build, and More. The home tab should show project pulse, next action, and quick capture. The design tab should show directions and approval state. The budget tab should show current estimate, confirmed spend, and savings opportunities. The build tab should show execution milestones and snag capture. More should contain notifications, Home Memory, settings, language, and account controls.

## Recommended delivery sequence

1. Stabilize the current web workspace around the property → intelligence → design → budget loop.
2. Connect the workspace to existing Niwasthan API/domain services rather than duplicating business logic in the client.
3. Ship mobile capture, review, approval, budget alert, and execution update flows against the same APIs.
4. Add evidence drawers and decision audit trails to every commercial or design recommendation.
5. Add Agent B-inspired speed tools only after the governed core loop is measured and reliable.
6. Add immersive and advanced rendering as an entitlement-backed layer that never bypasses spatial confidence or buildability review.

## References

[1]: https://agentb.studio/ "Agent B Studio public product website"
[2]: https://www.linkedin.com/posts/natasha-jain-b4b73141_for-the-last-few-months-ive-been-thinking-activity-7458036045238915072-ASFk "Agent B public launch announcement"
[3]: https://github.com/SidharthTiwari29/Niwasthan "Niwasthan repository"
