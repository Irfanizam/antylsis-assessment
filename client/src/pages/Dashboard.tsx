import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

interface Summary {
  pendingReceipts: number;
  approvedReceipts: number;
  availableVouchers: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    api.get<Summary>('/me/summary').then(setS).catch(() => undefined);
  }, []);

  return (
    <div>
      <h1>Welcome{user?.fullName ? `, ${user.fullName}` : ''}</h1>
      <p className="muted">Your receipts at a glance.</p>
      <div className="cards">
        <div className="card">
          <div className="num">{s?.pendingReceipts ?? '—'}</div>
          <div className="lbl">Pending receipts</div>
        </div>
        <div className="card">
          <div className="num">{s?.approvedReceipts ?? '—'}</div>
          <div className="lbl">Approved receipts</div>
        </div>
        <div className="card">
          <div className="num">{s?.availableVouchers ?? '—'}</div>
          <div className="lbl">Available vouchers</div>
        </div>
      </div>
    </div>
  );
}
