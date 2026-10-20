import { busyWord, formatClock } from './format';
import { useElementSize } from './useElementSize';

const HEIGHT = 190;
const MARGIN = { top: 14, right: 8, bottom: 28, left: 8 };
const LABEL_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

// Bars in the style of "popular times": one per hour, tallest = the busiest
// hour of the week. The current hour is red when today's chart is showing.
function TypicalChart({ hours, currentHour }) {
  const [ref, { width }] = useElementSize();
  const plotW = Math.max(width - MARGIN.left - MARGIN.right, 10);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = plotW / 24;
  const barW = slot * 0.7;

  function bar(h) {
    const barH = Math.max(3, h.relative * plotH);
    const isNow = h.hour === currentHour;
    return (
      <rect
        key={h.hour}
        x={MARGIN.left + h.hour * slot + (slot - barW) / 2}
        y={MARGIN.top + plotH - barH}
        width={barW}
        height={barH}
        rx="2"
        fill={isNow ? '#aa0000' : '#faa61a'}
      >
        <title>{`${formatClock(h.hour)}: usually ${busyWord(h.relative).toLowerCase()}${isNow ? ' (now)' : ''}`}</title>
      </rect>
    );
  }

  return (
    <div ref={ref} className="busy-chart">
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label="How busy this car park usually is at each hour">
          <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH} stroke="#d8d0c0" />
          {hours.map(bar)}
          {LABEL_HOURS.map((hour) => (
            <text key={hour} x={MARGIN.left + hour * slot + slot / 2} y={HEIGHT - 8} textAnchor="middle" fontSize="12" fill="#777">
              {formatClock(hour)}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

export default TypicalChart;
