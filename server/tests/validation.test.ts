import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, createUser, agentFor } from './helpers';

describe('validation and error handling', () => {
  it('rejects duplicate registration', async () => {
    await request(app).post('/api/auth/register').send({ email: 'dup@t.co', password: 'Passw0rd!' }).expect(201);
    const res = await request(app).post('/api/auth/register').send({ email: 'dup@t.co', password: 'Passw0rd!' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('IDENTIFIER_TAKEN');
  });

  it('returns a generic 401 for a wrong password', async () => {
    await createUser({ email: 'u@t.co', password: 'Rightpass1' });
    const res = await request(app).post('/api/auth/login').send({ identifier: 'u@t.co', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an invalid amount', async () => {
    await createUser({ email: 'u@t.co' });
    const user = await agentFor('u@t.co');
    const res = await user
      .post('/api/receipts')
      .field('orderId', 'ORD-Z')
      .field('purchaseDate', '2026-08-01')
      .field('amount', '-5')
      .attach('receipt', 'prisma/seed-assets/receipt-1.png');
    expect(res.status).toBe(400);
  });

  it('rejects a non-image upload (415)', async () => {
    await createUser({ email: 'u@t.co' });
    const user = await agentFor('u@t.co');
    const res = await user
      .post('/api/receipts')
      .field('orderId', 'ORD-T')
      .field('purchaseDate', '2026-08-01')
      .field('amount', '5.00')
      .attach('receipt', Buffer.from('this is definitely not an image'), 'note.txt');
    expect(res.status).toBe(415);
  });

  it('blocks role escalation on profile update', async () => {
    await createUser({ email: 'u@t.co' });
    const user = await agentFor('u@t.co');
    await user.patch('/api/me').send({ role: 'ADMIN' }).expect(400);
  });
});
