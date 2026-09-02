import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { createUser, agentFor, submitReceipt } from './helpers';

describe('receipt approval and voucher issuance', () => {
  it('approves a pending receipt and issues exactly one voucher', async () => {
    await createUser({ email: 'admin@t.co', role: 'ADMIN' });
    await createUser({ email: 'user@t.co' });
    const user = await agentFor('user@t.co');
    const admin = await agentFor('admin@t.co');
    const id = await submitReceipt(user, 'ORD-A');

    const res = await admin.post(`/api/admin/receipts/${id}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.voucher?.receiptId).toBe(id);
    expect(await prisma.voucher.count({ where: { receiptId: id } })).toBe(1);
  });

  it('re-approving does not create a second voucher (409)', async () => {
    await createUser({ email: 'admin@t.co', role: 'ADMIN' });
    await createUser({ email: 'user@t.co' });
    const user = await agentFor('user@t.co');
    const admin = await agentFor('admin@t.co');
    const id = await submitReceipt(user, 'ORD-B');

    await admin.post(`/api/admin/receipts/${id}/approve`).expect(200);
    const again = await admin.post(`/api/admin/receipts/${id}/approve`);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('RECEIPT_ALREADY_PROCESSED');
    expect(await prisma.voucher.count({ where: { receiptId: id } })).toBe(1);
  });

  it('rejecting a receipt issues no voucher', async () => {
    await createUser({ email: 'admin@t.co', role: 'ADMIN' });
    await createUser({ email: 'user@t.co' });
    const user = await agentFor('user@t.co');
    const admin = await agentFor('admin@t.co');
    const id = await submitReceipt(user, 'ORD-C');

    await admin.post(`/api/admin/receipts/${id}/reject`).send({ reason: 'blurry image' }).expect(200);
    expect(await prisma.voucher.count({ where: { receiptId: id } })).toBe(0);
  });

  it('approving an already-rejected receipt is a conflict', async () => {
    await createUser({ email: 'admin@t.co', role: 'ADMIN' });
    await createUser({ email: 'user@t.co' });
    const user = await agentFor('user@t.co');
    const admin = await agentFor('admin@t.co');
    const id = await submitReceipt(user, 'ORD-D');

    await admin.post(`/api/admin/receipts/${id}/reject`).send({ reason: 'no' }).expect(200);
    await admin.post(`/api/admin/receipts/${id}/approve`).expect(409);
  });

  it('the database itself forbids a second voucher for one receipt', async () => {
    const owner = await createUser({ email: 'user@t.co' });
    const user = await agentFor('user@t.co');
    const id = await submitReceipt(user, 'ORD-E');

    await prisma.voucher.create({ data: { code: 'LP-TESTONE', receiptId: id, userId: owner.id, amount: '5.00' } });
    await expect(
      prisma.voucher.create({ data: { code: 'LP-TESTTWO', receiptId: id, userId: owner.id, amount: '5.00' } }),
    ).rejects.toThrow();
  });
});
