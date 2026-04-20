'use client';
import { useState } from 'react';

export default function Footer() {
  const [open, setOpen] = useState(false);

  const UPCOMING = [
    { title: 'Global Tournament Cups', desc: 'Participate in weekly 64-player elimination brackets for massive point payouts.' },
    { title: 'Team 2v2 Arenas', desc: 'Queue up with a friend to tackle algorithmic challenges in cooperative coding environments.' },
    { title: 'Code Editor Integration', desc: 'Type physical code solutions instead of multiple choice, with automated unit testing evaluation.' },
    { title: 'Topic-wise/ Subject-wise Battles', desc: 'Battle on topics/subjects of your choice.' },
  ];

  return (
    <>
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '30px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>
          © 2026 KodeBattle Cloud Platform. Hosted securely on AWS Infrastructure.
        </p>
        <button className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setOpen(true)}>
          🚀 Coming Soon
        </button>
      </footer>

      {open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 40, animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🚀 Product Roadmap</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setOpen(false)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {UPCOMING.map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4, letterSpacing: '-0.5px' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
