'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (path) => pathname === path ? 'navbar-link active' : 'navbar-link';

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/dashboard" className="navbar-logo">
          <span className="navbar-logo-icon">⚔️</span>
          KodeBattle
        </Link>

        <div className="navbar-links">
          <Link href="/dashboard"    className={isActive('/dashboard')}>Dashboard</Link>
          <Link href="/battle"       className={isActive('/battle')}>⚔️ Battle</Link>
          <Link href="/practice"     className={isActive('/practice')}>🎯 Practice</Link>
          <Link href="/leaderboard"  className={isActive('/leaderboard')}>🏆 Leaderboard</Link>
          <Link href="/rewards"      className={isActive('/rewards')}>🎁 Rewards</Link>
          <Link href="/profile"      className={isActive('/profile')}>👤 Profile</Link>
        </div>

        <div className="navbar-actions">
          <button className="btn btn-sm btn-secondary" onClick={signOut}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
