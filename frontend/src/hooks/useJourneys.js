import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8000';

export function useJourneys() {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/journeys`);
      if (!res.ok) throw new Error('Failed to fetch journeys');
      const data = await res.json();
      setJourneys(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJourney = useCallback(async (destination, expectedDurationMinutes) => {
    try {
      const res = await fetch(`${API_BASE}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          expected_duration_minutes: expectedDurationMinutes,
        }),
      });
      if (!res.ok) throw new Error('Failed to create journey');
      const data = await res.json();
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const markSafe = useCallback(async (journeyId) => {
    try {
      const res = await fetch(`${API_BASE}/api/journey/${journeyId}/safe`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to mark journey safe');
      const data = await res.json();
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  return { journeys, loading, error, fetchJourneys, createJourney, markSafe };
}
