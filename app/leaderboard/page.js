'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const RANK_COLORS = { Bronze:'#cd7f32', Silver:'#a0a0a0', Gold:'var(--accent-aws)', Diamond:'var(--accent-sky)', Master:'var(--accent-violet)', Legend:'var(--accent-indigo)' };

export default function LeaderboardPage() {
  const { user, token, authHeader } = useAuth();
  const router = useRouter();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!user && token === null) { router.push('/login'); return; }
    fetchLeaderboard();
  }, [user, token]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard', { headers: authHeader() });
      const data = await res.json();
      setLeaders(data.leaderboard || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch { /* ignore */ }
    setLoading(false);
  }

  const rankIcon = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
  const rankClass = (i) => i === 0 ? 'lb-rank gold' : i === 1 ? 'lb-rank silver' : i === 2 ? 'lb-rank bronze' : 'lb-rank';
  const badgeCls  = (r) => `rank-badge rank-${(r||'Bronze').toLowerCase()}`;

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="lb-header">
          <div>
            <h1>🏆 Global Leaderboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.88rem' }}>
              Live rankings · {lastUpdated && `Updated ${lastUpdated}`}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchLeaderboard}>↻ Refresh</button>
        </div>

        {loading ? (
          <div className="page-loading"><span className="spin">⚙️</span></div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 40 }}>
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Points</th>
                  <th>Wins</th>
                  <th>Matches</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {leaders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No players yet. Be the first to battle!</td></tr>
                ) : leaders.map((u, i) => (
                  <tr key={u.id} style={{ background: u.id === user?.id ? 'rgba(99,102,241,0.05)' : undefined }}>
                    <td><span className={rankClass(i)}>{rankIcon(i)}</span></td>
                    <td>
                      <div className="lb-user">
                        <div className="lb-avatar">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt={u.username} />
                            : u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.username} {u.id === user?.id ? '(you)' : ''}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.losses ?? 0} losses</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: RANK_COLORS[u.rank] || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{u.points ?? 0}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{u.wins ?? 0}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.matches ?? 0}</td>
                    <td><span className={badgeCls(u.rank)}>{u.rank || 'Bronze'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
