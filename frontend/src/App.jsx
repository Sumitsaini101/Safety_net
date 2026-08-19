import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import './index.css';

function AppContent() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-dark-mesh text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="ambient-dark-glow" />

      {/* ─── Top Full-Width Dark Glassmorphic Navbar ─── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-lg shadow-black/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between w-full">
          
          {/* Brand Logo (Far Left) */}
          <NavLink to="/" className="flex items-center gap-3.5 text-decoration-none group shrink-0">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950/40 rounded-[14px] flex items-center justify-center backdrop-blur-xs">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SafeJourney
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-400 -mt-0.5">
                Live Telemetry & AI Guard
              </span>
            </div>
          </NavLink>

          {/* Right Navigation Links (Spacious gap, no overlap) */}
          <nav className="flex items-center gap-4 sm:gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Check-in & Map</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1"/>
                <rect width="7" height="5" x="14" y="3" rx="1"/>
                <rect width="7" height="9" x="14" y="12" rx="1"/>
                <rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
              <span>Live Monitor Hub</span>
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ─── Main Content Viewport ─── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col justify-start relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      {/* ─── Footer ─── */}
      <footer className="w-full border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SafeJourney Live Telemetry & Emergency Assistance Active</span>
          </div>
          <span>GPS Geolocation · Local NLP Distress AI · Fail-Safe Timer</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
