import { useState, useEffect, useRef, useMemo } from 'react';
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
            resolve(coords);
          },
          () => {
            const fallback = { lat: 28.6139, lng: 77.2090 };
            setUserLocation(fallback);
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

  const handleSendNote = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const currentNote = (textOverride !== null ? textOverride : noteText).trim();
    if (!currentNote || !activeJourney || isAnalyzingNote) return;

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
          message: `Distress detected (Score: ${response.sentiment_score}). SOS Triggered!`,
        });
      } else {
        setNoteFeedback({
          type: 'success',
          message: `Note logged (Sentiment: ${response.sentiment_score > 0 ? '+' : ''}${response.sentiment_score.toFixed(2)}) — Normal`,
        });
        setNoteText('');
        setTimeout(() => {
          setNoteFeedback((fb) => (fb?.type === 'success' ? null : fb));
        }, 4000);
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

  const handleSimulatePeril = () => {
    if (!activeJourney) return;
    handleSendNote(null, 'Emergency! Someone is following me and threatening me.');
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

  // Dynamic Risk Score Computation (0-100)
  const totalSeconds = activeJourney ? activeJourney.expected_duration_minutes * 60 : 1;
  const progressRatio = activeJourney ? Math.max(0, Math.min(1, remaining / totalSeconds)) : 1;
  const timeElapsedRatio = 1 - progressRatio;
  
  let riskScore = isSos ? 92 : Math.min(85, Math.round(15 + timeElapsedRatio * 18 + (loggedNotes.some(n => n.score < 0) ? 14 : 0)));
  if (!activeJourney) riskScore = 21;

  // Circular Gauge Calculations
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - riskScore / 100);

  // Map Coordinates & Memoized Markers (Optimized against timer ticks)
  const currentCoords = useMemo(() => {
    if (activeJourney?.latitude && activeJourney?.longitude) {
      return [activeJourney.latitude, activeJourney.longitude];
    }
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    return [28.6139, 77.2090];
  }, [activeJourney?.latitude, activeJourney?.longitude, userLocation]);

  const mapMarkers = useMemo(() => [
    {
      id: activeJourney?.id || 'live-user',
      lat: currentCoords[0],
      lng: currentCoords[1],
      title: activeJourney?.destination || 'Your Live GPS Coordinates',
      status: isSos ? 'sos' : 'active',
      duration: activeJourney?.expected_duration_minutes,
      time: activeJourney ? 'Active Now' : '',
    },
  ], [activeJourney?.id, activeJourney?.destination, activeJourney?.expected_duration_minutes, currentCoords, isSos]);

  return (
    <div className="w-full flex-1 flex flex-col justify-start gap-8 animate-enter">
      
      {!activeJourney ? (
        /* ═══════════════ STEP 1: START JOURNEY (PREMIUM SAAS HERO & FORM) ═══════════════ */
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[72vh]">
          
          {/* Left Column: Value Prop & Live Metric Cards (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Real-Time Commute Telemetry Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Intelligent Risk Monitoring & <span className="text-indigo-600">Personal Safety Guard.</span>
            </h1>

            <p className="text-sm sm:text-base font-medium text-slate-500 leading-relaxed max-w-xl">
              SafeJourney provides continuous GPS telemetry, automated timeout protection, and real-time VADER NLP distress detection for solo commuters and travelers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1 hover:border-slate-300 transition-colors">
                <span className="text-xl" aria-hidden="true">📍</span>
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">GPS Telemetry</span>
                <span className="text-xs font-medium text-slate-500">Live coordinates captured & pinned to Leaflet maps.</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1 hover:border-slate-300 transition-colors">
                <span className="text-xl" aria-hidden="true">⏱</span>
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">Fail-Safe Timer</span>
                <span className="text-xs font-medium text-slate-500">Auto-escalates to SOS if check-in is missed.</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1 hover:border-slate-300 transition-colors">
                <span className="text-xl" aria-hidden="true">🧠</span>
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">NLP Distress AI</span>
                <span className="text-xs font-medium text-slate-500">Local NLP polarity analysis detects danger signals.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Start Journey Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Initialize Journey</h2>
                  <p className="text-xs font-medium text-slate-500">Set destination and expected transit buffer</p>
                </div>
              </div>

              <form onSubmit={handleStart} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="destination" className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Destination Name
                  </label>
                  <input
                    id="destination"
                    type="text"
                    aria-label="Destination Name"
                    className="saas-input"
                    placeholder="e.g., Office to Apartment / Metro Station"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="duration" className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                    aria-label="Expected Duration in Minutes"
                    className="saas-input"
                    placeholder="25"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-2.5">
                    {['15', '25', '45', '60'].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        aria-label={`Set duration to ${mins} minutes`}
                        onClick={() => setDuration(mins)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          duration === mins
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  aria-label="Begin Journey Protection"
                  className="btn-primary mt-2"
                  disabled={isSubmitting || !destination.trim() || !duration}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="spinner" aria-hidden="true" />
                      <span>Acquiring GPS & Initializing...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center flex flex-col items-center animate-enter my-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm" aria-hidden="true">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            Status: Completed Safely
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">You're Safe! 🎉</h2>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
            Journey to <strong className="text-slate-900 font-bold">{activeJourney.destination}</strong> has been archived and marked safely completed.
          </p>

          <button
            onClick={handleReset}
            aria-label="Start another journey"
            className="btn-primary mt-6 max-w-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
            <span>Start Another Journey</span>
          </button>
        </div>
      ) : (
        /* ═══════════════ STEP 3: HIGH-FIDELITY ACTIVE TELEMETRY DASHBOARD ═══════════════ */
        <div className="w-full flex flex-col gap-8 animate-enter">
          
          {/* ─── SECTION 1: HERO RISK ASSESSMENT & TELEMETRY CARD ─── */}
          <div
            role={isSos ? 'alert' : 'region'}
            aria-live={isSos ? 'assertive' : 'polite'}
            aria-label={isSos ? 'Emergency SOS Alert Container' : 'Active Telemetry Overview'}
            className={`bg-white rounded-2xl border ${isSos ? 'border-rose-300 bg-rose-50/40 shadow-md' : 'border-slate-200 shadow-sm'} p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 w-full`}
          >
            
            {/* Left: Massive Header & Risk Pill */}
            <div className="flex flex-col gap-2.5 max-w-xl text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isSos ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isSos ? 'CRITICAL RISK' : 'LOW RISK'}
                </h1>

                <span className={`text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5 ${isSos ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${isSos ? 'bg-rose-600' : 'bg-emerald-600'}`} aria-hidden="true" />
                  <span>{isSos ? 'SOS Emergency Alert' : 'Normal Transit'}</span>
                </span>
              </div>

              <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                {activeJourney.destination}
              </div>

              <p className="text-sm font-medium text-slate-500 leading-normal">
                {isSos
                  ? (distressAlert ? `Distress detected in transit note: "${distressAlert.note}" (Sentiment: ${distressAlert.score})` : 'Countdown timer expired without safe check-in!')
                  : `Active commute telemetry stream · ${activeJourney.expected_duration_minutes} minutes allocated.`}
              </p>
            </div>

            {/* Center / Right: Custom SVG Circular Progress Risk Gauge */}
            <div className="flex items-center gap-8 shrink-0">
              <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40" aria-label={`Current Risk Score ${riskScore} out of 100`}>
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130" aria-hidden="true">
                  {/* Light Grey Track */}
                  <circle
                    cx="65"
                    cy="65"
                    r={gaugeRadius}
                    className="fill-none stroke-slate-100"
                    strokeWidth="9"
                  />
                  {/* Dynamic Colored Fill Ring */}
                  <circle
                    cx="65"
                    cy="65"
                    r={gaugeRadius}
                    className="fill-none transition-all duration-700 ease-out"
                    strokeWidth="9"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: gaugeCircumference,
                      strokeDashoffset: gaugeOffset,
                      stroke: isSos ? '#f43f5e' : riskScore > 50 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </svg>

                {/* Centered Risk Score Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {riskScore} <span className="text-sm font-bold text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 -mt-0.5">
                    Risk Score
                  </span>
                </div>
              </div>

              {/* Countdown Time Remaining Block */}
              <div className="flex flex-col items-start justify-center border-l border-slate-100 pl-6 hidden sm:flex">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Time Remaining</span>
                <span className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight ${isSos ? 'text-rose-600' : 'text-slate-900'}`}>
                  {isSos ? (isExpired ? '00:00' : 'SOS') : formatTime(remaining)}
                </span>
                <span className="text-xs font-medium text-slate-500 mt-0.5">
                  {Math.ceil(remaining / 60)} min buffer left
                </span>
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: CUSTOM PROGRESS BARS GRID (FACTOR BREAKDOWN) ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Telemetry Factor Breakdown</h3>
                <p className="text-xs font-medium text-slate-500">Real-time risk variables and safety weights</p>
              </div>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                Live Sensor Feed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Factor 1: Route & Transit Progress */}
              <div className="flex flex-col">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Transit Elapsed</span>
                    <span className="text-[11px] font-medium text-slate-400">(35%)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {Math.round(timeElapsedRatio * 35)} / 35 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(timeElapsedRatio * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.round(timeElapsedRatio * 100)}%` }}
                  />
                </div>
              </div>

              {/* Factor 2: NLP AI Sentiment Polarity */}
              <div className="flex flex-col">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">NLP Polarity</span>
                    <span className="text-[11px] font-medium text-slate-400">(30%)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {isSos ? '28' : '4'} / 30 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={isSos ? 93 : 14} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isSos ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: isSos ? '93%' : '14%' }}
                  />
                </div>
              </div>

              {/* Factor 3: GPS Telemetry Fix */}
              <div className="flex flex-col">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">GPS Signal Fix</span>
                    <span className="text-[11px] font-medium text-slate-400">(20%)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    18 / 20 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={90} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: '90%' }}
                  />
                </div>
              </div>

              {/* Factor 4: Check-in Reliability */}
              <div className="flex flex-col">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Check-in Buffer</span>
                    <span className="text-[11px] font-medium text-slate-400">(15%)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {isSos ? '15' : '3'} / 15 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={isSos ? 100 : 20} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isSos ? 'bg-rose-500' : 'bg-teal-500'}`}
                    style={{ width: isSos ? '100%' : '20%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION 3: 2-COLUMN MAP & NLP NOTE LOGS ─── */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Polished Live Map & Emergency Actions (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Live GPS Telemetry Map</h3>
                    <p className="text-xs font-medium text-slate-500">Real-time coordinates and geolocation fix</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" aria-hidden="true" />
                    <span>GPS Connected</span>
                  </span>
                </div>

                {/* Leaflet Map Widget with Action Bar */}
                <LiveMap
                  center={currentCoords}
                  zoom={15}
                  markers={mapMarkers}
                  activeMarkerId={activeJourney?.id || 'live-user'}
                  className="h-64 sm:h-80 w-full"
                  onSimulatePeril={handleSimulatePeril}
                />
              </div>

              {/* Glowing Emerald "I am Safe" Button */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">Arrived at your destination?</h4>
                  <p className="text-xs font-medium text-slate-500">Confirm safety to disarm countdown timer and complete telemetry record.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleSafe}
                    disabled={isSubmitting}
                    aria-label="Confirm safe arrival and complete journey"
                    className="btn-safe-glow whitespace-nowrap px-6 py-3"
                  >
                    {isSubmitting ? (
                      <span className="spinner" aria-hidden="true" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span>I am Safe</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    aria-label="Cancel and end current journey"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Emergency Contacts Hub */}
              <EmergencyHub isSos={isSos} />
            </div>

            {/* Right: Quick Note Input & NLP Timeline History (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Quick Note Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Quick Note / Check-in</h3>
                    <p className="text-xs font-medium text-slate-500">NLP scans for distress cues in real time</p>
                  </div>
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
                    VADER AI
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    aria-label="Quick note check-in input"
                    className="saas-input py-2.5 text-xs flex-1"
                    placeholder="e.g., Boarded bus #12 / Walking through main market"
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
                    aria-label="Log quick note for AI analysis"
                    disabled={isAnalyzingNote || !noteText.trim() || isSubmitting}
                    className="btn-primary py-2.5 px-4 text-xs font-bold w-auto"
                  >
                    {isAnalyzingNote ? <span className="spinner-sm" aria-hidden="true" /> : <span>Log Note</span>}
                  </button>
                </div>

                {/* Status Toast */}
                {isAnalyzingNote && (
                  <div className="mt-3 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-2 animate-enter" role="status" aria-live="polite">
                    <span className="spinner-dark" style={{ width: 14, height: 14, borderWidth: 2 }} aria-hidden="true" />
                    <span>Evaluating sentiment & threat polarity...</span>
                  </div>
                )}

                {noteFeedback && !isAnalyzingNote && (
                  <div
                    role={noteFeedback.type === 'danger' ? 'alert' : 'status'}
                    aria-live="assertive"
                    className={`mt-3 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-enter ${
                      noteFeedback.type === 'danger'
                        ? 'bg-rose-50 border border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span aria-hidden="true">{noteFeedback.type === 'danger' ? '🚨' : '✓'}</span>
                    <span>{noteFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Note History Log */}
              {loggedNotes.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3.5">
                    Transit Note History ({loggedNotes.length})
                  </h4>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {loggedNotes.map((n, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                          n.isDistress
                            ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <span className="truncate max-w-[180px] sm:max-w-xs">{n.text}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500 font-medium">{n.time}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${n.isDistress ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                            {n.score > 0 ? `+${n.score.toFixed(2)}` : n.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Safety Protocol Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600 flex flex-col gap-2">
                <span className="font-extrabold text-slate-900 flex items-center gap-2">
                  <span aria-hidden="true">🛡️</span> Telemetry Safety Protocol
                </span>
                <p className="leading-relaxed">Keep your phone unlocked in your hand or active pocket. In case of distress, click "Simulate Peril" to test or tap any emergency number directly.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
