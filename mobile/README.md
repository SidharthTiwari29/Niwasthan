# Niwasthan Mobile

This directory contains the first-class Expo mobile client for Niwasthan. It is intentionally not a thin web wrapper. The client organizes the customer journey around **Home**, **Design**, **Budget**, **Build**, and **More** surfaces.

## Current product slice

The mobile experience includes a responsive command center, project sync state, home intelligence metrics, next-best-step capture entry points, design-direction comparison with shortlist state, budget transparency language, build and handover milestones, snag capture entry points, notifications, Home Memory, and Humsafar entry points.

The UI is currently a domain-aligned client shell. It does not invent authoritative product, price, geometry, warranty, execution, or savings facts. The visible values are clearly positioned as workspace/demo state until the shared API is connected.

## Shared-domain integration contract

The mobile client must consume the same authenticated services and lifecycle states as the Niwasthan web application. It must not duplicate authoritative business rules locally. The next integration step is to connect:

- property and room queries;
- floor-plan, photo, and video upload with resumable retries;
- spatial understanding review and confirmation;
- design directions, revisions, and decision locks;
- catalogue, evidence, substitutions, and market observations;
- budget, BOQ, What-If, and savings states;
- procurement, execution, snagging, and handover;
- notifications, assistant, and Home Memory.

## Local verification

```bash
npm install
npx tsc --noEmit
npx expo export --platform web
```

The mobile workspace is configured for Expo SDK 57 and can run through Expo Go or native builds. Camera, notification, resumable upload, offline persistence, and push-token registration should be connected through the existing Niwasthan domain services before public release.
