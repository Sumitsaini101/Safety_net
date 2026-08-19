import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import './index.css';

function AppContent() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* ─── Top SaaS Responsive Header ─── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-xs transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between w-full">
          
          {/* Brand Logo (Far Left) */}
          <NavLink to="/" className="flex items-center gap-3.5 text-decoration-none group shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  SafeJourney
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Telemetry SaaS
                </span>
              </div>
              <span className="block text-xs font-medium text-slate-500 -mt-0.5">
                Real-Time Risk & Distress Guardian
              </span>
            </div>
          </NavLink>

          {/* Right Navigation Links (Spacious gap, no overlap) */}
          <nav className="flex items-center gap-3 sm:gap-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-semibold tracking-tight transition-all duration-150 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Live Telemetry</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-semibold tracking-tight transition-all duration-150 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1"/>
                <rect width="7" height="5" x="14" y="3" rx="1"/>
                <rect width="7" height="9" x="14" y="12" rx="1"/>
                <rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
              <span>Monitoring Console</span>
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ─── Main Content Viewport ─── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>

      {/* ─── Footer ─── */}
      <footer className="w-full border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SafeJourney Real-Time Telemetry & AI Dispatch Active</span>
          </div>
          <span>GPS Coordinates · VADER NLP AI · Fail-Safe Timeout Engine</span>
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
