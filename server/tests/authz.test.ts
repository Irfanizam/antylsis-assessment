import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, createUser, agentFor, submitReceipt } from './helpers';

describe('authentication and authorization', () => {
  it('rejects unauthenticated access', async () => {
    await request(app).get('/api/me').expect(401);
    await request(app).get('/api/receipts').expect(401);
  });

  it('forbids non-admins from admin routes', async () => {
    await createUser({ email: 'user@t.co' });
    const user = await agentFor('user@t.co');
    await user.get('/api/admin/summary').expect(403);
  });

  it("returns 404 (not 403) for another user's receipt and file", async () => {
    await createUser({ email: 'a@t.co' });
    await createUser({ email: 'b@t.co' });
    const a = await agentFor('a@t.co');
    const b = await agentFor('b@t.co');
    const id = await submitReceipt(a, 'ORD-A');

    await b.get(`/api/receipts/${id}`).expect(404);
    await b.get(`/api/receipts/${id}/file`).expect(404);
  });

  it('scopes the receipt list to the owner', async () => {
    await createUser({ email: 'a@t.co' });
    await createUser({ email: 'b@t.co' });
    const a = await agentFor('a@t.co');
    const b = await agentFor('b@t.co');
    await submitReceipt(a, 'ORD-A1');
    await submitReceipt(a, 'ORD-A2');

    const res = await b.get('/api/receipts');
    expect(res.body.data).toHaveLength(0);
  });

  it('lets an admin read any receipt', async () => {
    await createUser({ email: 'admin@t.co', role: 'ADMIN' });
    await createUser({ email: 'user@t.co' });
    const admin = await agentFor('admin@t.co');
    const user = await agentFor('user@t.co');
    const id = await submitReceipt(user, 'ORD-X');

    await admin.get(`/api/admin/receipts/${id}`).expect(200);
  });
});
