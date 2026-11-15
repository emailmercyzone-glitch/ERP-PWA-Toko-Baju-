# ERP PWA Toko Baju UMKM — Draft Technical Specification

**Status:** Draft for discussion (v0.1)  
**Last updated:** 2026-11-15  
**Repository:** `emailmercyzone-glitch/ERP-PWA-Toko-Baju-`  
**Purpose:** Shared document to agree on product scope and technical direction before larger implementation changes.

> This is a discussion draft, not a claim that the current application already meets these requirements. Items marked **Current** are observations from the repository snapshot; items marked **Proposed** are decisions or requirements to review. Production use with real financial, payroll, or customer data is out of scope until the open security and persistence issues are resolved.

## 1. Executive summary

The project aims to provide a mobile-friendly, installable ERP/POS for a small apparel retailer. The first release should prioritize reliable sales and inventory operations. Other workflows—payroll, consignments, vouchers, WhatsApp, AI insights, and advanced reporting—should follow only after the transaction and data foundations are reliable.

**Proposed product principle:** the server-side persistent database is the source of truth. Offline-capable clients may queue eligible operations, but cannot independently establish final payment, approval, or stock state.

## 2. Current repository snapshot

- **Current:** React + TypeScript frontend, Vite, Express server, PWA plugin, IndexedDB-related dependencies, and a Gemini SDK integration are present in the repository.
- **Current:** `server.ts` dispatches `/api/exec` to a GAS-like API engine and exposes Gemini and document/receipt routes.
- **Current:** the business engine uses a seeded in-memory `ERPDatabase`; data does not survive process restart and is not shared across instances.
- **Current:** demo PIN values and login behavior exist in the seed/business logic. They are not acceptable credentials for a deployed system.
- **Current:** the Gemini service includes a browser-side `VITE_GEMINI_API_KEY` fallback. Secrets must not be exposed through Vite client variables; remove this fallback before release.
- **Current:** multiple business modes are prototypes or placeholders. Their existence does not imply complete workflows or production readiness.
- **Current branch changes:** initial API boundary hardening and setup documentation have been added on `security-and-production-baseline`; the in-memory data store and demo authentication limitations remain.

## 3. Goals and non-goals

### Goals for the first usable release (proposed)

1. Record sales and payments without losing data on restart.
2. Maintain products, variants, store-level stock, and auditable stock movements.
3. Support owner, manager, cashier, and warehouse workflows with server-enforced permissions.
4. Provide a usable mobile/tablet PWA and a safe, bounded offline sales queue.
5. Provide basic operational reports based on persisted data.
6. Support backup and recovery with a documented, tested process.

### Non-goals for the first release (proposed)

- Full payroll, tax/e-Faktur, consignment settlement, and affiliate accounting.
- Real WhatsApp automation or payment-provider integrations.
- AI-generated business decisions or autonomous business actions.
- Multi-region or high-availability deployment guarantees.
- Treating local browser storage as the authoritative database.

## 4. Users and permissions

Proposed roles (permissions must be enforced by the API, not only hidden in the UI):

| Role | Initial responsibilities | Restrictions to confirm |
|---|---|---|
| Owner | Configure stores/users; view reports; approve sensitive operations; manage backups | Whether owner can perform cashier actions |
| Manager | Supervise store; approve configured operations; view store reports | HPP/profit visibility and approval limits |
| Cashier | Create sales, record payments, view permitted product/stock data | Cannot approve own exceptional discounts or voids |
| Warehouse | Receive/transfer/count stock and view warehouse inventory | No access to payroll, customer tax IDs, or financial reports |

**Decision needed:** Are users shared across stores, and should permissions be scoped to one or more store IDs?

## 5. Proposed MVP requirements

### Functional requirements

- **FR-01 Products:** list/search products and variants; maintain SKU, barcode, price, and active status.
- **FR-02 Inventory:** show per-store available stock; record receipts, sales, transfers, and stock counts as auditable movements.
- **FR-03 POS:** create a sale with one or more items; calculate totals server-side; reject invalid quantities and unavailable stock.
- **FR-04 Payments:** record one or more payment methods; distinguish pending/unverified from confirmed payments.
- **FR-05 Idempotency:** retrying the same client operation must not create a second sale; idempotency key and payload conflict behavior must be specified.
- **FR-06 Approvals:** configurable approval workflow for voids, discounts, transfers, and stock adjustments, including actor and decision history.
- **FR-07 Offline:** queue a sale with a stable idempotency key; display queued/syncing/synced/failed states; provide safe retry and conflict resolution.
- **FR-08 Reporting:** basic sales totals, transaction count, and stock summary filtered by authorized store and date range.
- **FR-09 Audit:** record actor, operation, timestamp, store, and target for sensitive operations without logging PINs, tokens, or secrets.
- **FR-10 Recovery:** create and restore a verified database backup; document recovery point and recovery time expectations.

### Acceptance criteria for MVP

- A committed sale and its stock movements remain available after an application restart.
- An invalid request is rejected without partial writes to sale, payment, journal, or stock records.
- Replaying an accepted idempotency key does not duplicate the sale or decrement stock again.
- A user cannot perform an action outside their server-verified role/store scope.
- A queued offline sale clearly reports its final server outcome and does not silently appear settled before confirmation.
- A backup can be restored in a non-production environment and checked against documented integrity checks.

## 6. Proposed architecture

```text
PWA (React / TypeScript)
  ├─ Online API client ───────────────┐
  ├─ IndexedDB: bounded offline queue │
  └─ UI / local cache                 │
                                      ▼
Express API (TypeScript)
  ├─ request parsing and schema validation
  ├─ authentication and authorization
  ├─ business services / transaction boundaries
  ├─ audit and idempotency handling
  └─ server-only integrations (Gemini, future providers)
                                      │
                                      ▼
Persistent relational database (proposed: PostgreSQL)
  ├─ migrations and constraints
  ├─ transaction/payment/inventory records
  └─ backup and restore process
```

**Proposed default:** PostgreSQL as the shared source of truth for deployed environments. SQLite may be considered for local development or a single-device pilot only after deployment and concurrency needs are agreed. The existing in-memory implementation should be treated as demo data, not migrated implicitly as authoritative records.

**Decision needed:** choose ORM/query layer (for example Prisma or Drizzle) and hosting target after the team confirms operational constraints.

## 7. Data model outline (proposed)

Initial relational entities:

- `users`, `credentials`, `roles` / role assignments, `stores`, and scoped permissions.
- `products`, `variants`, `prices`, `stock_balances`, and append-only `stock_movements`.
- `sales`, `sale_items`, `payments`, and `approvals`.
- `idempotency_records` and `audit_events`.
- `offline_sync_events` or equivalent server receipt records for client reconciliation.

Important invariants:

- Use database transactions for sale, payment, stock movement, and related ledger writes.
- Store money as integer minor units (IDR rupiah integer) unless a documented currency model requires otherwise.
- Enforce unique identifiers and idempotency keys at the database layer.
- Keep stock movement history; do not make a client-provided balance the source of truth.
- Define deletion/retention rules for customer and employee personal data.

## 8. API contract direction (proposed)

Use versioned, resource-oriented endpoints rather than expanding an undocumented generic mode dispatcher indefinitely. The existing `/api/exec` contract may remain temporarily for compatibility while features are migrated.

| Method and path | Purpose | Authorization (initial proposal) |
|---|---|---|
| `POST /api/v1/auth/login` | Authenticate a user/PIN credential | Public, rate-limited |
| `POST /api/v1/auth/logout` | Revoke session | Authenticated |
| `GET /api/v1/me` | Return actor and authorized store scope | Authenticated |
| `GET /api/v1/products` | Search products and variants | Authenticated |
| `GET /api/v1/stores/:storeId/stock` | Read authorized store stock | Store-scoped |
| `POST /api/v1/sales` | Create sale with idempotency key | Cashier/manager/owner, store-scoped |
| `POST /api/v1/approvals` | Request an approval | Role/action policy |
| `POST /api/v1/approvals/:id/decision` | Approve or reject | Authorized approver; no self-approval where policy requires |
| `GET /api/v1/reports/sales` | Read sales report | Owner/manager policy |
| `POST /api/v1/gemini/advisor` | Request advisory text | Authenticated, rate-limited, server-side key only |

Error response shape (proposed):

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request tidak valid.",
    "request_id": "client-generated-or-server-generated-id",
    "details": []
  }
}
```

Do not return stack traces, credentials, internal database details, or sensitive customer/employee fields in errors.

## 9. Security and privacy requirements

- Replace demo PINs and role selection with real server-side authentication. Hash credentials using a suitable password hashing algorithm and configured work factor; never compare a submitted PIN directly with stored plaintext.
- Do not accept a client-supplied role or user ID as proof of identity. Derive actor and store scope from a verified session.
- Apply authorization per business action and store scope; add tests for denied access.
- Keep Gemini credentials exclusively in server environment/secrets. Remove the `window.VITE_GEMINI_API_KEY` fallback and verify built assets contain no secret.
- Validate each endpoint/mode with a schema and explicit bounds. Request-envelope validation alone is insufficient.
- Use HTTPS in deployment, secure session/cookie settings (or an explicitly reviewed token design), CSRF protection where cookie-based auth is used, and a restrictive CSP after frontend integrations are audited.
- Use a shared rate-limit store if horizontally scaling. Trust proxy configuration only when deployment topology is known.
- Minimize personal and financial data returned to clients and stored in logs. Define access, retention, backup encryption, and incident-response procedures.
- Do not claim IndexedDB encryption protects against an attacker who controls the user's browser/device; prioritize device access controls and server-side authorization.

## 10. Offline and synchronization rules

- Only explicitly approved operations may be queued offline; the first candidate is a sale draft/transaction.
- Each queued operation includes a unique idempotency key, schema version, creation time, and required business data. Never include API secrets or reusable credentials.
- Server validation remains authoritative for price, stock, permissions, and payment state.
- Sync responses must be explicit: accepted, already processed, rejected validation, rejected conflict, or retryable server failure.
- Do not retry permanent validation/authorization errors automatically. Retry transient network/server failures with bounded exponential backoff and jitter.
- Preserve the original outcome and provide an operator workflow for rejected/conflicting transactions; do not silently discard the queue.

## 11. Reliability, operations, and quality

Proposed initial targets (confirm before treating as commitments):

- API latency: p95 under 500 ms for basic reads and under 2 seconds for standard sale writes, excluding external AI calls.
- Availability: define a realistic pilot target before production; 99.9% is not assumed without hosting/monitoring/on-call capability.
- Recovery: define recovery point objective (RPO) and recovery time objective (RTO) before choosing backup schedule.
- Automated tests: unit tests for business rules; integration tests against a temporary persistent database; API tests for auth, permissions, validation, idempotency, and stock concurrency.
- CI: dependency install, typecheck/lint, tests, production build, and dependency/security checks.
- Observability: structured request IDs, redacted logs, health/readiness endpoints, error monitoring, and database/backup alerts.

## 12. Delivery phases (proposed)

### Phase 0 — agree and document

Confirm MVP, role model, store scoping, deployment assumptions, and data retention. Record decisions below before schema design.

### Phase 1 — foundations

Add persistent database, migrations, repository/service boundary, authentication, authorization, schema validation, and automated CI. Keep demo seed data clearly separate from real business data.

### Phase 2 — operational core

Implement products, stock movements, POS sales, payments, idempotency, approval rules, and audit history with database transactions and integration tests.

### Phase 3 — offline and operations

Implement offline queue reconciliation, verified backups/restores, deployment, monitoring, and documented recovery procedures.

### Phase 4 — additional modules

Add reports and then prioritize payroll, consignments, vouchers, WhatsApp, and Gemini based on business value and legal/security requirements.

## 13. Decisions for the discussion

Please answer or edit these before we treat this as an implementation contract:

1. Is the first release for one store or multiple stores?
2. Which users and permission rules are essential for MVP? Is PIN login a firm requirement, or can staff use accounts/passwords/passkeys?
3. Which offline actions are required on day one, and can a sale remain pending until server reconciliation?
4. Is PostgreSQL acceptable as the deployed source of truth? Where is the intended hosting environment?
5. Are prices always integer IDR, and which payment methods need verification before a sale is considered paid?
6. What approval thresholds and separation-of-duties rules should apply to discounts, voids, transfers, and stock counts?
7. Which data must be retained, and what backup RPO/RTO are acceptable?
8. Which modules are truly in the first release: POS, stock, cash/journal, reports, payroll, consignment, vouchers, WhatsApp, or AI?
9. Is Gemini advisory text allowed to receive transaction/business data, and what data must be excluded?
10. Should the existing `/api/exec` contract be preserved for a transition period or replaced directly?

## 14. Change log

- **v0.1:** Initial discussion draft. Captures repository limitations and proposes an MVP, architecture, requirements, API direction, security baseline, and decisions to resolve. No persistence/auth migration is claimed to be complete.
