import { useEffect, useState } from 'react';
import { api } from '../api';

interface Voucher {
  id: string;
  code: string;
  amount: string;
  currency: string;
  status: string;
  expiresAt: string | null;
  receipt: { orderId: string } | null;
}
interface List {
  data: Voucher[];
}

export function Vouchers() {
  const [list, setList] = useState<List | null>(null);

  useEffect(() => {
    api.get<List>('/vouchers?limit=50').then(setList).catch(() => undefined);
  }, []);

  return (
    <div>
      <h1>My vouchers</h1>
      {!list ? (
        <p className="muted">Loading…</p>
      ) : list.data.length === 0 ? (
        <div className="panel empty">No vouchers yet. They are issued when your receipts are approved.</div>
      ) : (
        <div className="cards">
          {list.data.map((v) => (
            <div className="card" key={v.id}>
              <div className="row">
                <strong style={{ fontSize: 16 }}>{v.code}</strong>
                <span className="spacer" />
                <span className={`pill ${v.status}`}>{v.status}</span>
              </div>
              <div className="num" style={{ fontSize: 24, marginTop: 6 }}>
                {v.currency} {v.amount}
              </div>
              <div className="lbl">From order {v.receipt?.orderId ?? '—'}</div>
              {v.expiresAt && <div className="lbl">Expires {new Date(v.expiresAt).toLocaleDateString()}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
