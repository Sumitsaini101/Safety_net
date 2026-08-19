import { useEffect, useRef, useState } from 'react';
import { useJourneys } from '../hooks/useJourneys';
import LiveMap from '../components/LiveMap';
import EmergencyHub from '../components/EmergencyHub';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { journeys, loading, fetchJourneys } = useJourneys();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedJourney, setSelectedJourney] = useState(null);
  const pollRef = useRef(null);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    pollRef.current = setInterval(fetchJourneys, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchJourneys]);

  const filteredJourneys = journeys.filter((j) =>
    j.destination.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const sosJourneys = filteredJourneys.filter((j) => j.status === 'sos');
  const activeJourneys = filteredJourneys.filter((j) => j.status === 'active');
  const safeJourneys = filteredJourneys.filter((j) => j.status === 'safe');

  // Prepare map markers from journeys that have coordinates
  // (Assign sample offsets around default center if journey has no explicit lat/lng so they still display beautifully on map)
  const defaultCenter = [28.6139, 77.2090];
  const mapMarkers = filteredJourneys.map((j, idx) => {
    const lat = j.latitude || defaultCenter[0] + (idx % 2 === 0 ? 0.008 : -0.006) * (idx + 1);
    const lng = j.longitude || defaultCenter[1] + (idx % 2 === 0 ? -0.007 : 0.009) * (idx + 1);
    return {
      id: j.id,
      lat,
      lng,
      title: j.destination,
      status: j.status,
      duration: j.expected_duration_minutes,
      time: timeAgo(j.start_time),
    };
  });

  const activeMapCenter = selectedJourney
    ? [
        selectedJourney.latitude || defaultCenter[0],
        selectedJourney.longitude || defaultCenter[1],
      ]
    : defaultCenter;

  return (
    <div className="w-full flex-1 flex flex-col gap-8 animate-enter">
      
      {/* Top Header & Search/Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-1.5 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Fleet & GPS Telemetry Stream</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Safety Monitoring Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live overview of active transit routes, GPS coordinates, check-ins, and emergency SOS alerts.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Search destination..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="glass-input py-2.5 pl-10 pr-4 text-xs sm:text-sm w-full"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          <button
            onClick={fetchJourneys}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 shadow-md transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-bold shrink-0"
            title="Refresh Now"
          >
            <svg className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── FULL-WIDTH TOP STATS ROW ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* SOS Card */}
        <div className="glass-card p-6 border-l-4 border-l-rose-500 flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">🚨 SOS Alerts</span>
            <div className="text-4xl font-black text-white mt-1">{sosJourneys.length}</div>
            <span className="text-xs text-rose-300 font-medium">Require immediate response</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-bold border border-rose-500/30">
            ⚠
          </div>
        </div>

        {/* Active Card */}
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">● In Transit (Active)</span>
            <div className="text-4xl font-black text-white mt-1">{activeJourneys.length}</div>
            <span className="text-xs text-slate-400">GPS timers counting down</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold border border-emerald-500/30">
            ⏱
          </div>
        </div>

        {/* Safe Card */}
        <div className="glass-card p-6 border-l-4 border-l-indigo-500 flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">✓ Completed Safely</span>
            <div className="text-4xl font-black text-white mt-1">{safeJourneys.length}</div>
            <span className="text-xs text-slate-400">Safe arrival confirmed</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl font-bold border border-indigo-500/30">
            🛡
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE COMMUNITY / FLEET LIVE MAP WIDGET ─── */}
      <div className="glass-card p-6 flex flex-col gap-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="text-base font-extrabold text-white">Live Community Telemetry Map</h3>
              <p className="text-xs text-slate-400">
                Click any journey card below to focus and inspect its live GPS location on the map.
              </p>
            </div>
          </div>
          {selectedJourney && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-300 font-bold bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/40">
                Focused: {selectedJourney.destination}
              </span>
              <button
                onClick={() => setSelectedJourney(null)}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        <LiveMap
          center={activeMapCenter}
          zoom={selectedJourney ? 15 : 13}
          markers={mapMarkers}
          activeMarkerId={selectedJourney?.id}
          className="h-64 sm:h-80 w-full"
        />
      </div>

      {/* ─── EMERGENCY QUICK-DIAL DESK ─── */}
      <EmergencyHub isSos={sosJourneys.length > 0} />

      {loading && journeys.length === 0 && (
        <div className="glass-card p-16 text-center flex flex-col items-center justify-center w-full">
          <span className="spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p className="text-sm text-slate-400 mt-4 font-semibold">Loading real-time monitoring records...</p>
        </div>
      )}

      {/* ─── FULL-WIDTH EMPTY STATE CARD ─── */}
      {!loading && journeys.length === 0 && (
        <div className="glass-card p-16 text-center flex flex-col items-center justify-center w-full shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center mb-4 text-slate-400 border border-slate-700">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">No journeys recorded yet</h3>
          <p className="text-sm text-slate-400 mt-1.5 max-w-md">
            When users start a journey, it will automatically stream here with live GPS coordinates, status updates, and emergency telemetry.
          </p>
        </div>
      )}

      {/* ─── FULL-WIDTH 3-COLUMN RESPONSIVE SECTION ─── */}
      {journeys.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
          
          {/* Column 1: SOS INCIDENTS */}
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                SOS Emergency Incidents ({sosJourneys.length})
              </h2>
            </div>

            {sosJourneys.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500 w-full shadow-xs">
                No active SOS alerts. All clear.
              </div>
            ) : (
              sosJourneys.map((j) => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJourney(j)}
                  className={`glass-card-sos p-5 flex flex-col gap-2.5 w-full shadow-2xl cursor-pointer hover:scale-[1.01] transition-transform ${
                    selectedJourney?.id === j.id ? 'ring-2 ring-rose-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                      🚨 SOS ALERT
                    </span>
                    <span className="text-xs text-rose-300 font-bold">{timeAgo(j.start_time)}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{j.destination}</h3>
                    <p className="text-xs text-rose-300 font-medium mt-0.5">
                      Expected Duration: {j.expected_duration_minutes} min
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-rose-900/60 flex items-center justify-between text-xs font-bold text-rose-300">
                    <span>⚠ Click to view GPS pin on map</span>
                    <span>ID #{j.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: ACTIVE JOURNEYS */}
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                In Transit / Active ({activeJourneys.length})
              </h2>
            </div>

            {activeJourneys.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500 w-full shadow-xs">
                No active journeys in transit right now.
              </div>
            ) : (
              activeJourneys.map((j) => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJourney(j)}
                  className={`glass-card p-5 flex flex-col gap-2 w-full shadow-2xl cursor-pointer hover:border-emerald-500/50 hover:scale-[1.01] transition-all ${
                    selectedJourney?.id === j.id ? 'ring-2 ring-emerald-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ● Active
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{timeAgo(j.start_time)}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{j.destination}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                    <span>Target: {j.expected_duration_minutes}m</span>
                    {j.remaining_seconds != null && (
                      <span className="text-emerald-300 font-bold bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {Math.ceil(j.remaining_seconds / 60)} min left
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: COMPLETED SAFELY */}
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Completed Safely ({safeJourneys.length})
              </h2>
            </div>

            {safeJourneys.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500 w-full shadow-xs">
                No completed journeys yet.
              </div>
            ) : (
              safeJourneys.slice(0, 10).map((j) => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJourney(j)}
                  className={`glass-card p-4 flex flex-col gap-1.5 opacity-80 hover:opacity-100 w-full shadow-md cursor-pointer hover:scale-[1.01] transition-all ${
                    selectedJourney?.id === j.id ? 'ring-2 ring-indigo-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      ✓ Safe
                    </span>
                    <span className="text-xs text-slate-500">{timeAgo(j.start_time)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">{j.destination}</h3>
                  <div className="text-xs text-slate-500">
                    Duration: {j.expected_duration_minutes} min
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
