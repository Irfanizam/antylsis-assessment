import { useCallback, useEffect, useState } from 'react';
import { api, type ApiError } from '../api';

interface Receipt {
  id: string;
  orderId: string;
  purchaseDate: string;
  amount: string;
  currency: string;
  status: string;
  fileUrl: string;
  submitter: { email: string | null; phone: string | null; fullName: string | null };
}
interface List {
  data: Receipt[];
}

export function AdminReceipts() {
  const [status, setStatus] = useState('PENDING');
  const [list, setList] = useState<List | null>(null);
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    setList(null);
    api.get<List>(`/admin/receipts?status=${status}&limit=50`).then(setList).catch(() => undefined);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    setMsg('');
    setBusyId(id);
    try {
      await api.post(`/admin/receipts/${id}/approve`);
      setMsg('Receipt approved and voucher issued.');
    } catch (e) {
      setMsg((e as ApiError).message);
    } finally {
      setBusyId('');
      load();
    }
  }

  async function reject(id: string) {
    const reason = window.prompt('Reason for rejection (optional):') ?? undefined;
    setMsg('');
    setBusyId(id);
    try {
      await api.post(`/admin/receipts/${id}/reject`, reason ? { reason } : {});
      setMsg('Receipt rejected.');
    } catch (e) {
      setMsg((e as ApiError).message);
    } finally {
      setBusyId('');
      load();
    }
  }

  return (
    <div>
      <div className="title-row">
        <h1>Receipts</h1>
        <span className="spacer" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 160 }}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      {msg && <div className="msg ok">{msg}</div>}
      {!list ? (
        <p className="muted">Loading…</p>
      ) : list.data.length === 0 ? (
        <div className="panel empty">No {status.toLowerCase()} receipts.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Submitter</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>File</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((r) => (
                <tr key={r.id}>
                  <td>{r.orderId}</td>
                  <td>{r.submitter.fullName || r.submitter.email || r.submitter.phone}</td>
                  <td>{new Date(r.purchaseDate).toLocaleDateString()}</td>
                  <td>
                    {r.currency} {r.amount}
                  </td>
                  <td>
                    <span className={`pill ${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    <a href={r.fileUrl} target="_blank" rel="noreferrer">
                      view
                    </a>
                  </td>
                  <td>
                    {r.status === 'PENDING' ? (
                      <div className="row">
                        <button disabled={busyId === r.id} onClick={() => approve(r.id)}>
                          Approve
                        </button>
                        <button className="danger" disabled={busyId === r.id} onClick={() => reject(r.id)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
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
