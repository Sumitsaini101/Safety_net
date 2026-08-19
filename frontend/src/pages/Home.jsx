import { useState, useEffect, useRef } from 'react';
import { useJourneys } from '../hooks/useJourneys';

function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Home() {
  const { createJourney, markSafe, sendNote } = useJourneys();
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('25');
  const [activeJourney, setActiveJourney] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [markedSafe, setMarkedSafe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isAnalyzingNote, setIsAnalyzingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState(null);
  const [distressAlert, setDistressAlert] = useState(null);
  const [loggedNotes, setLoggedNotes] = useState([]);
  const intervalRef = useRef(null);

  // Countdown timer effect
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
      setNoteText('');
      setNoteFeedback(null);
      setDistressAlert(null);
      setLoggedNotes([]);
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

  const handleSendNote = async (e) => {
    if (e) e.preventDefault();
    if (!noteText.trim() || !activeJourney || isAnalyzingNote) return;

    const currentNote = noteText.trim();
    setIsAnalyzingNote(true);
    setNoteFeedback(null);

    try {
      const response = await sendNote(activeJourney.id, currentNote);
      const newEntry = {
        text: currentNote,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        score: response.sentiment_score,
        isDistress: response.is_distress || response.status === 'sos',
      };
      setLoggedNotes((prev) => [newEntry, ...prev]);

      if (response.status === 'sos' || response.is_distress) {
        setActiveJourney((prev) => ({ ...prev, status: 'sos' }));
        setDistressAlert({ score: response.sentiment_score, note: currentNote });
        setNoteFeedback({
          type: 'danger',
          message: `🚨 Distress detected (Score: ${response.sentiment_score}). SOS Triggered!`,
        });
      } else {
        setNoteFeedback({
          type: 'success',
          message: `✓ Note logged (Sentiment: ${response.sentiment_score > 0 ? '+' : ''}${response.sentiment_score.toFixed(2)}) — Normal`,
        });
        setNoteText('');
        setTimeout(() => {
          setNoteFeedback((fb) => (fb?.type === 'success' ? null : fb));
        }, 4500);
      }
    } catch (err) {
      setNoteFeedback({
        type: 'danger',
        message: `Failed to analyze note: ${err.message}`,
      });
    } finally {
      setIsAnalyzingNote(false);
    }
  };

  const handleReset = () => {
    setActiveJourney(null);
    setDestination('');
    setDuration('25');
    setMarkedSafe(false);
    setRemaining(0);
    setNoteText('');
    setNoteFeedback(null);
    setDistressAlert(null);
    setLoggedNotes([]);
  };

  const isExpired = remaining <= 0 && activeJourney && !markedSafe;
  const isSos = (activeJourney && activeJourney.status === 'sos') || isExpired;

  // Calculate circular gauge progress
  const totalSeconds = activeJourney ? activeJourney.expected_duration_minutes * 60 : 1;
  const progress = activeJourney ? Math.max(0, Math.min(1, remaining / totalSeconds)) : 1;
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="w-full flex-1 flex flex-col justify-center transition-all duration-500">
      
      {/* Background Red Ambient Glow if SOS */}
      {isSos && <div className="ambient-light-sos" />}

      {!activeJourney ? (
        /* ═══════════════ STEP 1: START JOURNEY (OPTIMIZED 2-COL DESKTOP) ═══════════════ */
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[75vh] animate-enter">
          
          {/* Left Column: Feature Highlights & Value Prop (Vertically Centered) */}
          <div className="flex flex-col justify-center gap-6 pr-0 lg:pr-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/90 w-fit shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <span>AI-Powered Personal Safety Guard</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Solo Commute with Complete <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">Peace of Mind.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
              SafeJourney watches over your commute. If your countdown timer expires or distress is detected in your transit notes, emergency SOS alerts trigger automatically to protect you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-xl">
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base">
                  ⏱
                </div>
                <span className="text-sm font-bold text-slate-900">Auto-Expiry SOS</span>
                <span className="text-xs text-slate-500 leading-normal">Automatically escalates if safe check-in is missed before the timer runs out.</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-base">
                  🧠
                </div>
                <span className="text-sm font-bold text-slate-900">Local NLP AI Guard</span>
                <span className="text-xs text-slate-500 leading-normal">On-device sentiment intelligence scans quick notes for subtle danger cues.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Start Journey Form (Slightly Wider & Generously Padded) */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="glass-card p-8 sm:p-10 w-full max-w-xl shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-4 mb-7 pb-5 border-b border-slate-100">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Start Safe Journey</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Enter destination and expected transit duration</p>
                </div>
              </div>

              <form onSubmit={handleStart} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="destination" className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Destination
                  </label>
                  <input
                    id="destination"
                    type="text"
                    className="glass-input text-base py-3"
                    placeholder="e.g., Home from Metro / Office to Flat / Night Walk"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="duration" className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Expected Duration (Minutes)
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min="1"
                    max="1440"
                    className="glass-input text-base py-3"
                    placeholder="25"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />

                  {/* Quick Presets */}
                  <div className="grid grid-cols-4 gap-2.5 mt-3">
                    {['15', '25', '45', '60'].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                          duration === mins
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-3 py-3.5 text-base"
                  disabled={isSubmitting || !destination.trim() || !duration}
                >
                  {isSubmitting ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="6 3 20 12 6 21 6 3"/>
                      </svg>
                      <span>Begin Journey Protection</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : markedSafe ? (
        /* ═══════════════ STEP 2: SAFE CONFIRMATION ═══════════════ */
        <div className="w-full max-w-xl mx-auto glass-card p-10 text-center flex flex-col items-center animate-enter my-auto">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 mb-5 shadow-lg shadow-emerald-500/20">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>

          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 mb-3">
            Status: Safely Completed
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">You're Safe! 🎉</h2>
          <p className="text-base text-slate-600 mt-2 max-w-md">
            Journey to <strong className="text-slate-900 font-bold">{activeJourney.destination}</strong> has been marked as safely completed and archived.
          </p>

          <button
            onClick={handleReset}
            className="btn-primary mt-8 max-w-xs py-3.5 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
            <span>Start Another Journey</span>
          </button>
        </div>
      ) : (
        /* ═══════════════ STEP 3: ACTIVE JOURNEY / SOS STATE (FULL-WIDTH 2-COL) ═══════════════ */
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-enter">
          
          {/* Left Column: Massive Timer & Arrival Action (7 cols) */}
          <div className={`lg:col-span-7 ${isSos ? 'glass-card-sos' : 'glass-card'} p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-500 shadow-lg`}>
            
            {/* Status Header */}
            {isSos ? (
              <div className="flex flex-col items-center mb-3">
                <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-red-100 text-red-600 border-2 border-red-300 mb-4 shadow-xl shadow-red-500/25 beacon-pulse">
                  <svg className="w-11 h-11 fill-red-100" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-md shadow-red-600/30 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  EMERGENCY ALERT TRIGGERED
                </div>

                <h2 className="text-2xl font-black text-red-950 mt-1">{activeJourney.destination}</h2>
                <p className="text-sm text-red-700 font-semibold max-w-md mt-1">
                  {distressAlert
                    ? `AI Distress Detected in note: "${distressAlert.note}" (Sentiment Score: ${distressAlert.score})`
                    : 'Safety countdown timer expired without safe check-in!'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center mb-3">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Safety Guard Active
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeJourney.destination}</h2>
                <p className="text-sm text-slate-500 mt-1">Expected duration: {activeJourney.expected_duration_minutes} minutes</p>
              </div>
            )}

            {/* ─── MASSIVE CENTERED TIMER ─── */}
            <div className="relative my-6 flex items-center justify-center">
              <div className={`relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 ${isSos ? 'timer-sos-pulse' : 'timer-pulse-active'}`}>
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 190 190">
                  <circle
                    cx="95"
                    cy="95"
                    r={radius}
                    className="fill-none stroke-slate-100"
                    strokeWidth="11"
                  />
                  <circle
                    cx="95"
                    cy="95"
                    r={radius}
                    className="fill-none transition-all duration-1000 ease-linear"
                    strokeWidth="11"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                      stroke: isSos ? '#ef4444' : '#10b981',
                      filter: isSos ? 'drop-shadow(0 3px 10px rgba(239,68,68,0.5))' : 'drop-shadow(0 3px 10px rgba(16,185,129,0.4))',
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isSos ? 'STATUS' : 'TIME REMAINING'}
                  </span>
                  <div className={`font-mono font-black tracking-tight ${isSos ? 'text-4xl text-red-600' : 'text-6xl text-slate-900'}`}>
                    {isSos ? (isExpired ? 'TIME UP' : 'SOS') : formatTime(remaining)}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-1.5">
                    {Math.ceil(remaining / 60)} min left
                  </span>
                </div>
              </div>
            </div>

            {/* ─── "I AM SAFE" GLOWING GREEN BUTTON ─── */}
            <div className="w-full max-w-md mt-2 flex flex-col gap-3">
              <button
                onClick={handleSafe}
                disabled={isSubmitting}
                className="btn-safe-glow py-4 text-lg"
              >
                {isSubmitting ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>I am Safe & Arrived</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2 transition-colors"
              >
                Cancel & End Journey
              </button>
            </div>
          </div>

          {/* Right Column: NLP Quick Note & Timeline (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Quick Note Card */}
            <div className="glass-card p-6 sm:p-7">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <h3 className="text-sm font-extrabold text-slate-900">Quick Note / Check-in</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200">
                  NLP AI Guard
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Log quick updates during your transit. The AI automatically analyzes every note for distress cues.
              </p>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  className="glass-input py-2.5 text-xs flex-1"
                  placeholder="e.g., Boarded the bus / Walking down 5th Ave"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  disabled={isAnalyzingNote || isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendNote();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendNote}
                  disabled={isAnalyzingNote || !noteText.trim() || isSubmitting}
                  className="btn-primary py-2.5 px-4 text-xs font-bold w-auto"
                >
                  {isAnalyzingNote ? <span className="spinner-sm" /> : <span>Log Note</span>}
                </button>
              </div>

              {/* Status Toast */}
              {isAnalyzingNote && (
                <div className="mt-3 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-2 animate-enter">
                  <span className="spinner-dark" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  <span>Evaluating sentiment & intent...</span>
                </div>
              )}

              {noteFeedback && !isAnalyzingNote && (
                <div
                  className={`mt-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-enter ${
                    noteFeedback.type === 'danger'
                      ? 'bg-red-50 border border-red-300 text-red-700'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  }`}
                >
                  <span>{noteFeedback.type === 'danger' ? '🚨' : '✓'}</span>
                  <span>{noteFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Recent Notes Log */}
            {loggedNotes.length > 0 && (
              <div className="glass-card p-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                  Journey Note History ({loggedNotes.length})
                </h4>
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {loggedNotes.map((n, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                        n.isDistress
                          ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                          : 'bg-slate-50 border-slate-200/80 text-slate-800'
                      }`}
                    >
                      <span className="truncate max-w-[200px] sm:max-w-xs">{n.text}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${n.isDistress ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                          {n.score > 0 ? `+${n.score.toFixed(2)}` : n.score.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Safety Tips Card */}
            <div className="p-5 rounded-2xl bg-white/70 border border-slate-200/80 text-xs text-slate-600 flex flex-col gap-2 shadow-xs">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <span>🛡️</span> Safety Check Protocol
              </span>
              <p>Keep your phone in an easily accessible pocket. If you feel unsafe, click "Log Note" or contact local emergency services immediately.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
