import { useEffect, useRef } from 'react';
import { useJourneys } from '../hooks/useJourneys';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { journeys, loading, fetchJourneys } = useJourneys();
  const pollRef = useRef(null);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    pollRef.current = setInterval(fetchJourneys, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchJourneys]);

  const sosJourneys = journeys.filter((j) => j.status === 'sos');
  const activeJourneys = journeys.filter((j) => j.status === 'active');
  const safeJourneys = journeys.filter((j) => j.status === 'safe');

  return (
    <div className="page-container">
      <div className="dashboard-header animate-fade-in">
        <h2>Emergency Dashboard</h2>
        <p className="subtitle">Monitoring all journeys in real time.</p>
      </div>

      {loading && journeys.length === 0 && (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="spinner" />
        </div>
      )}

      {!loading && journeys.length === 0 && (
        <div className="card animate-fade-in empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p>No journeys yet. Start one from the Home page.</p>
        </div>
      )}

      {/* SOS Section */}
      {sosJourneys.length > 0 && (
        <section className="animate-fade-in">
          <h3 className="section-title sos-title">
            🚨 SOS Alerts ({sosJourneys.length})
          </h3>
          {sosJourneys.map((j) => (
            <div key={j.id} className="card journey-card sos-card flash">
              <div className="journey-card-top">
                <span className="status-pill sos">SOS</span>
                <span className="journey-time">{timeAgo(j.start_time)}</span>
              </div>
              <h4 className="journey-dest">{j.destination}</h4>
              <p className="journey-meta">Duration: {j.expected_duration_minutes} min</p>
              <div className="sos-banner-sm">
                ⚠ Emergency Contact Needed
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Active Section */}
      {activeJourneys.length > 0 && (
        <section className="animate-fade-in">
          <h3 className="section-title active-title">
            ● Active Journeys ({activeJourneys.length})
          </h3>
          {activeJourneys.map((j) => (
            <div key={j.id} className="card journey-card">
              <div className="journey-card-top">
                <span className="status-pill active">Active</span>
                <span className="journey-time">{timeAgo(j.start_time)}</span>
              </div>
              <h4 className="journey-dest">{j.destination}</h4>
              <p className="journey-meta">
                Duration: {j.expected_duration_minutes} min
                {j.remaining_seconds != null && (
                  <> · <strong>{Math.ceil(j.remaining_seconds / 60)} min left</strong></>
                )}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Safe Section */}
      {safeJourneys.length > 0 && (
        <section className="animate-fade-in">
          <h3 className="section-title safe-title">
            ✓ Completed Safely ({safeJourneys.length})
          </h3>
          {safeJourneys.map((j) => (
            <div key={j.id} className="card journey-card safe-card-item">
              <div className="journey-card-top">
                <span className="status-pill safe">Safe</span>
                <span className="journey-time">{timeAgo(j.start_time)}</span>
              </div>
              <h4 className="journey-dest">{j.destination}</h4>
              <p className="journey-meta">Duration: {j.expected_duration_minutes} min</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
