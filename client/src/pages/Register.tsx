import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import type { ApiError } from '../api';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await register({
        fullName: fullName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        password,
      });
      navigate(user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError((err as ApiError).message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create account</h1>
        <p className="muted">Register with an email or a phone number.</p>
        {error && <div className="msg error">{error}</div>}
        <label>Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60…" />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ marginTop: 16 }}>
          <button disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 14 }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
