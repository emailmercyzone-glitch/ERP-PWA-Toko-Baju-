# ERP PWA Toko Baju UMKM

A prototype ERP and PWA system for fashion retail operations, built with React, TypeScript, Vite, Express, and a simulated business engine inspired by a GAS-like workflow model.

This project is designed for small to medium-sized fashion retail businesses that need:
- fast daily POS workflows,
- multi-store visibility,
- stock tracking,
- offline-friendly transactions,
- simple reporting,
- basic operational controls.

This repository is currently positioned as a functional prototype and MVP foundation for internal evaluation. It is not a production-grade ERP system.

## Product Decisions

The project is intentionally scoped around a realistic MSME operating model:

- Multi-store from the start
- Offline-first as a core requirement, not a bonus feature
- Server remains the source of truth for pricing, stock, and final transaction state
- Owner and cashier UX are intentionally separated
- Approval is limited to critical actions only: large discounts and voids
- Gemini AI is explicitly deferred until the core retail workflow is stable

## Highlights

- Multi-store / multi-branch operations
- POS-based sales workflow
- Inventory and stock tracking
- Offline-first transaction handling
- Simple document and receipt generation
- Basic business rules and approval flow
- Security baseline and request hardening
- AI advisor integration (optional, server-side only)

## Core Principles

1. Cashier UX must be fast and simple.
2. Owner UX must focus on summaries and decision support.
3. Offline transactions are allowed, but never final until server validation.
4. Server validation decides the final state of price, stock, and transaction outcome.
5. Critical actions must be reviewable and auditable.
6. The architecture must avoid over-committing to a weak adapter model.

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Runtime: Node.js
- Offline/local storage: IndexedDB
- AI integration: Google Gemini (server-side only)
- Styling: Tailwind CSS
- Build tooling: Vite, TSX

## Current Product Positioning

This project is not designed to behave like a large corporate ERP. The operational model is deliberately constrained to what is realistic for a small retail environment:

- a few stores,
- a few cashiers per store,
- limited approval flow,
- a core POS and stock workflow,
- offline resilience without compromising final accountability.

## Security and Operational Guardrails

This branch includes a baseline security layer and operational assumptions:
- request size limiting,
- strict JSON parsing,
- request rate limiting,
- security headers,
- generic internal error handling,
- no stack trace leakage to clients,
- no trusted client-side control for stock or pricing final state.

## Current Limitations

- The default database is in-memory and resets on restart.
- The system is not designed as a production-grade multi-instance deployment.
- PIN-based login is demo-oriented and not a secure production authentication model.
- Some business flows are still simulation-based.
- Backup and restore behavior is still a prototype.
- API validation is a baseline safeguard only, not exhaustive business validation.
- This project is intentionally scoped for MSME retail and not an enterprise ERP.

## Roadmap

Planned focus areas:
1. robust authentication and role management,
2. persistent database integration,
3. offline sync reliability,
4. proper audit logs and approvals,
5. deployment hardening,
6. business reporting and dashboard analytics.

## Disclaimer

This repository is a prototype ERP/PWA system for fashion retail operations. It is not yet a production-ready commercial ERP platform and should be used with appropriate validation, testing, and operational review before real business deployment.
