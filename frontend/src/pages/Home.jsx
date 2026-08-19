import { useState, useEffect, useRef, useCallback } from 'react';
import { useJourneys } from '../hooks/useJourneys';

function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Home() {
  const { createJourney, markSafe } = useJourneys();
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [activeJourney, setActiveJourney] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [markedSafe, setMarkedSafe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (!activeJourney || markedSafe) return;

    const tick = () => {
      const start = new Date(activeJourney.start_time).getTime();
      const end = start + activeJourney.expected_duration_minutes * 60 * 1000;
      const now = Date.now();
      const left = Math.max(0, Math.floor((end - now) / 1000));
      setRemaining(left);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeJourney, markedSafe]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!destination.trim() || !duration) return;
    setIsSubmitting(true);
    try {
      const journey = await createJourney(destination.trim(), parseInt(duration, 10));
      setActiveJourney(journey);
      setRemaining(journey.expected_duration_minutes * 60);
      setMarkedSafe(false);
    } catch {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSafe = async () => {
    if (!activeJourney) return;
    setIsSubmitting(true);
    try {
      await markSafe(activeJourney.id);
      setMarkedSafe(true);
      clearInterval(intervalRef.current);
    } catch {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setActiveJourney(null);
    setDestination('');
    setDuration('');
    setMarkedSafe(false);
    setRemaining(0);
  };

  const isExpired = remaining <= 0 && activeJourney && !markedSafe;

  // Calculate progress for ring animation
  const totalSeconds = activeJourney ? activeJourney.expected_duration_minutes * 60 : 1;
  const progress = activeJourney ? remaining / totalSeconds : 1;

  return (
    <div className="page-container">
      {!activeJourney ? (
        /* ——— Journey Start Form ——— */
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="icon-shield">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2>Start a New Journey</h2>
            <p className="subtitle">Stay safe — let us watch over you.</p>
          </div>

          <form onSubmit={handleStart} className="form">
            <div className="field">
              <label htmlFor="destination">Destination</label>
              <input
                id="destination"
                type="text"
                placeholder="e.g. Home from office"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="duration">Expected Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                placeholder="e.g. 30"
                min="1"
                max="1440"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-start"
              disabled={isSubmitting || !destination.trim() || !duration}
            >
              {isSubmitting ? (
                <span className="spinner" />
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Start Journey
                </>
              )}
            </button>
          </form>
        </div>
      ) : markedSafe ? (
        /* ——— Safe Confirmation ——— */
        <div className="card animate-fade-in safe-card">
          <div className="safe-check">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2>You're Safe! 🎉</h2>
          <p className="subtitle">Journey to <strong>{activeJourney.destination}</strong> marked as safe.</p>
          <button className="btn btn-start" onClick={handleReset} style={{ marginTop: '1.5rem' }}>
            New Journey
          </button>
        </div>
      ) : (
        /* ——— Active Journey View ——— */
        <div className="card animate-fade-in">
          <div className="journey-active-header">
            <span className={`status-pill ${isExpired ? 'sos' : 'active'}`}>
              {isExpired ? '⚠ EXPIRED' : '● ACTIVE'}
            </span>
            <h2>{activeJourney.destination}</h2>
          </div>

          {/* Timer ring */}
          <div className="timer-ring-wrapper">
            <svg className="timer-ring" viewBox="0 0 120 120">
              <circle className="timer-ring-bg" cx="60" cy="60" r="52" />
              <circle
                className="timer-ring-progress"
                cx="60" cy="60" r="52"
                style={{
                  strokeDasharray: `${2 * Math.PI * 52}`,
                  strokeDashoffset: `${2 * Math.PI * 52 * (1 - progress)}`,
                  stroke: isExpired ? 'var(--red)' : 'var(--emerald)',
                }}
              />
            </svg>
            <div className={`timer-display ${isExpired ? 'expired' : ''}`}>
              {isExpired ? 'TIME UP' : formatTime(remaining)}
            </div>
          </div>

          {isExpired && (
            <div className="sos-banner flash">
              🚨 SOS — Emergency Contact Needed
            </div>
          )}

          <button
            className="btn btn-safe"
            onClick={handleSafe}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner" />
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                I am Safe
              </>
            )}
          </button>

          <button className="btn-link" onClick={handleReset}>Cancel Journey</button>
        </div>
      )}
    </div>
  );
}
