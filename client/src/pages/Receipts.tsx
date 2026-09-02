import { useEffect, useState } from 'react';
import { api } from '../api';

interface Receipt {
  id: string;
  orderId: string;
  purchaseDate: string;
  amount: string;
  currency: string;
  status: string;
  fileUrl: string;
  submittedAt: string;
  reviewNote: string | null;
}
interface List {
  data: Receipt[];
}

const fmt = (s: string) => new Date(s).toLocaleDateString();

export function Receipts() {
  const [list, setList] = useState<List | null>(null);

  useEffect(() => {
    api.get<List>('/receipts?limit=50').then(setList).catch(() => undefined);
  }, []);

  return (
    <div>
      <div className="title-row">
        <h1>My receipts</h1>
      </div>
      {!list ? (
        <p className="muted">Loading…</p>
      ) : list.data.length === 0 ? (
        <div className="panel empty">No receipts yet. Upload one to get started.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((r) => (
                <tr key={r.id}>
                  <td>{r.orderId}</td>
                  <td>{fmt(r.purchaseDate)}</td>
                  <td>
                    {r.currency} {r.amount}
                  </td>
                  <td>
                    <span className={`pill ${r.status}`}>{r.status}</span>
                    {r.status === 'REJECTED' && r.reviewNote ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {r.reviewNote}
                      </div>
                    ) : null}
                  </td>
                  <td className="muted">{fmt(r.submittedAt)}</td>
                  <td>
                    <a href={r.fileUrl} target="_blank" rel="noreferrer">
                      view
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
