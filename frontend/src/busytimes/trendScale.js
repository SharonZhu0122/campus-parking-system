// Works out the axes for the 24-hour trend chart. The vertical axis is zoomed
// to the data, so a handful of cars arriving and leaving is visible instead of
// being a flat line near the top.
export function trendScale({ values, movingAverage, linearRegression, totalParks }) {
  const all = [...values, movingAverage, linearRegression];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = Math.max(2, (hi - lo) * 0.25);
  const yMin = Math.max(0, Math.floor(lo - pad));
  const step = Math.max(1, Math.ceil((Math.min(totalParks, Math.ceil(hi + pad)) - yMin) / 4));
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + step * i);
  return { yMin, yMax: yMin + step * 4, ticks };
}
