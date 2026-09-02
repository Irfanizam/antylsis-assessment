import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

interface Summary {
  pendingReceipts: number;
  approvedReceipts: number;
  rejectedReceipts: number;
  vouchersIssued: number;
}

export function AdminDashboard() {
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    api.get<Summary>('/admin/summary').then(setS).catch(() => undefined);
  }, []);

  return (
    <div>
      <h1>Admin dashboard</h1>
      <div className="cards">
        <div className="card">
          <div className="num">{s?.pendingReceipts ?? '—'}</div>
          <div className="lbl">Pending</div>
        </div>
        <div className="card">
          <div className="num">{s?.approvedReceipts ?? '—'}</div>
          <div className="lbl">Approved</div>
        </div>
        <div className="card">
          <div className="num">{s?.rejectedReceipts ?? '—'}</div>
          <div className="lbl">Rejected</div>
        </div>
        <div className="card">
          <div className="num">{s?.vouchersIssued ?? '—'}</div>
          <div className="lbl">Vouchers issued</div>
        </div>
      </div>
      <Link to="/admin/receipts">
        <button>Review receipts →</button>
      </Link>
    </div>
  );
}
