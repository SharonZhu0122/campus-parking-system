import { COLORS, formatHour } from './format';
import { trendScale } from './trendScale';
import { useElementSize } from './useElementSize';

const MARGIN = { top: 18, right: 70, bottom: 30, left: 46 };
const LABEL_SLOTS = [0, 6, 12, 18];

// The last 24 hours of free spaces, and the two forecasts for the next hour.
function TrendChart({ series, movingAverage, linearRegression, totalParks }) {
  const [ref, { width, height }] = useElementSize();
  const plotW = Math.max(width - MARGIN.left - MARGIN.right, 10);
  const plotH = Math.max(height - MARGIN.top - MARGIN.bottom, 10);

  const values = series.map((p) => p.available);
  const { yMin, yMax, ticks } = trendScale({ values, movingAverage, linearRegression, totalParks });
  const slots = series.length; // history points plus one predicted slot
  const last = series.length - 1;
  const x = (i) => MARGIN.left + (i * plotW) / slots;
  const y = (v) => MARGIN.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const line = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.available)}`).join(' ');

  function gridLine(tick) {
    return (
      <g key={tick}>
        <line x1={MARGIN.left} x2={MARGIN.left + plotW + 20} y1={y(tick)} y2={y(tick)} stroke="#e8e2d6" />
        <text x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="12" fill="#777">
          {tick}
        </text>
      </g>
    );
  }

  function forecastLine(value, colour) {
    return <line x1={x(last)} y1={y(values[last])} x2={x(slots)} y2={y(value)} stroke={colour} strokeWidth="2" strokeDasharray="5 4" />;
  }

  return (
    <div ref={ref} className="pred-chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Available spaces over the last 24 hours with the next-hour predictions">
          {ticks.map(gridLine)}
          <text x={4} y={12} fontSize="11" fill="#777">spaces available</text>

          {LABEL_SLOTS.map((i) => (
            <text key={i} x={x(i)} y={height - 10} textAnchor="middle" fontSize="12" fill="#777">
              {formatHour(series[i].time)}
            </text>
          ))}
          <text x={x(last)} y={height - 10} textAnchor="middle" fontSize="12" fill="#333" fontWeight="700">now</text>
          <text x={x(slots)} y={height - 10} textAnchor="middle" fontSize="12" fill="#333" fontWeight="700">+1 hour</text>
          <line x1={x(slots)} x2={x(slots)} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="#d8d0c0" strokeDasharray="3 4" />

          <path d={line} fill="none" stroke={COLORS.history} strokeWidth="2.5" strokeLinejoin="round" />
          {series.map((p, i) => (
            <circle key={p.time} cx={x(i)} cy={y(p.available)} r={i === last ? 5 : 3} fill={COLORS.history}>
              <title>{`${formatHour(p.time)}: ${p.available} spaces available`}</title>
            </circle>
          ))}

          {forecastLine(movingAverage, COLORS.movingAverage)}
          {forecastLine(linearRegression, COLORS.linearRegression)}
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

export default TrendChart;
