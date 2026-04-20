'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const RANK_COLORS = { Bronze:'#cd7f32', Silver:'#a0a0a0', Gold:'var(--accent-aws)', Diamond:'var(--accent-sky)', Master:'var(--accent-violet)', Legend:'var(--accent-indigo)' };

export default function ProfilePage() {
  const { user, token, authHeader, refreshProfile } = useAuth();
  const router = useRouter();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user && token === null) { router.push('/login'); return; }
  }, [user, token]);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await fetch('/api/user/avatar', { method: 'POST', headers: authHeader(), body: fd });
      await refreshProfile(token);
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleAvatarDelete() {
    if (!user?.avatar_url) return;
    // Extract key from avatar_url if needed to delete, 
    // Since we don't store key easily accessible here, backend should handle it or we pass a mock key.
    // For simplicity, we just trigger the backend endpoint.
    try {
      await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ key: user.avatar_url }), 
      });
      await refreshProfile(token);
    } catch {
      alert('Delete failed');
    }
  }

  if (!user) return <div className="page-loading"><span className="spin">⚙️</span></div>;

  const rank = user.rank || 'Bronze';
  const winRate = user.matches > 0 ? Math.round((user.wins / user.matches) * 100) : 0;

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: 60 }}>
        {/* Header */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '48px', marginTop: 40, marginBottom: 24 }}>
          <div className="profile-avatar" style={{ position: 'relative' }}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt="avatar" />
              : user.username?.[0]?.toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 style={{ marginBottom: 4 }}>{user.username}</h1>
            <p style={{ color: RANK_COLORS[rank] || 'var(--text-secondary)', fontWeight: 700, fontSize: '1.05rem' }}>
              🏅 {rank}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
              {user.email} · Member since {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          {[
            { label: 'Total Points', value: user.points ?? 0, color: 'var(--text-primary)' },
            { label: 'Victories',   value: user.wins ?? 0,   color: 'var(--accent-green)' },
            { label: 'Defeats', value: user.losses ?? 0, color: 'var(--accent-red)' },
            { label: 'Total Matches', value: user.matches ?? 0, color: 'var(--accent-indigo)' },
            { label: 'Win Rate', value: `${winRate}%`, color: 'var(--text-primary)' },
          ].map(s => (
            <div key={s.label} className="glass-card stat-card" style={{ padding: '24px 28px', textAlign: 'center' }}>
              <div className="stat-card-value" style={{ color: s.color, fontSize: '2.2rem', marginBottom: 6 }}>{s.value}</div>
              <div className="stat-card-label" style={{ marginTop: 0 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="glass-card" style={{ padding: '36px', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>Avatar Configuration</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload a custom display picture powered directly by AWS S3.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
             <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
               {uploading ? <span className="loading-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'black' }} /> : '📤'} {uploading ? 'Uploading…' : 'Update Avatar'}
             </button>
             {user.avatar_url && (
               <button className="btn btn-danger" onClick={handleAvatarDelete}>
                 Remove
               </button>
             )}
          </div>
        </div>
      </div>
    </>
  );
}
