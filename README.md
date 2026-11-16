# ERP PWA Toko Baju UMKM

A prototype ERP and PWA system for fashion retail operations, built with React, TypeScript, Vite, Express, and a simulated business engine inspired by a GAS-like workflow model.

This project is designed for small to medium-sized fashion retail businesses that need:
- fast daily POS workflows,
- multi-store visibility,
- stock tracking,
- offline-friendly transactions,
- simple reporting,
- basic operational controls.

It is currently positioned as a functional prototype and MVP foundation, not a production-grade ERP system.

## Highlights

- Multi-store / multi-branch operations
- POS-based sales workflow
- Inventory and stock tracking
- Offline-first transaction handling
- Simple document and receipt generation
- Basic business rules and approval flow
- Security baseline and request hardening
- AI advisor integration (optional, server-side only)

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Runtime: Node.js
- Offline/local storage: IndexedDB
- AI integration: Google Gemini (server-side only)
- Styling: Tailwind CSS
- Build tooling: Vite, TSX

## Project Structure

```text
ERP-PWA-Toko-Baju-/
├── public/
├── src/
│   ├── components/
│   ├── gas/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── docs/
│   └── TECHNICAL_SPEC.md
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── bun.lock
├── README.md
└── LICENSE
```

## Core Principles

This project follows a pragmatic approach for MSME retail operations:

1. Keep the interface simple and fast for cashier workflows.
2. Support offline transactions without interrupting daily operations.
3. Keep business-critical validation in the backend.
4. Favor practical usability over theoretical ERP complexity.
5. Keep storage and deployment choices flexible.

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
bun install
```

### 2. Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Then set your values as needed.

### 3. Start development server

```bash
npm run dev
# or
bun run dev
```

### 4. Build for production

```bash
npm run build
```

### 5. Run the production server

```bash
NODE_ENV=production npm start
```

## Environment Variables

Example environment file:

```env
GEMINI_API_KEY=
PORT=3000
NODE_ENV=development
```

Notes:
- `GEMINI_API_KEY` is optional and must remain server-side only.
- `PORT` defaults to `3000` if not set.
- `NODE_ENV=production` serves the built frontend from `dist/`.

## API Overview

This project exposes a small set of demo and prototype endpoints for internal business workflow testing.

### Health

```http
GET /api/health
```

### Execute business mode

```http
POST /api/exec
Content-Type: application/json
```

Example body:

```json
{
  "mode": "sales",
  "request_id": "REQ-001",
  "payload": {
    "store_id": "TKO1"
  }
}
```

### Gemini advisor

```http
POST /api/gemini/advisor
Content-Type: application/json
```

Example body:

```json
{
  "query": "Berikan rekomendasi cepat untuk penjualan hari ini",
  "toko_id": "TKO1"
}
```

### Receipt print

```http
GET /api/print/receipt/:trxId
```

### Demo document endpoint

```http
GET /api/dokumen/pdf/:tipe/:id
```

## Security Baseline

This repository includes a basic protection layer such as:
- request size limiting,
- strict JSON parsing,
- request rate limiting,
- security headers,
- generic internal error handling,
- no stack trace leakage to clients.

Important:
- This is a baseline only.
- It is not a complete identity or authorization model.
- It should not be treated as production-grade security.

## Current Limitations

This project is intentionally a prototype with the following known limitations:

- The default database is in-memory and resets on restart.
- The system is not designed as a production-grade multi-instance deployment.
- PIN-based login is demo-oriented and not a secure production authentication model.
- Some business flows are still simulation-based.
- Backup and restore behavior is still a prototype.
- API validation is a baseline safeguard only, not exhaustive business validation.
- The production-ready architecture should use a secure shared data store and proper session/auth flow.

## Roadmap

Planned focus areas:
1. robust authentication and role management,
2. persistent database integration,
3. offline sync reliability,
4. proper audit logs and approvals,
5. deployment hardening,
6. business reporting and dashboard analytics.

## Status

This repository is currently a prototype / MVP foundation for fashion retail operations and is not yet a production-ready ERP system.

## Disclaimer

This repository is a prototype ERP/PWA system for fashion retail operations. It is not yet a production-ready commercial ERP platform and should be used with appropriate validation, testing, and operational review before real business deployment.
