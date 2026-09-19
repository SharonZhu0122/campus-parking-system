import { useEffect, useState } from 'react';
import { getGates, getPredictions } from './api';

const METHOD_LABELS = {
  moving_average: 'Moving average',
  linear_regression: 'Linear regression',
};

function PredictionsPage({ onBack }) {
  const [gates, setGates] = useState([]);
  const [selectedGateId, setSelectedGateId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGates()
      .then((list) => {
        setGates(list);
        if (list.length > 0) setSelectedGateId(String(list[0].id));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedGateId) return;
    setLoading(true);
    getPredictions(selectedGateId)
      .then((result) => {
        setData(result);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedGateId]);

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
          Predicted occupancy for the next hour, using the last 24 hours of data.
        </p>

        <div className="field" style={{ maxWidth: 260, margin: '0 auto 32px' }}>
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

        {error && <p className="error" style={{ textAlign: 'center' }}>{error}</p>}
        {loading && <p className="subtitle" style={{ textAlign: 'center' }}>Loading...</p>}

        {!loading && data && (
          <>
            <div className="history-chart">
              {data.series.map((point) => (
                <div key={point.time} className="history-bar" title={`${point.occupancyPercent}%`}>
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
                  {Math.round(data.movingAveragePrediction)}%
                </span>
                <span className="occupancy-detail">for the next hour</span>
              </div>
              <div className="gate-card">
                <span className="gate-label">Linear regression predicts</span>
                <span className="occupancy-percent level-low">
                  {Math.round(data.linearRegressionPrediction)}%
                </span>
                <span className="occupancy-detail">for the next hour</span>
              </div>
              <div className="gate-card">
                <span className="gate-label">More accurate method</span>
                <span className="occupancy-percent level-low" style={{ fontSize: 24 }}>
                  {data.moreAccurateMethod ? METHOD_LABELS[data.moreAccurateMethod] : 'Not enough data'}
                </span>
                {data.accuracy.testedPoints > 0 && (
                  <span className="occupancy-detail">
                    Avg error: MA {data.accuracy.movingAverageError.toFixed(1)}% vs LR{' '}
                    {data.accuracy.linearRegressionError.toFixed(1)}% (tested on{' '}
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
