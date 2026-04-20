'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function PracticePage() {
  const { user, token, authHeader, refreshProfile } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState('setup'); // setup | quiz | results
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => { if (!user && token === null) router.push('/login'); }, [user, token]);

  async function startPractice() {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/questions?topic=Random&count=10`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setAnswers([]);
      setQIndex(0);
      setSelected(null);
      setAnswered(false);
      setPhase('quiz');
      startTimer();
    } catch {
      alert('Failed to load questions. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function startTimer() {
    setTimeLeft(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleNext(null); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  function handleAnswer(idx) {
    if (answered) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    setAnswered(true);
    setTimeout(() => handleNext(idx), 800);
  }

  function handleNext(ans) {
    const updatedAnswers = [...answers, ans];
    setAnswers(updatedAnswers);

    if (qIndex + 1 >= questions.length) {
      finishQuiz(updatedAnswers);
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
      startTimer();
    }
  }

  async function finishQuiz(finalAnswers) {
    clearInterval(timerRef.current);
    const ids = questions.map(q => q.id);
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ questionIds: ids, answers: finalAnswers, mode: 'practice' }),
      });
      const data = await res.json();
      setResultsData(data);
      await refreshProfile(token);
    } catch { /* ignore */ }
    setLoading(false);
    setPhase('results');
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (phase === 'setup') return (
    <>
      <Navbar />
      <div className="container">
        <div className="battle-setup">
          <div className="glass-card" style={{ padding: '60px 40px', marginTop: 60 }}>
            <div style={{ fontSize: '4rem', marginBottom: 20, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }}>🧠</div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-1px' }}>Guided Practice</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 40, lineHeight: 1.6 }}>10 randomized algorithms & data structure questions.<br/>30 seconds per question to sharpen your logic.</p>
            <button className="btn btn-primary btn-lg" onClick={startPractice} disabled={loading} style={{ padding: '16px 48px', fontSize: '1.1rem' }}>
              {loading ? <span className="loading-spinner" /> : null} Begin Session
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[qIndex];
    const timerClass = timeLeft <= 8 ? 'danger' : timeLeft <= 15 ? 'warning' : '';
    const progress = (qIndex / questions.length) * 100;
    return (
      <>
        <Navbar />
        <div className="quiz-container">
          <div className="quiz-header">
            <span className="quiz-progress">Q {qIndex + 1} / {questions.length}</span>
            <div className={`quiz-timer ${timerClass}`}>⏱ {timeLeft}s</div>
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="quiz-topic">{q.topic} · {q.difficulty}</div>
          <div className="glass-card quiz-question">
            <h2>{q.question}</h2>
          </div>
          <div className="quiz-options">
            {q.options.map((opt, i) => {
               let cls = 'quiz-option';
               if (answered) {
                 if (selected === i) cls += ' selected';
                 else cls += ' disabled';
               } else if (selected === i) cls += ' selected';
               return <button key={i} className={cls} onClick={() => handleAnswer(i)}>{opt}</button>;
            })}
          </div>
        </div>
      </>
    );
  }

  if (phase === 'results' && resultsData) {
    const pct = Math.round((resultsData.score / questions.length) * 100);
    const grade = pct >= 80 ? '🌟 Excellent!' : pct >= 60 ? '👍 Good' : '📚 Keep practicing';
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto' }}>
          <div className="glass-card results-card" style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="results-icon">{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}</div>
            <div className="results-title">{grade}</div>
            <p className="results-subtitle">Practice complete!</p>
            <div className="results-stats">
              <div className="results-stat">
                <div className="results-stat-value" style={{ color: 'var(--accent-green)' }}>{resultsData.score}</div>
                <div className="results-stat-label">Correct</div>
              </div>
              <div className="results-stat">
                <div className="results-stat-value" style={{ color: 'var(--accent-red)' }}>{questions.length - resultsData.score}</div>
                <div className="results-stat-label">Wrong</div>
              </div>
              <div className="results-stat">
                <div className="results-stat-value" style={{ color: 'var(--accent-aws)' }}>{pct}%</div>
                <div className="results-stat-label">Accuracy</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={() => setPhase('setup')}>Practice Again</button>
              <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
            </div>
          </div>

          <h3 style={{ marginBottom: 20 }}>Detailed Analysis</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questions.map((q, i) => {
              const res = resultsData.results[i];
              const isCorrect = res.correct;
              const myAns = answers[i] !== null && answers[i] !== undefined ? q.options[answers[i]] : 'Timeout';
              
              return (
                <div key={q.id} className="glass-card" style={{ padding: 20, borderLeft: `4px solid ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
                   <div style={{ fontWeight: 600, marginBottom: 8 }}>Q{i+1}. {q.question}</div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                     <div><strong>Your Answer:</strong> <span style={{ color: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}>{myAns}</span></div>
                     {!isCorrect && <div><strong>Correct Answer:</strong> {q.options[res.correctAnswer]}</div>}
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return <div className="page-loading"><span className="spin">⚙️</span></div>;
}
