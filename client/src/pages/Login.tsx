import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import type { ApiError } from '../api';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(identifier, password);
      navigate(user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError((err as ApiError).message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Sign in</h1>
        <p className="muted">Loyalty Program</p>
        {error && <div className="msg error">{error}</div>}
        <label>Email or phone</label>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ marginTop: 16 }}>
          <button disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 14 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
