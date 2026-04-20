'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn(form.email, form.password);
      router.push('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-title">Welcome back ⚔️</div>
        <p className="auth-subtitle">Sign in to your KodeBattle account</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="login-email" className="form-input" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="form-input" type="password" placeholder="Your password" required
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button id="login-btn" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="loading-spinner" /> : null}
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link href="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
