import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ApiError } from '../api';

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_BYTES = 5 * 1024 * 1024;

export function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [orderId, setOrderId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!file) return setError('Please choose a receipt file');
    if (file.size > MAX_BYTES) return setError('File exceeds the 5 MB limit');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      fd.append('orderId', orderId);
      fd.append('purchaseDate', purchaseDate);
      fd.append('amount', amount);
      await api.post('/receipts', fd);
      navigate('/receipts');
    } catch (err) {
      setError((err as ApiError).message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Upload receipt</h1>
      <div className="panel" style={{ maxWidth: 520 }}>
        {error && <div className="msg error">{error}</div>}
        <form onSubmit={submit}>
          <label>Receipt file (JPEG, PNG, WebP or PDF — max 5 MB)</label>
          <input type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <label>Order number</label>
          <p className="hint">The order or reference number printed on your receipt — it lets us reward each purchase only once.</p>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. the number printed on your receipt"
          />
          <label>Purchase date</label>
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          <label>Amount</label>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <div style={{ marginTop: 16 }}>
            <button disabled={busy}>{busy ? 'Submitting…' : 'Submit receipt'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
