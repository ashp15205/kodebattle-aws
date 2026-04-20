'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function RewardsPage() {
  const { user, token } = useAuth();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (user) setPoints(user.points || 0);
  }, [user]);

  const REWARDS = [
    { id: 2, title: 'Premium Nametag Glow', cost: 3000, icon: '✨', desc: 'Your name will glow distinctly across all leaderboards and battle verses.' },
    { id: 3, title: 'Extra Quiz Dataset: ML & AI', cost: 5000, icon: '🤖', desc: 'Unlock the extremely difficult Machine Learning quiz repository.' },
    { id: 4, title: 'Discord Nitro (1 Month)', cost: 15000, icon: '👾', desc: 'Secure a real Discord Nitro subscription code (Stock: 12)' },
  ];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: 80 }}>
        <div className="glass-card" style={{ padding: '60px 40px', marginTop: 60, textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: '4.5rem', marginBottom: 20, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }}>🎁</div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-1px' }}>Rewards Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 40, lineHeight: 1.6 }}>Exchange your hard-earned competitive points for exclusive perks, datasets, and platform benefits.</p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(0,113,227,0.1)', padding: '16px 32px', borderRadius: 999 }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent-indigo)' }}>Your Balance:</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{points} pts</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {REWARDS.map(r => (
            <div key={r.id} className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>{r.icon}</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>{r.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 24, flexGrow: 1 }}>{r.desc}</p>

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', background: points >= r.cost ? 'var(--accent-indigo)' : 'var(--bg-card)', color: points >= r.cost ? 'white' : 'var(--text-muted)', border: points < r.cost ? '1px solid var(--border-color)' : 'none' }}
                disabled={points < r.cost}
                onClick={() => alert(`Purchased ${r.title}! (Mock)`)}
              >
                {points >= r.cost ? `Claim for ${r.cost} pts` : `Need ${r.cost} pts`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
