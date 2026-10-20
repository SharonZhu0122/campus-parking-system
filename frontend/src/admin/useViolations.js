import { useCallback, useEffect, useState } from 'react';
import { getGates, getViolations, getViolationSummary, refreshSampleViolations, resolveViolation } from '../api';

const REFRESH_MS = 10000;

// Everything the violations page needs from the server: the list for the
// chosen tab, the totals, the gates, and the actions that change them.
// `paused` stops the automatic refresh while a form or message is open.
export function useViolations({ paused }) {
  const [tab, setTab] = useState('open'); // 'open' or 'resolved'
  const [violations, setViolations] = useState([]);
  const [totals, setTotals] = useState({ total: 0, unresolved: 0, resolved: 0 });
  const [gates, setGates] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    (status = tab, { silent = false } = {}) =>
      Promise.all([getViolations(status), getViolationSummary(), getGates()])
        .then(([list, summary, gateList]) => {
          setViolations(list);
          setTotals(summary);
          setGates(gateList);
          setLastUpdated(new Date());
        })
        .catch((err) => {
          // A failed background refresh keeps what is already on screen.
          if (!silent) setError(err.message);
        })
        .finally(() => setLoading(false)),
    [tab]
  );

  useEffect(() => {
    load(tab);
  }, [load, tab]);

  // Pick up new violations without a reload.
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) load(tab, { silent: true });
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load, tab, paused]);

  // Resolving moves a violation out of the open list. Returns the server's answer.
  async function resolve(id, resolutionType) {
    const updated = await resolveViolation(id, resolutionType);
    setViolations((prev) => prev.filter((v) => v.id !== id));
    setTotals((prev) => ({ ...prev, unresolved: Math.max(prev.unresolved - 1, 0), resolved: prev.resolved + 1 }));
    setError('');
    return updated;
  }

  // Demo helper: swap the open detections for a fresh random batch.
  async function fillWithSamples() {
    setUpdating(true);
    setError('');
    try {
      await refreshSampleViolations();
      await load('open');
      setTab('open');
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  return { tab, setTab, violations, totals, gates, lastUpdated, loading, updating, error, setError, load, resolve, fillWithSamples };
}
