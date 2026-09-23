# Niwasthan design system and core vertical slice

## Product stance

Niwasthan is a transparent home-intelligence platform. Agent B is a reference for speed, focused tools, visual comparison, and collaboration—not the product definition. The interface must make the full Niwasthan sequence understandable: real home, spatial understanding, design directions, real products, consequences, budget, procurement, execution, quality, handover, and Home Memory.

## Design principles

**Real-home first.** Every workspace begins with a named property and the evidence currently available. Users can see what is confirmed, inferred, estimated, or unknown.

**Beautiful comparison, honest consequences.** Design directions and products should be easy to compare visually, but the decision surface must also show price basis, availability, maintenance, warranty, confidence, and downstream BOQ or execution impact.

**One next best action.** Each screen should identify the highest-value next step rather than presenting a toolbox with equal weight for every action.

**User-owned decisions.** Accept, reject, compare, modify, replace, lock, preserve, and revert are explicit interactions. AI suggestions do not silently mutate locked decisions.

**Calm premium, not luxury theatre.** Use warm mineral neutrals, charcoal command surfaces, laterite action accents, brass signals, serif editorial hierarchy, compact mono metadata, and restrained motion. Premium should communicate care and confidence, not exclusivity.

## Core vertical slice

The primary journey is **Home Truth → Design Options → Consequence Comparison → Decision**.

1. The customer creates or opens a property.
2. The customer uploads a plan/photo/video or reviews known room data.
3. The product labels spatial facts as confirmed, inferred, or unknown.
4. The customer opens a design project and sees multiple directions.
5. The customer compares a direction or product by look, price, fit, durability, availability, confidence, and downstream impact.
6. The customer generates a budget/BOQ recommendation from a target budget.
7. The customer commits only after reviewing selections and totals.
8. The selected direction can produce a governed 3D or walkthrough job, never as proof of buildability.

## Responsive information architecture

The authenticated web client uses a persistent workspace rail for Command center, My homes, Catalogue intelligence, Budget & BOQ, and Build & handover. Property and design detail screens retain context through a back link, property identity, evidence status, and a visible next action. Mobile uses Home, Design, Budget, Build, and More tabs against the same shared domain state.

## Truth labels

| Label | Meaning | Visual treatment |
|---|---|---|
| Confirmed | Supported by user or authoritative evidence | Moss / check |
| Inferred | Derived from analysis and awaiting confirmation | Brass / sparkle |
| Estimated | A model or commercial estimate with a declared basis | Laterite / approximation |
| Unknown | Not enough evidence to make a claim | Muted neutral / question |
| Locked | Explicit user decision that later automation cannot silently change | Charcoal / lock |

## Agent B patterns incorporated

Niwasthan borrows focused quick actions, fast visual feedback, direction cards, product/material customization, side-by-side comparison, and collaborative review. It adds the differentiating layers Agent B does not define for this product: provenance, freshness, Indian market context, buildability, budget/BOQ consequences, savings truth, approval state, and Home Memory.

## Completion definition

A design pass is complete when the customer can move from a real property to a grounded design decision without losing context, without seeing fabricated certainty, and without needing to interpret disconnected feature pages. The next engineering pass is to bind the remaining detail cards to live service queries and to add tests around the decision comparison and truth-label components.

## Audited implementation status

| README area | Current repository status | Design implication |
|---|---|---|
| Foundation | Auth, PostgreSQL/Prisma schema, service/repository boundaries, jobs, storage, payments, observability, and security contracts exist | Preserve the service boundaries; avoid client-side business rules |
| Home intelligence | Property, floor plan, room understanding, observations, confirmation, Home Intelligence, Home DNA, and related APIs exist | Make evidence and confidence the first visible customer layer |
| Design | Design projects, versions, revisions, directions, battle, quality checks, scene generation, and design-to-BOQ routes exist | Consolidate into one decision room rather than isolated forms |
| Catalogue intelligence | Catalogue, product taxonomy, brands, prices, provenance, verification, merits, substitutions, recommendations, and market services exist | Show product comparison with source, freshness, and downstream impact |
| Budget / BOQ | Costing, BOQ generation, budget preview, budget reduction, savings optimizer, What-If, and reconciliation routes exist | Separate target, estimate, confirmed, potential, accepted, and verified values |
| Visualization | Durable AI jobs, assets, 3D scene, walkthrough, and reality-check boundaries exist | Present visualization as a governed review output, never proof of buildability |
| Procurement / execution | Procurement, quotes, negotiation, orders, execution records, notifications, and supplier portal routes exist | Add a lifecycle view after design lock and maintain decision history |
| Mobile | Expo first-class client shell exists, with Home, Design, Budget, Build, and More information architecture | Connect to shared authenticated APIs, camera, uploads, push, and offline sync |
| Production completeness | The domain foundation is broad, but some customer surfaces still use route-local forms and the build environment requires configured secrets/providers | Prioritize vertical-slice integration and environment hardening before broadening scope |

The current redesign closes the most important presentation gap: it gives the domain system a clear command center, a property-level Home Truth workspace, a comparison-led design decision room, and a consistent mobile information architecture. It does not claim that provider-backed rendering, market freshness, procurement, execution, or mobile synchronization are complete until their real services are connected and verified end to end.
