# Receipt Hub

A full-stack receipt-rewards application. Customers register, upload their purchase receipts, and receive a
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

```bash
cp server/.env.example server/.env    # set JWT_SECRET to a long random string
cp client/.env.example client/.env

npm install        # root dev tooling (concurrently)
npm run setup      # install server + client dependencies
npm run db:up      # start PostgreSQL in Docker
npm run db:migrate # apply the database schema
npm run db:seed    # demo accounts + sample data
npm run dev        # API on :4000, web on :5173
```

Then open http://localhost:5173. API health check: `curl http://localhost:4000/api/health`.

<details>
<summary>Run the API and the web app separately</summary>

```bash
# terminal 1 — API
cd server && npm install && npm run prisma:migrate && npm run seed && npm run dev

# terminal 2 — web
cd client && npm install && npm run dev
```
</details>

> Migrations are applied with `prisma migrate deploy`. The schema relies on PostgreSQL features
> (a partial unique index, `CHECK` constraints, and an `updated_at` trigger) that are kept in a
> hand-written migration alongside the Prisma-generated tables.

## Demo accounts

Created by `npm run db:seed`:

| Role | Login | Password |
|---|---|---|
| Administrator | `admin@loyalty.test` | `Admin123!` |
| Customer (with receipts) | `alice@loyalty.test` | `User123!` |
| Customer (empty) | `bob@loyalty.test` | `User123!` |

A quick walkthrough: sign in as **alice** to see receipts and a voucher, or as **bob** and upload a
receipt; then sign in as the **admin** to approve it and watch a voucher get issued.

## API documentation

Interactive Swagger UI is served at **http://localhost:4000/api/docs** (raw spec at `/api/docs.json`).

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

## License

[MIT](LICENSE).
