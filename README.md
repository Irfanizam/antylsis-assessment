# Loyalty Program

A full-stack loyalty application. Customers register, upload their purchase receipts, and receive a
voucher once an administrator approves the receipt. Built with **React, Express, and PostgreSQL**.

## Features

**Customer**
- Register and sign in with an email address or phone number
- Upload a purchase receipt (image or PDF) with its order ID, purchase date, and amount
- Track submitted receipts and their status (pending / approved / rejected)
- View vouchers issued for approved receipts
- Manage profile details

**Administrator**
- Review submitted receipts and their attached files
- Approve a receipt — which issues the customer exactly one voucher — or reject it
- Dashboard with receipt and voucher statistics

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT in an httpOnly cookie |
| API docs | Swagger / OpenAPI (`/api/docs`) |
| Tests | Vitest, Supertest |

## Getting started

**Prerequisites:** Node.js 20+, Docker (for PostgreSQL) or a local PostgreSQL 16 instance.

**1. Database**
```bash
docker compose up -d db
```

**2. Backend**
```bash
cd server
cp .env.example .env          # set JWT_SECRET to a long random string
npm install
npm run prisma:migrate        # apply the database schema
npm run seed                  # demo accounts + sample data
npm run dev                   # http://localhost:4000
```

**3. Frontend**
```bash
cd client
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

API health check: `curl http://localhost:4000/api/health`.

> Migrations are applied with `prisma migrate deploy`. The schema relies on PostgreSQL features
> (a partial unique index, `CHECK` constraints, and an `updated_at` trigger) that are kept in a
> hand-written migration alongside the Prisma-generated tables.

## Project structure

```
.
├─ docker-compose.yml     PostgreSQL for local development
├─ server/                Express + Prisma API
│  ├─ src/
│  │  ├─ config/          environment loading and validation
│  │  ├─ lib/             database client, errors, storage
│  │  ├─ middleware/      error handling, auth, validation, upload
│  │  └─ modules/         auth, receipts, vouchers, admin
│  ├─ prisma/             schema, migrations, seed
│  └─ uploads/            stored receipt files (not committed)
└─ client/                React application
```

## Key design decisions

- **A receipt yields exactly one voucher.** Approval runs in a single transaction with a conditional
  update (`... WHERE status = 'PENDING'`) and a unique constraint on the voucher's `receipt_id`, so a
  double-click or two administrators acting at once still produce one voucher.
- **Data ownership is enforced in the query,** not after fetching — every customer query is scoped by
  the authenticated user's id, and a request for another user's record returns 404.
- **Receipt files are served through an authenticated, ownership-checked route,** never from a public
  static directory.
- **Money is stored as `NUMERIC(12,2)`** and the purchase date as a `DATE`; important rules are
  enforced by the database (constraints) as well as the API.

## Environment

Every variable is documented with a safe default in [`server/.env.example`](server/.env.example). The
server validates its configuration at startup and refuses to run if anything required is missing.

## Testing

```bash
cd server && npm test
```
Tests focus on the business-critical paths: voucher issuance and idempotency, access control, and input
validation.

## AI assistance

AI tooling was used to speed up boilerplate and scaffolding. The data model, the receipt-approval and
voucher-issuance logic, the authorization rules, and the database constraints were designed and
reviewed by hand.
