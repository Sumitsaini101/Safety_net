import { useEffect, useRef, useState } from 'react';
import { useJourneys } from '../hooks/useJourneys';

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

  return (
    <div className="w-full flex-1 flex flex-col gap-6 animate-enter">
      
      {/* Top Header & Search/Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time Guardian Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Safety Monitoring Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Live overview of all active commutes, safety check-ins, and emergency SOS alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search destination..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="glass-input py-2 pl-9 pr-3 text-xs w-full"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          <button
            onClick={fetchJourneys}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-xs transition-all duration-200 flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Refresh Now"
          >
            <svg className={`w-4 h-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── KPI METRIC SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* SOS Card */}
        <div className="glass-card p-5 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">🚨 SOS Alerts</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{sosJourneys.length}</div>
            <span className="text-[11px] text-slate-500">Require immediate attention</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
            ⚠
          </div>
        </div>

        {/* Active Card */}
        <div className="glass-card p-5 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">● In Transit (Active)</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{activeJourneys.length}</div>
            <span className="text-[11px] text-slate-500">Timers actively counting down</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            ⏱
          </div>
        </div>

        {/* Safe Card */}
        <div className="glass-card p-5 border-l-4 border-l-indigo-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">✓ Completed Safely</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{safeJourneys.length}</div>
            <span className="text-[11px] text-slate-500">Safe arrival confirmed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            🛡
          </div>
        </div>
      </div>

      {loading && journeys.length === 0 && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <span className="spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <p className="text-xs text-slate-500 mt-3 font-semibold">Loading real-time monitoring records...</p>
        </div>
      )}

      {!loading && journeys.length === 0 && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">No journeys recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            When journeys are created, they will automatically appear here with real-time status and telemetry.
          </p>
        </div>
      )}

      {/* ─── 3-COLUMN RESPONSIVE SECTION ON LAPTOP ─── */}
      {journeys.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: SOS INCIDENTS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-red-600 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                SOS Emergency ({sosJourneys.length})
              </h2>
            </div>

            {sosJourneys.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/60 border border-slate-200 text-center text-xs text-slate-400">
                No active SOS alerts. All clear.
              </div>
            ) : (
              sosJourneys.map((j) => (
                <div key={j.id} className="glass-card-sos p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                      🚨 SOS ALERT
                    </span>
                    <span className="text-xs text-red-700 font-semibold">{timeAgo(j.start_time)}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-red-950">{j.destination}</h3>
                    <p className="text-xs text-red-700 font-medium mt-0.5">
                      Expected Duration: {j.expected_duration_minutes} min
                    </p>
                  </div>
                  <div className="pt-2 border-t border-red-200 flex items-center justify-between text-[11px] font-bold text-red-800">
                    <span>⚠ Needs immediate contact</span>
                    <span>ID #{j.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: ACTIVE JOURNEYS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                In Transit / Active ({activeJourneys.length})
              </h2>
            </div>

            {activeJourneys.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/60 border border-slate-200 text-center text-xs text-slate-400">
                No active journeys right now.
              </div>
            ) : (
              activeJourneys.map((j) => (
                <div key={j.id} className="glass-card p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Active
                    </span>
                    <span className="text-xs text-slate-400">{timeAgo(j.start_time)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{j.destination}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Target: {j.expected_duration_minutes}m</span>
                    {j.remaining_seconds != null && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        {Math.ceil(j.remaining_seconds / 60)} min left
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: COMPLETED SAFELY */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Completed Safely ({safeJourneys.length})
              </h2>
            </div>

            {safeJourneys.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/60 border border-slate-200 text-center text-xs text-slate-400">
                No completed journeys yet.
              </div>
            ) : (
              safeJourneys.slice(0, 10).map((j) => (
                <div key={j.id} className="glass-card p-3.5 flex flex-col gap-1.5 opacity-90 hover:opacity-100">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ✓ Safe
                    </span>
                    <span className="text-xs text-slate-400">{timeAgo(j.start_time)}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800">{j.destination}</h3>
                  <div className="text-[11px] text-slate-400">
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
