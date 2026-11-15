# ERP PWA Toko Baju UMKM

Prototype ERP/PWA built with React, TypeScript, Vite, Express, and a simulated GAS-like API engine.

## Local development

- Install dependencies with `bun install` or `npm install`.
- Copy `.env.example` to `.env` and set server-side secrets if using Gemini.
- Run `bun run dev` (or `npm run dev`).
- Run `bun run build` and `bun run lint` before submitting changes.
- Run production with `NODE_ENV=production npm start` after building.

The `start` script uses `tsx` so the TypeScript Express entry point runs correctly in this ESM project. Configure the service to terminate/restart through your process manager.

## Current limitations — not production-ready

- `src/services/db.ts` creates a seeded in-memory database. Its data resets on restart and is not shared across instances. Do not use it as the system of record for real transactions.
- The API does not yet have a complete authenticated authorization/session model. The demo PINs and role/login behavior in the business engine are not secure credentials. Do not expose the app publicly or process real customer/payroll data until authentication and role-based authorization are implemented.
- The request rate limiter added to Express is process-local; use a shared store and proxy-aware configuration for multi-instance deployment.
- Backups, restore, document generation, and several business operations are prototypes; verify they are real before relying on them.
- API envelope validation is a first boundary check, not a substitute for validating each mode's payload and business invariants.

## Server environment

- `PORT`: HTTP port (default `3000`).
- `NODE_ENV`: set `production` to serve the built `dist/` application.
- `GEMINI_API_KEY`: optional server-side Gemini credential. Never use a `VITE_` prefixed name for secrets because Vite exposes those to browser bundles.

## HTTP endpoints

- `POST /api/exec`: dispatches a mode through `executeAPIMode`; requires `mode`, `request_id`, and object-valued `payload`.
- `POST /api/gemini/advisor`: accepts a bounded `query` and a store ID (`TKO1`–`TKO4`, `GDG`, or `ALL`).
- `GET /api/print/receipt/:trxId`: renders an existing in-memory transaction receipt.
- `GET /api/dokumen/pdf/:tipe/:id`: currently returns a demo HTML document template (not a PDF).
- `GET /api/health`: basic liveness response; does not verify database readiness.

## Security baseline in this branch

Express request size is limited, JSON envelopes are checked, endpoint request rates are bounded, basic security headers are emitted, server errors do not return exception details, and dynamic receipt/document text is HTML-escaped. These are baseline mitigations, not a production security certification. CSP, persistent storage, proper auth, per-mode validation, automated tests, and distributed rate limiting remain follow-up work.
