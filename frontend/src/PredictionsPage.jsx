import { useCallback, useEffect, useRef, useState } from 'react';
import { getGates, getPredictions } from './api';
import BrandMark from './BrandMark';

const METHOD_LABELS = {
  moving_average: 'Moving average',
  linear_regression: 'Linear regression',
};

const COLORS = {
  history: '#32373d',
  movingAverage: '#faa61a',
  linearRegression: '#aa0000',
};

function occupancyLevel(percent) {
  if (percent >= 90) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}

function formatHour(time) {
  return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Zooms the vertical axis to the data, so a handful of cars arriving and
// leaving is visible instead of being a flat line near the top.
function TrendChart({ series, movingAverage, linearRegression, totalParks }) {
  const [ref, { width, height }] = useElementSize();
  const margin = { top: 18, right: 70, bottom: 30, left: 46 };
  const plotW = Math.max(width - margin.left - margin.right, 10);
  const plotH = Math.max(height - margin.top - margin.bottom, 10);

  const values = series.map((p) => p.available);
  const all = [...values, movingAverage, linearRegression];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = Math.max(2, (hi - lo) * 0.25);
  const yMin = Math.max(0, Math.floor(lo - pad));
  const step = Math.max(1, Math.ceil((Math.min(totalParks, Math.ceil(hi + pad)) - yMin) / 4));
  const yMax = yMin + step * 4;

  const slots = series.length; // history points plus one predicted slot
  const x = (i) => margin.left + (i * plotW) / slots;
  const y = (v) => margin.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + step * i);
  const labelAt = [0, 6, 12, 18];

  const line = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.available)}`).join(' ');
  const last = series.length - 1;

  return (
    <div ref={ref} className="pred-chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Available spaces over the last 24 hours with the next-hour predictions">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={margin.left} x2={margin.left + plotW + 20} y1={y(t)} y2={y(t)} stroke="#e8e2d6" />
              <text x={margin.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#777">
                {t}
              </text>
            </g>
          ))}
          <text x={4} y={12} fontSize="11" fill="#777">
            spaces available
          </text>

          {labelAt.map((i) => (
            <text key={i} x={x(i)} y={height - 10} textAnchor="middle" fontSize="12" fill="#777">
              {formatHour(series[i].time)}
            </text>
          ))}
          <text x={x(last)} y={height - 10} textAnchor="middle" fontSize="12" fill="#333" fontWeight="700">
            now
          </text>
          <text x={x(slots)} y={height - 10} textAnchor="middle" fontSize="12" fill="#333" fontWeight="700">
            +1 hour
          </text>

          <line x1={x(slots)} x2={x(slots)} y1={margin.top} y2={margin.top + plotH} stroke="#d8d0c0" strokeDasharray="3 4" />

          <path d={line} fill="none" stroke={COLORS.history} strokeWidth="2.5" strokeLinejoin="round" />
          {series.map((p, i) => (
            <circle key={p.time} cx={x(i)} cy={y(p.available)} r={i === last ? 5 : 3} fill={COLORS.history}>
              <title>{`${formatHour(p.time)}: ${p.available} spaces available`}</title>
            </circle>
          ))}

          <line x1={x(last)} y1={y(values[last])} x2={x(slots)} y2={y(movingAverage)} stroke={COLORS.movingAverage} strokeWidth="2" strokeDasharray="5 4" />
          <line x1={x(last)} y1={y(values[last])} x2={x(slots)} y2={y(linearRegression)} stroke={COLORS.linearRegression} strokeWidth="2" strokeDasharray="5 4" />

          <rect
            x={x(slots) - 6}
            y={y(movingAverage) - 6}
            width="12"
            height="12"
            transform={`rotate(45 ${x(slots)} ${y(movingAverage)})`}
            fill={COLORS.movingAverage}
          >
            <title>{`Moving average: ${Math.round(movingAverage)} spaces`}</title>
          </rect>
          <circle cx={x(slots)} cy={y(linearRegression)} r="6" fill={COLORS.linearRegression}>
            <title>{`Linear regression: ${Math.round(linearRegression)} spaces`}</title>
          </circle>
          <text x={x(slots) + 14} y={y(movingAverage) + (movingAverage >= linearRegression ? -4 : 14)} fontSize="12" fontWeight="700" fill="#b67700">
            {Math.round(movingAverage)}
          </text>
          <text x={x(slots) + 14} y={y(linearRegression) + (linearRegression > movingAverage ? -4 : 14)} fontSize="12" fontWeight="700" fill={COLORS.linearRegression}>
            {Math.round(linearRegression)}
          </text>
        </svg>
      )}
    </div>
  );
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
  const accuracy = data?.accuracy;
  const best = data?.moreAccurateMethod;
  const bestPrediction =
    best === 'linear_regression' ? data?.linearRegressionPrediction : data?.movingAveragePrediction;
  const bestError =
    best === 'linear_regression' ? accuracy?.linearRegressionError : accuracy?.movingAverageError;

  return (
    <div className="occupancy-page predictions-fit">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          <button type="button" className="top-bar-link" onClick={onBack}>
            Back to occupancy
          </button>
        </div>
      </header>

      <main className="page-content admin-content">
        <div className="pred-toolbar">
          <div className="pred-heading">
            <h1>Predictions</h1>
            {data && best ? (
              <p className="subtitle">
                Best estimate for {data.gateName} next hour: about{' '}
                <strong>{Math.round(bestPrediction)}</strong> spaces free
                {bestError != null && <> (usually within {bestError.toFixed(1)} spaces)</>}.
              </p>
            ) : (
              <p className="subtitle">Predicted available spaces for the next hour.</p>
            )}
          </div>
          <div className="pred-controls">
            <div className="field">
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
            <button type="button" className="link-button" onClick={loadPredictions} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            {lastUpdated && <span className="pred-updated">Updated {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        {data && (
          <>
            <div className="pred-cards">
              <div className="gate-card">
                <span className="gate-label">Right now</span>
                <span className={`occupancy-percent level-${currentLevel}`}>{currentPoint.available}</span>
                <span className="pred-note">spaces available, out of {data.totalParks}</span>
              </div>

              <div className="gate-card">
                <span className="gate-label">
                  <i className="pred-dot pred-dot-diamond" style={{ background: COLORS.movingAverage }} />
                  Moving average
                </span>
                <span className="occupancy-percent level-low">{Math.round(data.movingAveragePrediction)}</span>
                <span className="pred-note">Average of the last 3 hours. A steady, cautious guess.</span>
              </div>

              <div className="gate-card">
                <span className="gate-label">
                  <i className="pred-dot" style={{ background: COLORS.linearRegression }} />
                  Linear regression
                </span>
                <span className="occupancy-percent level-low">{Math.round(data.linearRegressionPrediction)}</span>
                <span className="pred-note">Continues the last 3 hours&apos; trend. Reacts faster to a rise or fall.</span>
              </div>

              <div className="gate-card">
                <span className="gate-label">More accurate</span>
                <span className="pred-winner">{best ? METHOD_LABELS[best] : 'Not enough data'}</span>
                {accuracy.testedPoints > 0 && (
                  <span className="pred-note">
                    Tested on the past {accuracy.testedPoints} hours: moving average was off by{' '}
                    {accuracy.movingAverageError.toFixed(1)}, linear regression by{' '}
                    {accuracy.linearRegressionError.toFixed(1)} spaces on average.
                  </span>
                )}
              </div>
            </div>

            <div className="pred-chart-wrap">
              <TrendChart
                series={data.series}
                movingAverage={data.movingAveragePrediction}
                linearRegression={data.linearRegressionPrediction}
                totalParks={data.totalParks}
              />
              <p className="pred-legend">
                <span><i className="pred-dot" style={{ background: COLORS.history }} />Spaces available, last 24 hours</span>
                <span><i className="pred-dot pred-dot-diamond" style={{ background: COLORS.movingAverage }} />Moving average, next hour</span>
                <span><i className="pred-dot" style={{ background: COLORS.linearRegression }} />Linear regression, next hour</span>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default PredictionsPage;
