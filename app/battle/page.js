'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const TOTAL_QUESTIONS = 10;
const BATTLE_TIME = 90; // 1:30 mins
const MATCHMAKING_TIMEOUT = 60;
const VERSUS_TIMEOUT = 10;
const MAX_WARNINGS = 3;

export default function BattlePage() {
  const { user, token, authHeader, refreshProfile } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState('setup'); // setup | matchmaking | versus | battle | waiting_opponent | results
  const [matchId, setMatchId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(new Array(TOTAL_QUESTIONS).fill(null));
  
  const [myScore, setMyScore] = useState(0);
  const [opScore, setOpScore] = useState(0);
  const [warnings, setWarnings] = useState(0);
  
  const [time, setTime] = useState(BATTLE_TIME);
  const [resultData, setResultData] = useState(null);
  
  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const myScoreRef = useRef(0);
  const isForfeited = useRef(false);
  const isOpponentDone = useRef(false);

  useEffect(() => { if (!user && token === null) router.push('/login'); }, [user, token]);

  // Anti-Cheat (Listen to visibility and blur)
  useEffect(() => {
    if (phase !== 'battle') return;

    const handleVisibilityChange = () => { if (document.hidden) triggerWarning(); };
    const handleBlur = () => { triggerWarning(); };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [phase]);

  const triggerWarning = useCallback(() => {
    if (isForfeited.current) return;
    setWarnings(w => {
      const newW = w + 1;
      if (newW >= MAX_WARNINGS) {
        isForfeited.current = true;
        handleForfeit();
      } else {
        alert(`WARNING ${newW}/${MAX_WARNINGS}: Please stay on the page! Leaving again will result in a forfeit.`);
      }
      return newW;
    });
  }, []);

  async function handleForfeit() {
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>null);
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    
    await fetch('/api/battle/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ matchId, isForfeit: true })
    });
    
    alert('Match forfeited due to leaving the page.');
    submitBattle(true);
  }

  // Polling Function
  const startPolling = useCallback((mId, currentPhase) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
         const res = await fetch('/api/battle/sync', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', ...authHeader() },
           body: JSON.stringify({ matchId: mId, myScore: myScoreRef.current })
         });
         const data = await res.json();
         if (data.opponentInfo) setOpponent(data.opponentInfo);
         
         const m = data.match;

         if (m?.status === 'finished') {
             // If opponent forfeited early, we receive finished. Or if backend ends match.
             if (currentPhase === 'matchmaking' || currentPhase === 'versus') {
                 clearInterval(pollRef.current);
                 setPhase('setup');
                 alert('Match cancelled or opponent forfeited.');
                 if (document.fullscreenElement) document.exitFullscreen().catch(()=>null);
                 return;
             }
         }
         
         // Match found transition
         if (currentPhase === 'matchmaking' && m?.status === 'active') {
             clearInterval(pollRef.current);
             startVersus(mId, data);
         }
         
         if (currentPhase === 'battle' || currentPhase === 'waiting_opponent') {
             const isP1 = m?.player1_id === user?.id;
             setOpScore(isP1 ? (m?.p2_score || 0) : (m?.p1_score || 0));

             // Check if opponent finished via winner_id hack
             const meDoneFlag = isP1 ? 'p1_done' : 'p2_done';
             const opDoneFlag = isP1 ? 'p2_done' : 'p1_done';
             
             if (m?.winner_id === opDoneFlag || m?.winner_id === 'both_done' || m?.status === 'finished') {
                 isOpponentDone.current = true;
             }

             // Auto transition to results if we are waiting and opponent finishes
             if (currentPhase === 'waiting_opponent' && isOpponentDone.current) {
                 clearInterval(pollRef.current);
                 finishEntireMatch();
             }
         }
      } catch { /* Ignore drops */ }
    }, 2500);
  }, [authHeader, user?.id]);

  // 1. Join Queue
  async function joinBattle() {
    // Request Fullscreen immediately on user gesture
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e)=>console.log("FS error:", e));
    }

    setPhase('matchmaking');
    setTime(MATCHMAKING_TIMEOUT);
    
    startCountdown(MATCHMAKING_TIMEOUT, () => {
      clearInterval(pollRef.current);
      setPhase('setup');
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>null);
      alert('Matchmaking timeout. Please try again.');
    });

    try {
      const res = await fetch('/api/battle/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ topic: 'Random' }),
      });
      const data = await res.json();
      setMatchId(data.match.id);
      setQuestions(data.questions || []);

      if (data.match.status === 'active') {
         clearInterval(timerRef.current);
         startVersus(data.match.id, data);
      } else {
         startPolling(data.match.id, 'matchmaking');
      }
    } catch {
      clearInterval(timerRef.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>null);
      setPhase('setup');
      alert('Failed to connect.');
    }
  }

  // 2. Versus Screen
  function startVersus(mId, initialData = null) {
      clearInterval(timerRef.current);
      setPhase('versus');
      setTime(VERSUS_TIMEOUT);
      
      if (initialData?.opponentInfo) setOpponent(initialData.opponentInfo);
      
      startPolling(mId, 'versus');
      
      startCountdown(VERSUS_TIMEOUT, () => {
         startBattle(mId);
      });
  }

  async function cancelVersus() {
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>null);
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
      await fetch('/api/battle/sync', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ matchId, isForfeit: true })
      });
      setPhase('setup');
  }

  // 3. Battle
  function startBattle() {
      setPhase('battle');
      setQIndex(0);
      setMyScore(0);
      setOpScore(0);
      myScoreRef.current = 0;
      isOpponentDone.current = false;
      startPolling(matchId, 'battle');
      
      setTime(BATTLE_TIME);
      startCountdown(BATTLE_TIME, () => {
          submitBattle(false, true); // time ran out, force submit
      });
  }

  function startCountdown(seconds, onFinish) {
      clearInterval(timerRef.current);
      setTime(seconds);
      timerRef.current = setInterval(() => {
          setTime(t => {
             if (t <= 1) {
                 clearInterval(timerRef.current);
                 onFinish(); return 0;
             }
             return t - 1;
          });
      }, 1000);
  }

  function handleOptionSelect(optIdx) {
      const newAnswers = [...answers];
      newAnswers[qIndex] = optIdx;
      setAnswers(newAnswers);
  }

  // 4. Submit logic
  async function submitBattle(isForfeitedMatch = false, timerRanOut = false) {
      clearInterval(timerRef.current);
      
      const ids = questions.map(q => q.id);
      try {
          // Grade quiz immediately to store our final score locally
          const submitRes = await fetch('/api/quiz/submit', {
              method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
              body: JSON.stringify({ questionIds: ids, answers, mode: 'test' }), // mode:test doesn't add points
          });
          const submitData = await submitRes.json();
          const finalScore = isForfeitedMatch ? 0 : submitData.score;
          myScoreRef.current = finalScore;
          setMyScore(finalScore);

          setResultData({
              myScore: finalScore,
              detailedResults: submitData.results,
              forfeited: isForfeitedMatch
          });

          // Mark us as done on the server
          await fetch('/api/battle/ready', {
              method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
              body: JSON.stringify({ matchId, myScore: finalScore })
          });

          if (isForfeitedMatch || timerRanOut || isOpponentDone.current) {
              finishEntireMatch();
          } else {
              setPhase('waiting_opponent');
              startPolling(matchId, 'waiting_opponent');
          }
      } catch (e) {
          alert('Error submitting battle.');
      }
  }

  // 5. Compute Final Results
  async function finishEntireMatch() {
      clearInterval(pollRef.current);
      
      try {
          // Tell server to compute finish and update RDS stats!
          const res = await fetch('/api/battle/finish', {
              method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
              body: JSON.stringify({ matchId, myScore: myScoreRef.current, opponentScore: opScore })
          });
          const fd = await res.json();
          
          setResultData(prev => ({
              ...prev,
              opScore: opScore,
              won: fd.winnerId === user.id
          }));
          
          await refreshProfile(token);
          setPhase('results');
      } catch {
          alert('Error resolving final results.');
          setPhase('setup');
      }
  }

  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(pollRef.current); }, []);

  // ── RENDERING ──────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <>
      <Navbar />
      <div className="container">
        <div className="battle-setup">
          <div className="glass-card" style={{ padding: '60px 40px', marginTop: 60 }}>
            <div style={{ fontSize: '4.5rem', marginBottom: 20, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }}>⚔️</div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-1.5px' }}>Ranked Arena</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 40px' }}>Enter the 1v1 matchmaking queue. Face off in a 1.5-minute algorithmic showdown. Full screen required.</p>
            <button className="btn btn-primary btn-lg" onClick={joinBattle} style={{ fontSize: '1.15rem', padding: '18px 54px' }}>
              Find Match
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (phase === 'matchmaking') return (
    <>
      <Navbar />
      <div className="container">
        <div className="matchmaking-screen">
          <span className="spin" style={{ fontSize: '4rem', color: 'var(--accent-indigo)' }}>⚙️</span>
          <h2>Searching for Opponent</h2>
          <p className="matchmaking-status">Estimated wait time: 0:30</p>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>00:{time.toString().padStart(2, '0')}</div>
          <button className="btn btn-secondary" onClick={() => { clearInterval(timerRef.current); clearInterval(pollRef.current); if (document.fullscreenElement) document.exitFullscreen().catch(()=>null); setPhase('setup'); }}>Cancel</button>
        </div>
      </div>
    </>
  );

  if (phase === 'versus') return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
         <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
             <h2 style={{ fontSize: '2.5rem', marginBottom: 40, color: 'var(--accent-red)' }}>Match Found! Starts in {time}s</h2>
             <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
                 
                 <div style={{ textAlign: 'center' }}>
                     <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
                        {user.username[0].toUpperCase()}
                     </div>
                     <h3 style={{ fontSize: '1.8rem' }}>{user.username}</h3>
                     <div style={{ color: 'var(--accent-aws)' }}>{user.rank || 'Bronze'}</div>
                 </div>

                 <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-muted)' }}>VS</div>

                 <div style={{ textAlign: 'center' }}>
                     <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--accent-red)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
                        {opponent ? opponent.username[0].toUpperCase() : '?'}
                     </div>
                     <h3 style={{ fontSize: '1.8rem' }}>{opponent ? opponent.username : 'Anonymous'}</h3>
                     <div style={{ color: 'var(--accent-red)' }}>{opponent ? opponent.rank : 'Loading...'}</div>
                 </div>

             </div>
             <button className="btn btn-danger btn-lg" style={{ marginTop: 60 }} onClick={cancelVersus}>Forfeit / Cancel Match</button>
         </div>
      </div>
  );

  if (phase === 'waiting_opponent') return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
         <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
             <span className="spin" style={{ fontSize: '4rem', color: 'var(--accent-green)', marginBottom: 20 }}>⚙️</span>
             <h2 style={{ fontSize: '2rem', marginBottom: 10 }}>Answers Submitted!</h2>
             <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: 30 }}>Waiting for opponent to finish... please stay on exactly this screen.</p>
             <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                 <h3>Your Local Score: <span style={{ color: 'var(--accent-green)' }}>{resultData?.myScore}/10</span></h3>
                 <p style={{ color: 'var(--text-muted)' }}>Opponent is still playing. Final match results calculation pending.</p>
             </div>
         </div>
      </div>
  );

  if (phase === 'battle' && questions.length > 0) {
    const q = questions[qIndex];
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    const progress = (qIndex / questions.length) * 100;

    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="container" style={{ padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '1.2rem' }}>You: Ans {answers.filter(a => a !== null).length}/10</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 800, color: time <= 30 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                  {mins}:{secs.toString().padStart(2, '0')}
              </div>
              <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '1.2rem' }}>Opponent Connected 🟢</div>
          </div>
          
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
             <div style={{ flex: 1 }}>
                 <div className="quiz-topic">Question {qIndex + 1} of {TOTAL_QUESTIONS}</div>
                 <div className="glass-card quiz-question" style={{ minHeight: 180 }}>
                    <h2>{q.question}</h2>
                 </div>
                 
                 <div className="quiz-options">
                    {q.options.map((opt, i) => {
                       const isSelected = answers[qIndex] === i;
                       return (
                          <button key={i} className={`quiz-option ${isSelected ? 'selected' : ''}`} onClick={() => handleOptionSelect(i)}>
                             {opt}
                          </button>
                       );
                    })}
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                    <button className="btn btn-secondary" onClick={() => setQIndex(Math.max(0, qIndex - 1))} disabled={qIndex === 0}>← Previous</button>
                    <button className="btn btn-primary" onClick={() => setQIndex(Math.min(TOTAL_QUESTIONS-1, qIndex + 1))} disabled={qIndex === TOTAL_QUESTIONS - 1}>Next →</button>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40 }}>
                     <button className="btn btn-success btn-lg" onClick={() => submitBattle(false, false)}>Submit & End Battle</button>
                 </div>
             </div>
             
             <div style={{ width: 260 }}>
                 <div className="glass-card" style={{ padding: 20 }}>
                     <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Questions</h3>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                         {questions.map((_, i) => {
                            const isAnswered = answers[i] !== null;
                            const isCurrent = qIndex === i;
                            let bg = 'var(--bg-secondary)';
                            if (isCurrent) bg = 'var(--accent-indigo)';
                            else if (isAnswered) bg = 'rgba(16, 185, 129, 0.2)';

                            return (
                                <button key={i} onClick={() => setQIndex(i)} style={{ padding: 12, borderRadius: 6, background: bg, border: isCurrent ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
                                    {i + 1}
                                </button>
                            );
                         })}
                     </div>
                 </div>
                 
                 {warnings > 0 && (
                     <div style={{ marginTop: 20, padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, color: 'var(--accent-red)', fontWeight: 600 }}>
                         ⚠️ Warnings: {warnings} / {MAX_WARNINGS}
                     </div>
                 )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results' && resultData) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto' }}>
          <div className="glass-card results-card" style={{ textAlign: 'center', marginBottom: 32 }}>
            {resultData.forfeited && <div style={{ color: 'var(--accent-red)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 10 }}>FORFEITED</div>}
            <div className="results-icon">{resultData.won ? '🏆' : '💀'}</div>
            <div className="results-title">{resultData.won ? 'Victory!' : 'Defeated'}</div>
            <p className="results-subtitle">Rating changed. Check your new profile standing.</p>
            <div className="results-stats">
              <div className="results-stat">
                <div className="results-stat-value" style={{ color: 'var(--accent-green)' }}>{resultData.myScore}</div>
                <div className="results-stat-label">Your Correct Apps</div>
              </div>
              <div className="results-stat">
                <div className="results-stat-value" style={{ color: 'var(--accent-red)' }}>{resultData.opScore}</div>
                <div className="results-stat-label">Opponent</div>
              </div>
              <div className="results-stat">
                <div className="results-stat-value" style={{ color: 'var(--accent-indigo)' }}>{user?.rank}</div>
                <div className="results-stat-label">New Rank</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(()=>null); setPhase('setup'); }}>Play Again</button>
              <button className="btn btn-secondary" onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(()=>null); router.push('/dashboard'); }}>Return to Dashboard</button>
            </div>
          </div>

          <h3 style={{ marginBottom: 20 }}>Match Analysis</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questions.map((q, i) => {
              const res = resultData.detailedResults[i];
              const isCorrect = res?.correct;
              const myAns = answers[i] !== null && answers[i] !== undefined ? q.options[answers[i]] : 'Skipped';
              
              return (
                <div key={q.id} className="glass-card" style={{ padding: 20, borderLeft: `4px solid ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
                   <div style={{ fontWeight: 600, marginBottom: 8 }}>Q{i+1}. {q.question}</div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                     <div><strong>Your Answer:</strong> <span style={{ color: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}>{myAns}</span></div>
                     {!isCorrect && <div><strong>Correct Answer:</strong> {res && res.correctAnswer !== -1 ? q.options[res.correctAnswer] : 'Unknown'}</div>}
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
