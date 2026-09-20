import { useCallback, useEffect, useState } from 'react';
import { getGates, getPredictions } from './api';

const METHOD_LABELS = {
  moving_average: 'Moving average',
  linear_regression: 'Linear regression',
};

function occupancyLevel(percent) {
  if (percent >= 90) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function PredictionsPage({ onBack }) {
  const [gates, setGates] = useState([]);
  const [selectedGateId, setSelectedGateId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    getGates()
      .then((list) => {
        setGates(list);
        if (list.length > 0) setSelectedGateId(String(list[0].id));
      })
      .catch((err) => setError(err.message));
  }, []);

  const loadPredictions = useCallback(() => {
    if (!selectedGateId) return;
    setLoading(true);
    getPredictions(selectedGateId)
      .then((result) => {
        setData(result);
        setLastUpdated(new Date());
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedGateId]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const currentPoint = data ? data.series[data.series.length - 1] : null;
  const currentLevel = currentPoint ? occupancyLevel(currentPoint.occupancyPercent) : 'low';

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="brand-mark">University of Waikato &middot; Parking</span>
          <button type="button" className="top-bar-link" onClick={onBack}>
            Back to occupancy
          </button>
        </div>
      </header>

      <main className="page-content admin-content">
        <h1 style={{ textAlign: 'center' }}>Predictions</h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>
          Predicted available spaces for the next hour, based on the last 24 hours of data.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div className="field" style={{ maxWidth: 260 }}>
            <label htmlFor="gate-select">Gate</label>
            <select
              id="gate-select"
              value={selectedGateId}
              onChange={(e) => setSelectedGateId(e.target.value)}
            >
              {gates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="link-button"
            onClick={loadPredictions}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <p className="error" style={{ textAlign: 'center' }}>{error}</p>}

        {data && (
          <>
            <p className="subtitle" style={{ textAlign: 'center', marginTop: -16 }}>
              {lastUpdated ? `Last updated at ${lastUpdated.toLocaleTimeString()}` : ''}
            </p>

            <div className="gate-card" style={{ margin: '0 auto 32px', maxWidth: 320 }}>
              <span className="gate-label">Currently available</span>
              <span className={`occupancy-percent level-${currentLevel}`}>
                {currentPoint.available}
              </span>
              <span className="available-label">spaces available</span>
              <div className="occupancy-bar">
                <div
                  className={`occupancy-bar-fill level-${currentLevel}`}
                  style={{ width: `${Math.min(currentPoint.occupancyPercent, 100)}%` }}
                />
              </div>
              <span className="occupancy-detail">out of {data.totalParks} total</span>
            </div>

            <div className="history-chart">
              {data.series.map((point) => (
                <div
                  key={point.time}
                  className="history-bar"
                  title={`${point.available} spaces available`}
                >
                  <div
                    className="history-bar-fill"
                    style={{ height: `${Math.min(point.occupancyPercent, 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="subtitle" style={{ textAlign: 'center' }}>
              Last 24 hours, oldest to newest (left to right)
            </p>

            <div className="gate-grid">
              <div className="gate-card">
                <span className="gate-label">Moving average predicts</span>
                <span className="occupancy-percent level-low">
                  {Math.round(data.movingAveragePrediction)}
                </span>
                <span className="occupancy-detail">spaces available next hour</span>
              </div>
              <div className="gate-card">
                <span className="gate-label">Linear regression predicts</span>
                <span className="occupancy-percent level-low">
                  {Math.round(data.linearRegressionPrediction)}
                </span>
                <span className="occupancy-detail">spaces available next hour</span>
              </div>
              <div className="gate-card">
                <span className="gate-label">More accurate method</span>
                <span className="occupancy-percent level-low" style={{ fontSize: 24 }}>
                  {data.moreAccurateMethod ? METHOD_LABELS[data.moreAccurateMethod] : 'Not enough data'}
                </span>
                {data.accuracy.testedPoints > 0 && (
                  <span className="occupancy-detail">
                    Avg error: MA {data.accuracy.movingAverageError.toFixed(1)} vs LR{' '}
                    {data.accuracy.linearRegressionError.toFixed(1)} spaces (tested on{' '}
                    {data.accuracy.testedPoints} points)
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default PredictionsPage;
