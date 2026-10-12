import { useCallback, useEffect, useRef, useState } from 'react';
import { getBusyness, getGates, getPredictions } from './api';
import BrandMark from './BrandMark';
import KeyDateBanner from './KeyDateBanner';

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


const DAYS = [
  { weekday: 1, short: 'Mon', long: 'Monday' },
  { weekday: 2, short: 'Tue', long: 'Tuesday' },
  { weekday: 3, short: 'Wed', long: 'Wednesday' },
  { weekday: 4, short: 'Thu', long: 'Thursday' },
  { weekday: 5, short: 'Fri', long: 'Friday' },
  { weekday: 6, short: 'Sat', long: 'Saturday' },
  { weekday: 0, short: 'Sun', long: 'Sunday' },
];

const STATUS_TEXT = {
  plenty: 'Plenty of space',
  getting_busy: 'Getting busy',
  almost_full: 'Almost full',
};

function formatClock(hour) {
  const h = hour % 24;
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 === 0 ? 12 : h % 12}${suffix}`;
}

function busyWord(relative) {
  if (relative >= 0.7) return 'Busy';
  if (relative >= 0.3) return 'Moderate';
  return 'Quiet';
}

// Only worth saying when something is out of the ordinary.
const COMPARE_TEXT = {
  busier: 'Busier than usual',
  quieter: 'Quieter than usual',
};

const NEXT_HOUR = {
  busier: { arrow: '\u2197', text: 'Getting busier' },
  quieter: { arrow: '\u2198', text: 'Getting quieter' },
};

function adviceFor(hours) {
  const peak = Math.max(...hours.map((h) => h.relative));
  if (peak < 0.3) return 'Quiet all day.';
  const busy = hours.filter((h) => h.relative >= peak * 0.85).map((h) => h.hour);
  return `Usually busiest from ${formatClock(Math.min(...busy))} to ${formatClock(Math.max(...busy) + 1)}.`;
}

// Bars in the style of "popular times": one per hour, tallest = the busiest
// hour of the week. The current hour is red when today's chart is showing.
function TypicalChart({ hours, currentHour }) {
  const [ref, { width }] = useElementSize();
  const height = 190;
  const margin = { top: 14, right: 8, bottom: 28, left: 8 };
  const plotW = Math.max(width - margin.left - margin.right, 10);
  const plotH = height - margin.top - margin.bottom;
  const slot = plotW / 24;
  const barW = slot * 0.7;

  return (
    <div ref={ref} className="busy-chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="How busy this car park usually is at each hour">
          <line x1={margin.left} x2={margin.left + plotW} y1={margin.top + plotH} y2={margin.top + plotH} stroke="#d8d0c0" />
          {hours.map((h) => {
            const barH = Math.max(3, h.relative * plotH);
            const isNow = h.hour === currentHour;
            return (
              <rect
                key={h.hour}
                x={margin.left + h.hour * slot + (slot - barW) / 2}
                y={margin.top + plotH - barH}
                width={barW}
                height={barH}
                rx="2"
                fill={isNow ? '#aa0000' : '#faa61a'}
              >
                <title>{`${formatClock(h.hour)}: usually ${busyWord(h.relative).toLowerCase()}${isNow ? ' (now)' : ''}`}</title>
              </rect>
            );
          })}
          {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
            <text key={hour} x={margin.left + hour * slot + slot / 2} y={height - 8} textAnchor="middle" fontSize="12" fill="#777">
              {formatClock(hour)}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

function PredictionsPage({ onBack, backLabel = 'Back to occupancy' }) {
  const [gates, setGates] = useState([]);
  const [selectedGateId, setSelectedGateId] = useState('');
  const [busy, setBusy] = useState(null);
  const [data, setData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
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

  const load = useCallback(() => {
    if (!selectedGateId) return;
    setLoading(true);
    Promise.all([getBusyness(selectedGateId), getPredictions(selectedGateId)])
      .then(([busyResult, predictionResult]) => {
        setBusy(busyResult);
        setData(predictionResult);
        setSelectedDay((day) => (day === null ? busyResult.now.weekday : day));
        setLastUpdated(new Date());
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedGateId]);

  useEffect(() => {
    load();
  }, [load]);

  const now = busy?.now;
  const dayHours = busy && selectedDay !== null ? busy.typicalWeek.find((d) => d.weekday === selectedDay).hours : [];
  const showingToday = now && selectedDay === now.weekday;

  const currentPoint = data ? data.series[data.series.length - 1] : null;
  const currentLevel = currentPoint ? occupancyLevel(currentPoint.occupancyPercent) : 'low';
  const accuracy = data?.accuracy;
  const best = data?.moreAccurateMethod;

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <BrandMark />
          <button type="button" className="top-bar-link" onClick={onBack}>
            {backLabel}
          </button>
        </div>
      </header>

      <main className="page-content admin-content">
        <div className="pred-toolbar">
          <div className="pred-heading">
            <h1>Busy times</h1>
            <p className="subtitle">How full each car park is now, and when it is usually busy.</p>
          </div>
          <div className="pred-controls">
            <div className="field">
              <label htmlFor="gate-select">Gate</label>
              <select
                id="gate-select"
                value={selectedGateId}
                onChange={(e) => {
                  setSelectedGateId(e.target.value);
                  setSelectedDay(null);
                }}
              >
                {gates.map((gate) => (
                  <option key={gate.id} value={gate.id}>
                    {gate.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="link-button" onClick={load} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            {lastUpdated && <span className="pred-updated">Updated {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        <KeyDateBanner />

        {busy && (
          <div className="busy-grid">
            <section className="busy-now" aria-label="Right now">
              <span className="gate-label">{busy.gateName} right now</span>
              <span className={`busy-status status-${now.status}`}>{STATUS_TEXT[now.status]}</span>
              <span className={`occupancy-percent level-${occupancyLevel(now.occupancyPercent)}`}>{now.available}</span>
              <span className="pred-note">spaces free out of {busy.totalParks}</span>
              {(COMPARE_TEXT[now.comparison] || NEXT_HOUR[now.nextHour]) && (
                <p className="busy-notes">
                  {COMPARE_TEXT[now.comparison] && <span>{COMPARE_TEXT[now.comparison]}</span>}
                  {NEXT_HOUR[now.nextHour] && (
                    <span>
                      <span className="busy-arrow" aria-hidden="true">{NEXT_HOUR[now.nextHour].arrow}</span>
                      {NEXT_HOUR[now.nextHour].text}
                    </span>
                  )}
                </p>
              )}
            </section>

            <section className="busy-chart-card" aria-label="Usual busy times">
              <div className="busy-chart-head">
                <h2>Usually busy at</h2>
                <div className="busy-days" role="tablist">
                  {DAYS.map((d) => (
                    <button
                      key={d.weekday}
                      type="button"
                      role="tab"
                      aria-selected={selectedDay === d.weekday}
                      className={`busy-day${selectedDay === d.weekday ? ' active' : ''}`}
                      onClick={() => setSelectedDay(d.weekday)}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </div>
              <TypicalChart hours={dayHours} currentHour={showingToday ? now.hour : -1} />
              <p className="busy-advice">
                {adviceFor(dayHours)}
                {showingToday && <span className="busy-now-key"><i /> Now</span>}
              </p>
              <p className="busy-source">Typical pattern from simulated data. Times are New Zealand time.</p>
            </section>
          </div>
        )}

        {data && (
          <details className="pred-advanced">
            <summary>How is this worked out? Next-hour forecast</summary>
            <p className="pred-explain">
              The bars show the usual number of cars at each hour. They come from the same rules that create the
              simulated cars: weekdays between 8:30am and 4:30pm are the busiest, evenings and weekends are quiet.
              &quot;Right now&quot; compares the real number of cars with that usual pattern. The forecast below
              looks only at the last 24 hours and guesses the next hour with two simple methods; a backtest on the
              past hours picks the more accurate one.
            </p>
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
          </details>
        )}
      </main>
    </div>
  );
}

export default PredictionsPage;
