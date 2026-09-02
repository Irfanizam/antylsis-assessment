-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" TEXT NOT NULL,
    "purchase_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'MYR',
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "file_key" TEXT NOT NULL,
    "file_original_name" TEXT NOT NULL,
    "file_mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "receipt_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'MYR',
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "redeemed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "receipts_user_id_created_at_idx" ON "receipts"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "receipts_status_created_at_idx" ON "receipts"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_receipt_id_key" ON "vouchers"("receipt_id");

-- CreateIndex
CREATE INDEX "vouchers_user_id_status_idx" ON "vouchers"("user_id", "status");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Database-level invariants (not expressible in the Prisma schema language):
-- CHECK constraints, a partial unique index, and an updated_at trigger.
-- ---------------------------------------------------------------------------

-- A user is identified by an email or a phone (at least one present).
ALTER TABLE "users" ADD CONSTRAINT "users_identity_present"
  CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL);

-- Amount and order id sanity.
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_amount_range"
  CHECK ("amount" > 0 AND "amount" <= 1000000);
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_order_len"
  CHECK (char_length(btrim("order_id")) BETWEEN 1 AND 64);

-- A reviewed receipt must carry its reviewer and timestamp; a pending one must not.
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_review_consistency" CHECK (
  ("status" = 'PENDING'  AND "reviewed_by" IS NULL     AND "reviewed_at" IS NULL) OR
  ("status" <> 'PENDING' AND "reviewed_by" IS NOT NULL AND "reviewed_at" IS NOT NULL)
);

-- One active receipt per (user, order id); a rejected receipt may be resubmitted.
CREATE UNIQUE INDEX "receipts_user_order_active_key"
  ON "receipts" ("user_id", lower("order_id")) WHERE "status" <> 'REJECTED';

-- Keep updated_at authoritative on every UPDATE regardless of the writer.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "users"    ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "receipts" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vouchers" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

CREATE TRIGGER users_set_updated_at    BEFORE UPDATE ON "users"    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER receipts_set_updated_at BEFORE UPDATE ON "receipts" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER vouchers_set_updated_at BEFORE UPDATE ON "vouchers" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
