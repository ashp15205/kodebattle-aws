'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  return (
    <div>
      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-badge">⚔️ The Ultimate Battle Arena</div>
        <h1 className="hero-title">
          <span className="gradient-text">KodeBattle</span>
          <br />Compete. Learn. Win.
        </h1>
        <p className="hero-subtitle">
          Real-time 1v1 DSA quiz battles. Outsmart your opponent, climb the leaderboard, and prove your algorithmic mastery.
        </p>
        <div className="hero-buttons">
          <Link href="/register" className="btn btn-primary btn-lg">Get Started →</Link>
          <Link href="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </section>

      {/* Features */}
      <section className="container">
        <div className="features-grid">
          <div className="glass-card feature-card animate-in animate-in-delay-1">
            <div className="feature-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>⚔️</div>
            <h3>1v1 Ranked Battles</h3>
            <p>Real-time matchmaking in a highly competitive arena. Compete head-to-head on DSA topics. Winner earns points, ranks are updated instantly.</p>
          </div>
          <div className="glass-card feature-card animate-in animate-in-delay-2">
            <div className="feature-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>🛡️</div>
            <h3>Anti-Cheat System</h3>
            <p>Strict full-screen enforcement. Switch tabs or minimize? You receive a warning. Three warnings mean an automatic forfeit.</p>
          </div>
          <div className="glass-card feature-card animate-in animate-in-delay-3">
            <div className="feature-icon" style={{ background: 'rgba(14,165,233,0.15)' }}>🏆</div>
            <h3>Global Leaderboard</h3>
            <p>Live rankings and ELO system. Earn points per correct answer, climb from Bronze to Legend across all players worldwide.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
