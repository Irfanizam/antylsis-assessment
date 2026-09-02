import { useEffect, useState, type FormEvent } from 'react';
import { api, type ApiError } from '../api';

interface Profile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export function Settings() {
  const [p, setP] = useState<Profile>({ fullName: '', email: '', phone: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ user: Profile }>('/me')
      .then((r) => setP({ fullName: r.user.fullName ?? '', email: r.user.email ?? '', phone: r.user.phone ?? '' }))
      .catch(() => undefined);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setErr('');
    const body: Record<string, string> = {};
    if (p.fullName) body.fullName = p.fullName;
    if (p.email) body.email = p.email;
    if (p.phone) body.phone = p.phone;
    try {
      await api.patch('/me', body);
      setMsg('Profile updated');
    } catch (e2) {
      setErr((e2 as ApiError).message || 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Settings</h1>
      <div className="panel" style={{ maxWidth: 480 }}>
        {msg && <div className="msg ok">{msg}</div>}
        {err && <div className="msg error">{err}</div>}
        <form onSubmit={submit}>
          <label>Full name</label>
          <input value={p.fullName ?? ''} onChange={(e) => setP({ ...p, fullName: e.target.value })} />
          <label>Email</label>
          <input value={p.email ?? ''} onChange={(e) => setP({ ...p, email: e.target.value })} />
          <label>Phone</label>
          <input value={p.phone ?? ''} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          <div style={{ marginTop: 16 }}>
            <button disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
