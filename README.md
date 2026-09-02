# Loyalty Program

A full-stack loyalty app: users register, upload purchase receipts, and receive a voucher once an
administrator approves the receipt. Built with **React + Express + PostgreSQL (Prisma)**.

> Status: **in active development** — being built feature-by-feature via pull requests into `main`.
> This README grows with the app; sections marked _(coming)_ land with their feature.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript _(coming)_ | fast dev, typed components |
| Backend | Node.js + Express + TypeScript (run via `tsx`) | typed, no build step in dev |
| Database | PostgreSQL 16 | relational, strong constraints |
| ORM | Prisma _(coming)_ | typed client + migrations; schema doubles as DB docs |
| Auth | JWT in an httpOnly cookie _(coming)_ | private receipt images render via `<img>`, which can't send a Bearer header |
| API docs | Swagger / OpenAPI _(coming)_ | `/api/docs` |
| Tests | Vitest + Supertest _(coming)_ | backend invariants (voucher idempotency, authz) |

## Repository layout

```
antylsis-assessment/
├─ docker-compose.yml     # PostgreSQL for local dev
├─ server/                # Express + Prisma API
│  ├─ src/
│  │  ├─ config/env.ts    # the only reader of process.env (fail-fast)
│  │  ├─ lib/             # errors, prisma client, storage
│  │  ├─ middleware/      # error handler, auth, validation, upload
│  │  └─ modules/         # auth, receipts, vouchers, admin (per feature)
│  ├─ prisma/             # schema, migrations, seed  (coming)
│  └─ uploads/            # receipt files (gitignored)
└─ client/                # React app  (coming)
```

## Quick start

**1. Start PostgreSQL**
```bash
docker compose up -d db
```

**2. Backend**
```bash
cd server
cp .env.example .env         # then set JWT_SECRET (min 32 chars)
npm install
# npm run prisma:migrate:dev  # (coming)
# npm run seed                # (coming)
npm run dev                   # http://localhost:4000
```

Health check: `curl http://localhost:4000/api/health` → `{ "status": "ok", ... }`

**3. Frontend** _(coming)_

## Design decisions & trade-offs

The interesting parts of this app are the business-rule guarantees, not the CRUD. Highlights that
will land with their features:

- **Exactly one voucher per approved receipt, idempotently** — enforced by a `UNIQUE(receipt_id)`
  constraint plus a conditional `UPDATE … WHERE status='PENDING'` inside a transaction (not a
  read-then-write check that races).
- **Ownership in the query** (`WHERE user_id = …`), not a post-fetch check; cross-user access returns
  404, not 403.
- **Receipt files served through an authorized route**, never `express.static` on a public folder.

_A full "Decisions & trade-offs" and "Deliberately out of scope" section lands with the final polish._

## Environment

See [`server/.env.example`](server/.env.example) for every variable and a safe default. The server
validates its config at boot and refuses to start if anything required is missing.

## Development

Built with AI assistance (see the final README section for specifics). Every commit is authored and
reviewed by the maintainer; business-critical logic (the approval transaction, the DB constraints,
authorization) is hand-designed.
