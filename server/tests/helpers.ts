import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

export const app = createApp();
type Agent = ReturnType<typeof request.agent>;

const SAMPLE_IMAGE = 'prisma/seed-assets/receipt-1.png';

export async function createUser(opts: {
  email: string;
  role?: 'USER' | 'ADMIN';
  password?: string;
}) {
  const password = opts.password ?? 'Passw0rd!';
  const user = await prisma.user.create({
    data: { email: opts.email, role: opts.role ?? 'USER', passwordHash: await hashPassword(password) },
  });
  return { ...user, password };
}

/** A supertest agent that persists the session cookie for a logged-in user. */
export async function agentFor(email: string, password = 'Passw0rd!'): Promise<Agent> {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ identifier: email, password });
  return agent;
}

export async function submitReceipt(
  agent: Agent,
  orderId = 'ORD-1',
  amount = '50.00',
): Promise<string> {
  const res = await agent
    .post('/api/receipts')
    .field('orderId', orderId)
    .field('purchaseDate', '2026-08-01')
    .field('amount', amount)
    .attach('receipt', SAMPLE_IMAGE);
  return res.body.receipt?.id as string;
}
