'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) refreshProfile();
  }, [loading, user]);

  if (loading || !user) return <div className="page-loading"><span className="spin">⚙️</span></div>;

  const rank = user.rank || 'Bronze';
  const rankColors = { Bronze:'#cd7f32', Silver:'#a0a0a0', Gold:'var(--accent-aws)', Diamond:'var(--accent-sky)', Master:'var(--accent-violet)', Legend:'var(--accent-indigo)' };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, <span className="gradient-text">{user.username}</span> 👋</h1>
          <p>Ready for your next battle? Rank up by defeating opponents in real-time.</p>
        </div>

        {/* Stats */}
        <div className="dashboard-grid">
          <div className="glass-card stat-card animate-in animate-in-delay-1">
            <div className="stat-card-label">Points</div>
            <div className="stat-card-value gradient-text">{user.points ?? 0}</div>
            <div className="stat-card-sub">+10 per correct answer</div>
          </div>
          <div className="glass-card stat-card animate-in animate-in-delay-2">
            <div className="stat-card-label">Wins</div>
            <div className="stat-card-value" style={{ color: 'var(--accent-green)' }}>{user.wins ?? 0}</div>
            <div className="stat-card-sub">+50 pts per win</div>
          </div>
          <div className="glass-card stat-card animate-in animate-in-delay-3">
            <div className="stat-card-label">Matches</div>
            <div className="stat-card-value" style={{ color: 'var(--accent-sky)' }}>{user.matches ?? 0}</div>
            <div className="stat-card-sub">battles played</div>
          </div>
          <div className="glass-card stat-card animate-in animate-in-delay-4">
            <div className="stat-card-label">Current Rank</div>
            <div className="stat-card-value" style={{ color: rankColors[rank] }}>{rank}</div>
            <div className="stat-card-sub">{user.losses ?? 0} losses</div>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="mode-cards">
          <Link href="/battle" style={{ textDecoration: 'none' }}>
            <div className="glass-card mode-card ranked">
              <div className="mode-card-icon">⚔️</div>
              <h3>Ranked Battle</h3>
              <p>
                Enter real-time 1v1 matchmaking. Beat your opponent in a strict, full-screen battle session to earn 50 points and climb the global leaderboard.
              </p>
              <span className="mode-tag bg-primary" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo)' }}>Competitive</span>
            </div>
          </Link>
          <Link href="/practice" style={{ textDecoration: 'none' }}>
            <div className="glass-card mode-card practice">
              <div className="mode-card-icon">🎯</div>
              <h3>Practice Mode</h3>
              <p>
                Prepare yourself offline. Learn and improve across a barrage of randomized questions with instant feedback.
              </p>
              <span className="mode-tag cloud">Training</span>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
