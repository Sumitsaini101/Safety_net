import { useEffect, useRef, useState, useMemo } from 'react';
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

  const filteredJourneys = useMemo(() => {
    return journeys.filter((j) =>
      j.destination.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [journeys, filterQuery]);

  const sosJourneys = useMemo(() => filteredJourneys.filter((j) => j.status === 'sos'), [filteredJourneys]);
  const activeJourneys = useMemo(() => filteredJourneys.filter((j) => j.status === 'active'), [filteredJourneys]);
  const safeJourneys = useMemo(() => filteredJourneys.filter((j) => j.status === 'safe'), [filteredJourneys]);

  const defaultCenter = useMemo(() => [28.6139, 77.2090], []);

  const mapMarkers = useMemo(() => {
    return filteredJourneys.map((j, idx) => {
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
  }, [filteredJourneys, defaultCenter]);

  const activeMapCenter = useMemo(() => {
    return selectedJourney
      ? [
          selectedJourney.latitude || defaultCenter[0],
          selectedJourney.longitude || defaultCenter[1],
        ]
      : defaultCenter;
  }, [selectedJourney, defaultCenter]);

  return (
    <div className="w-full flex-1 flex flex-col gap-8 animate-enter">
      
      {/* ─── Top Header & Search/Refresh Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>Telemetry Fleet Stream Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Safety Monitoring Console
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Aggregated dashboard of all active commutes, risk variables, and emergency SOS alerts.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              aria-label="Search destinations"
              placeholder="Search destination..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="saas-input py-2.5 pl-10 pr-4 text-xs sm:text-sm w-full"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          <button
            onClick={fetchJourneys}
            aria-label="Refresh telemetry data"
            className="bg-white border border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-semibold rounded-lg px-4 py-2.5 text-slate-700 shadow-xs active:scale-95 transition-all flex items-center gap-2 shrink-0"
            title="Refresh Now"
          >
            <svg className={`w-4 h-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ─── FULL-WIDTH TOP STATS ROW ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full" role="region" aria-label="Incident Summary Metrics">
        {/* SOS Card */}
        <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm p-6 sm:p-7 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">🚨 SOS Alerts</span>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1">{sosJourneys.length}</div>
            <span className="text-xs font-medium text-slate-500">Require immediate response</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold border border-rose-200" aria-hidden="true">
            ⚠
          </div>
        </div>

        {/* Active Card */}
        <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm p-6 sm:p-7 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">● In Transit (Active)</span>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1">{activeJourneys.length}</div>
            <span className="text-xs font-medium text-slate-500">GPS timers counting down</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold border border-emerald-200" aria-hidden="true">
            ⏱
          </div>
        </div>

        {/* Safe Card */}
        <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm p-6 sm:p-7 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">✓ Completed Safely</span>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1">{safeJourneys.length}</div>
            <span className="text-xs font-medium text-slate-500">Safe arrival confirmed</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold border border-indigo-200" aria-hidden="true">
            🛡
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE COMMUNITY LIVE MAP WIDGET ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">🗺️</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Community Telemetry Map</h3>
              <p className="text-xs font-medium text-slate-500">
                Click any transit record below to pan and inspect its live GPS location.
              </p>
            </div>
          </div>
          {selectedJourney && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                Focused: {selectedJourney.destination}
              </span>
              <button
                onClick={() => setSelectedJourney(null)}
                aria-label="Reset map focus"
                className="text-xs text-slate-500 hover:text-slate-900 underline"
              >
                Reset Map
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
          onRecenter={() => setSelectedJourney(null)}
        />
      </div>

      {/* ─── EMERGENCY QUICK-DIAL DESK ─── */}
      <EmergencyHub isSos={sosJourneys.length > 0} />

      {loading && journeys.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center flex flex-col items-center justify-center w-full" role="status">
          <span className="spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-500 mt-4">Loading real-time monitoring records...</p>
        </div>
      )}

      {/* ─── FULL-WIDTH EMPTY STATE CARD ─── */}
      {!loading && journeys.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center flex flex-col items-center justify-center w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400" aria-hidden="true">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">No journeys recorded yet</h3>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-md">
            When users start a commute, it will stream here with real-time GPS telemetry and incident risk assessment.
          </p>
        </div>
      )}

      {/* ─── FULL-WIDTH 3-COLUMN RESPONSIVE INCIDENT SECTION ─── */}
      {journeys.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
          
          {/* Column 1: SOS INCIDENTS */}
          <div className="flex flex-col gap-4 w-full" role="region" aria-label="SOS Incidents Column">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" aria-hidden="true" />
                SOS Emergency Incidents ({sosJourneys.length})
              </h2>
            </div>

            {sosJourneys.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center text-xs font-medium text-slate-400 w-full shadow-2xs">
                No active SOS alerts. All clear.
              </div>
            ) : (
              sosJourneys.map((j) => (
                <div
                  key={j.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View SOS Alert for ${j.destination} on map`}
                  onClick={() => setSelectedJourney(j)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedJourney(j); } }}
                  className={`bg-rose-50/80 rounded-2xl border-2 border-rose-300 shadow-sm p-5 flex flex-col gap-2.5 w-full cursor-pointer hover:border-rose-400 hover:shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-rose-500 ${
                    selectedJourney?.id === j.id ? 'ring-2 ring-rose-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                      🚨 SOS ALERT
                    </span>
                    <span className="text-xs font-bold text-rose-700">{timeAgo(j.start_time)}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{j.destination}</h3>
                    <p className="text-xs font-medium text-rose-700 mt-0.5">
                      Target Duration: {j.expected_duration_minutes} min · Click to pan map
                    </p>
                  </div>
                  <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-xs font-bold text-rose-800">
                    <span>⚠ Needs immediate contact</span>
                    <span>ID #{j.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: ACTIVE JOURNEYS */}
          <div className="flex flex-col gap-4 w-full" role="region" aria-label="Active Journeys Column">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                In Transit / Active ({activeJourneys.length})
              </h2>
            </div>

            {activeJourneys.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center text-xs font-medium text-slate-400 w-full shadow-2xs">
                No active journeys in transit right now.
              </div>
            ) : (
              activeJourneys.map((j) => (
                <div
                  key={j.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View active transit for ${j.destination} on map`}
                  onClick={() => setSelectedJourney(j)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedJourney(j); } }}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2 w-full cursor-pointer hover:border-slate-300 hover:shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    selectedJourney?.id === j.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Active
                    </span>
                    <span className="text-xs font-medium text-slate-400">{timeAgo(j.start_time)}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{j.destination}</h3>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mt-1">
                    <span>Target: {j.expected_duration_minutes}m</span>
                    {j.remaining_seconds != null && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {Math.ceil(j.remaining_seconds / 60)} min left
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: COMPLETED SAFELY */}
          <div className="flex flex-col gap-4 w-full" role="region" aria-label="Completed Journeys Column">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Completed Safely ({safeJourneys.length})
              </h2>
            </div>

            {safeJourneys.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center text-xs font-medium text-slate-400 w-full shadow-2xs">
                No completed journeys yet.
              </div>
            ) : (
              safeJourneys.slice(0, 10).map((j) => (
                <div
                  key={j.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View completed journey for ${j.destination} on map`}
                  onClick={() => setSelectedJourney(j)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedJourney(j); } }}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5 opacity-90 hover:opacity-100 w-full cursor-pointer hover:border-slate-300 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    selectedJourney?.id === j.id ? 'ring-2 ring-indigo-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ✓ Safe
                    </span>
                    <span className="text-xs font-medium text-slate-400">{timeAgo(j.start_time)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{j.destination}</h3>
                  <div className="text-xs font-medium text-slate-500">
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
