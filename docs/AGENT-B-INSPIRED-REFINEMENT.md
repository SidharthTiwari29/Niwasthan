# Agent B-inspired Niwasthan refinement

## Decision

Agent B Studio is a useful reference for interaction speed, visual comparison, layout-to-render flow, product/material swapping, moodboards, client presentation, and focused creative tools. Its public positioning is primarily a visualisation platform for designers, brands, and real-estate teams. Niwasthan should borrow those interaction patterns without becoming a render-credit product.

Agent B publicly describes workflows including Quick Generate, Smart Project, Design Product, Quick Layout, photo editing, moodboards, layout editing, material changes, camera-angle changes, and 2D-layout-to-3D conversion. Its designer workflow is presented as upload layout → curate moodboard → create or integrate products → scaled rendering. Its real-estate workflow adds unit-specific layouts, finish customisation, interactive presentation, and portfolio dashboards. Its pricing packages emphasise render volume, AI setup allowances, product and BOM features, client presentations, team seats, and quotations. Sources: [Agent B home](https://agentb.studio/), [designer workflow](https://agentb.studio/designer-info), [real-estate workflow](https://agentb.studio/real-estate), and [pricing](https://agentb.studio/pricing).

## What Niwasthan already does better for its intended customer

Niwasthan's README defines a broader and more defensible contract: the customer's real home is the source of truth; evidence, confidence, provenance, freshness, price basis, warranty, savings, buildability, BOQ, procurement, execution, quality, handover, and Home Memory remain connected. The repository already contains foundations for room understanding, directions, catalogue intelligence, substitutions, budget preview, BOQ generation, savings, visualisation jobs, procurement, execution, notifications, and Home Memory. These capabilities should not be hidden behind a visual-only experience.

## Refinements implemented in this pass

The design decision room now contains a proportional top-down room view. It uses the actual room dimensions and persisted layout-object geometry, rather than an illustrative stock floor plan. Objects are shown with their stored position and dimensions, and the view is explicitly labelled as a proportional review aid rather than construction documentation.

This improves the Agent B-inspired layout-to-render loop while preserving Niwasthan's stronger rule: a visual preview is not evidence of buildability. The same room can continue into the persisted reality-check flow, where the user sees outside-boundary errors, overlaps, and low-clearance warnings.

## Product choices to add next

The next high-value additions should be a visual drag-and-drop editor backed by the existing layout-object API, a side-by-side product/material comparison with source freshness and downstream BOQ impact, a client review packet with explicit approvals and comments, and a decision timeline that records who changed, accepted, rejected, or locked an item. These are more valuable to Niwasthan than copying Agent B's broad list of AI image tools because they strengthen trust and execution.

Agent B-style capabilities such as moodboards, material swaps, angle changes, and client presentations remain useful, but they should be implemented as governed actions attached to a real property, real direction, and real product evidence. Generated visuals must retain their input context and must never silently overwrite a locked decision.

## Guardrails

Niwasthan should not promise instant rendering latency, certified products, verified prices, availability, warranties, savings, or spatial fit unless the corresponding evidence exists. Unknown values remain unknown; inferred values carry confidence; estimates carry a declared basis; and locked decisions cannot be silently mutated by automation.

## Completion criteria for the next refinement cycle

A customer should be able to open a real room, confirm its evidence, place or import a small set of real objects, see a proportional plan, run a spatial check, compare the consequence of product choices, and preserve the resulting decision history across web and mobile. That is the appropriate Niwasthan interpretation of Agent B's visual speed: faster decisions without reducing truth.
