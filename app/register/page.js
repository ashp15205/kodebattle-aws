'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signUp(form.username, form.email, form.password);
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
        <div className="auth-title">Join <span className="gradient-text">KodeBattle</span></div>
        <p className="auth-subtitle">Create your account — stored securely in AWS RDS</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input id="username" className="form-input" type="text" placeholder="CodingNinja" required
              value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="email" className="form-input" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="password" className="form-input" type="password" placeholder="Min 6 characters" required
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button id="register-btn" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="loading-spinner" /> : null}
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
