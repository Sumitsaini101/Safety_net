import { useState, useEffect, useRef } from 'react';
import { useJourneys } from '../hooks/useJourneys';
import LiveMap from '../components/LiveMap';
import EmergencyHub from '../components/EmergencyHub';

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
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, locating, acquired, error
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
    setLocationStatus('locating');

    // Attempt to capture browser geolocation
    const getCoordinates = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ lat: 28.6139, lng: 77.2090 });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(coords);
            setLocationStatus('acquired');
            resolve(coords);
          },
          () => {
            // Fallback coordinate on permission denial / timeout
            const fallback = { lat: 28.6139, lng: 77.2090 };
            setUserLocation(fallback);
            setLocationStatus('error');
            resolve(fallback);
          },
          { timeout: 5000, enableHighAccuracy: true }
        );
      });

    try {
      const coords = await getCoordinates();
      const journey = await createJourney(
        destination.trim(),
        parseInt(duration, 10),
        coords.lat,
        coords.lng
      );
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

  // Map coordinates
  const currentCoords =
    activeJourney?.latitude && activeJourney?.longitude
      ? [activeJourney.latitude, activeJourney.longitude]
      : userLocation
      ? [userLocation.lat, userLocation.lng]
      : [28.6139, 77.2090];

  const mapMarkers = [
    {
      id: activeJourney?.id || 'live-user',
      lat: currentCoords[0],
      lng: currentCoords[1],
      title: activeJourney?.destination || 'Your Current GPS Location',
      status: isSos ? 'sos' : 'active',
      duration: activeJourney?.expected_duration_minutes,
      time: activeJourney ? 'Active Now' : '',
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col justify-center transition-all duration-500">
      
      {/* Background Red Ambient Glow if SOS */}
      {isSos && <div className="ambient-dark-sos" />}

      {!activeJourney ? (
        /* ═══════════════ STEP 1: START JOURNEY (2-COL DESKTOP) ═══════════════ */
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[75vh] animate-enter">
          
          {/* Left Column: Highlights & Telemetry Info */}
          <div className="flex flex-col justify-center gap-6 pr-0 lg:pr-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 w-fit shadow-lg shadow-indigo-500/10">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Real-Time GPS Telemetry & NLP AI Guard</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Solo Commute with <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Live GPS & AI.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              SafeJourney pinpoints your live location, counts down your commute, and analyzes your transit notes for subtle distress signals. If time runs out, emergency contacts are alerted instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/50 shadow-md flex flex-col gap-1">
                <span className="text-xl">📍</span>
                <span className="text-xs font-bold text-slate-200">Live GPS Pin</span>
                <span className="text-[11px] text-slate-400">Captures coordinates & renders interactive map</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/50 shadow-md flex flex-col gap-1">
                <span className="text-xl">⏱</span>
                <span className="text-xs font-bold text-slate-200">Auto SOS</span>
                <span className="text-[11px] text-slate-400">Triggers alert if safe check-in is missed</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/50 shadow-md flex flex-col gap-1">
                <span className="text-xl">🧠</span>
                <span className="text-xs font-bold text-slate-200">NLP AI Guard</span>
                <span className="text-[11px] text-slate-400">Detects fear & distress in quick notes</span>
              </div>
            </div>
          </div>

          {/* Right Column: Start Journey Form */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="glass-card p-8 sm:p-10 w-full max-w-xl shadow-2xl shadow-black/80">
              <div className="flex items-center gap-4 mb-7 pb-5 border-b border-slate-700/50">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Start Safe Journey</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Captures GPS coordinates & arms countdown</p>
                </div>
              </div>

              <form onSubmit={handleStart} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="destination" className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <label htmlFor="duration" className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
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
                    <div className="flex items-center gap-2">
                      <span className="spinner" />
                      <span>Acquiring GPS & Starting...</span>
                    </div>
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
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-5 shadow-2xl shadow-emerald-500/30">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>

          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            Status: Safely Completed
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">You're Safe! 🎉</h2>
          <p className="text-base text-slate-300 mt-2 max-w-md">
            Journey to <strong className="text-white font-bold">{activeJourney.destination}</strong> has been marked as safely completed.
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
        /* ═══════════════ STEP 3: ACTIVE JOURNEY / SOS STATE (FULL-WIDTH 2-COL + MAP) ═══════════════ */
        <div className="w-full flex flex-col gap-6 animate-enter">
          
          {/* Top Priority SOS Banner if in Emergency */}
          {isSos && (
            <div className="w-full">
              <EmergencyHub isSos={true} />
            </div>
          )}

          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Timer & "I am Safe" & Emergency Hub (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className={`${isSos ? 'glass-card-sos' : 'glass-card'} p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-500 shadow-2xl`}>
                
                {/* Status Header */}
                {isSos ? (
                  <div className="flex flex-col items-center mb-3">
                    <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-600/30 border-2 border-rose-500/70 mb-4 shadow-2xl shadow-rose-600/50 beacon-pulse">
                      <svg className="w-11 h-11 text-rose-400 fill-rose-500/20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                      EMERGENCY ALERT TRIGGERED
                    </div>

                    <h2 className="text-2xl font-black text-rose-100 mt-1">{activeJourney.destination}</h2>
                    <p className="text-sm text-rose-300 font-semibold max-w-md mt-1">
                      {distressAlert
                        ? `AI Distress Detected in note: "${distressAlert.note}" (Score: ${distressAlert.score})`
                        : 'Safety countdown timer expired without safe check-in!'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center mb-3">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Safety Guard Active
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">{activeJourney.destination}</h2>
                    <p className="text-sm text-slate-400 mt-1">Expected duration: {activeJourney.expected_duration_minutes} minutes</p>
                  </div>
                )}

                {/* ─── MASSIVE CENTERED TIMER ─── */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className={`relative flex items-center justify-center w-60 h-60 sm:w-72 sm:h-72 ${isSos ? 'timer-sos-pulse' : 'timer-pulse-active'}`}>
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 190 190">
                      <circle
                        cx="95"
                        cy="95"
                        r={radius}
                        className="fill-none stroke-slate-800"
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
                          stroke: isSos ? '#f43f5e' : '#10b981',
                          filter: isSos ? 'drop-shadow(0 0 12px rgba(244,63,94,0.8))' : 'drop-shadow(0 0 12px rgba(16,185,129,0.7))',
                        }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {isSos ? 'STATUS' : 'TIME REMAINING'}
                      </span>
                      <div className={`font-mono font-black tracking-tight ${isSos ? 'text-4xl text-rose-400' : 'text-6xl text-white'}`}>
                        {isSos ? (isExpired ? 'TIME UP' : 'SOS') : formatTime(remaining)}
                      </div>
                      <span className="text-xs font-semibold text-slate-400 mt-1.5">
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
                    className="text-xs font-bold text-slate-400 hover:text-white py-2 transition-colors"
                  >
                    Cancel & End Journey
                  </button>
                </div>
              </div>

              {/* Emergency Quick-Dial Hub (Normal State) */}
              {!isSos && <EmergencyHub isSos={false} />}
            </div>

            {/* Right Column: Live Map Telemetry & NLP Quick Note (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* ─── LIVE GPS MAP WIDGET ─── */}
              <div className="glass-card p-5 flex flex-col gap-3 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🗺️</span>
                    <h3 className="text-sm font-extrabold text-white">Live GPS Map Telemetry</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    OpenStreetMap
                  </span>
                </div>

                {/* Leaflet Map Widget with fixed responsive height */}
                <LiveMap
                  center={currentCoords}
                  zoom={15}
                  markers={mapMarkers}
                  activeMarkerId={activeJourney?.id || 'live-user'}
                  className="h-64 sm:h-80 w-full"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Pin: {currentCoords[0].toFixed(4)}° N, {currentCoords[1].toFixed(4)}° E</span>
                  <span className="text-emerald-400 font-bold">● Active Beacon</span>
                </div>
              </div>

              {/* Quick Note Card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    <h3 className="text-sm font-extrabold text-white">Quick Note / Check-in</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    NLP AI Guard
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Log transit notes. The AI automatically scans for distress or danger signals.
                </p>

                <div className="flex gap-2.5">
                  <input
                    type="text"
                    className="glass-input py-2.5 text-xs flex-1"
                    placeholder="e.g., Boarded bus #12 / Walking towards station"
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
                  <div className="mt-3 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 flex items-center gap-2 animate-enter">
                    <span className="spinner-dark" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span>Evaluating sentiment & intent...</span>
                  </div>
                )}

                {noteFeedback && !isAnalyzingNote && (
                  <div
                    className={`mt-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-enter ${
                      noteFeedback.type === 'danger'
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                        : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                    Journey Note History ({loggedNotes.length})
                  </h4>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {loggedNotes.map((n, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                          n.isDistress
                            ? 'bg-rose-950/50 border-rose-500/50 text-rose-200 font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-200'
                        }`}
                      >
                        <span className="truncate max-w-[180px] sm:max-w-xs">{n.text}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${n.isDistress ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
                            {n.score > 0 ? `+${n.score.toFixed(2)}` : n.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
