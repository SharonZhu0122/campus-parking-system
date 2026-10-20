import TrendChart from './TrendChart';
import { COLORS, METHOD_LABELS, occupancyLevel } from './format';

function ForecastCard({ label, marker, value, note, level = 'low' }) {
  return (
    <div className="gate-card">
      <span className="gate-label">
        {marker}
        {label}
      </span>
      <span className={`occupancy-percent level-${level}`}>{value}</span>
      <span className="pred-note">{note}</span>
    </div>
  );
}

// Which method was closer on the backtest, and by how much.
function AccuracyCard({ best, accuracy }) {
  return (
    <div className="gate-card">
      <span className="gate-label">More accurate</span>
      <span className="pred-winner">{best ? METHOD_LABELS[best] : 'Not enough data'}</span>
      {accuracy.testedPoints > 0 && (
        <span className="pred-note">
          Tested on the past {accuracy.testedPoints} hours: moving average was off by{' '}
          {accuracy.movingAverageError.toFixed(1)}, linear regression by {accuracy.linearRegressionError.toFixed(1)}{' '}
          spaces on average.
        </span>
      )}
    </div>
  );
}

function Legend() {
  return (
    <p className="pred-legend">
      <span><i className="pred-dot" style={{ background: COLORS.history }} />Spaces available, last 24 hours</span>
      <span><i className="pred-dot pred-dot-diamond" style={{ background: COLORS.movingAverage }} />Moving average, next hour</span>
      <span><i className="pred-dot" style={{ background: COLORS.linearRegression }} />Linear regression, next hour</span>
    </p>
  );
}

// The collapsed section for people who want to see how the forecast works.
function ForecastDetails({ data }) {
  const current = data.series[data.series.length - 1];

  return (
    <details className="pred-advanced">
      <summary>How is this worked out? Next-hour forecast</summary>
      <p className="pred-explain">
        The bars show the usual number of cars at each hour. They come from the same rules that create the simulated
        cars: weekdays between 8:30am and 4:30pm are the busiest, evenings and weekends are quiet. &quot;Right
        now&quot; compares the real number of cars with that usual pattern. The forecast below looks only at the last
        24 hours and guesses the next hour with two simple methods; a backtest on the past hours picks the more
        accurate one.
      </p>
      <div className="pred-cards">
        <ForecastCard
          label="Right now"
          value={current.available}
          note={`spaces available, out of ${data.totalParks}`}
          level={occupancyLevel(current.occupancyPercent)}
        />
        <ForecastCard
          label="Moving average"
          marker={<i className="pred-dot pred-dot-diamond" style={{ background: COLORS.movingAverage }} />}
          value={Math.round(data.movingAveragePrediction)}
          note="Average of the last 3 hours. A steady, cautious guess."
        />
        <ForecastCard
          label="Linear regression"
          marker={<i className="pred-dot" style={{ background: COLORS.linearRegression }} />}
          value={Math.round(data.linearRegressionPrediction)}
          note="Continues the last 3 hours' trend. Reacts faster to a rise or fall."
        />
        <AccuracyCard best={data.moreAccurateMethod} accuracy={data.accuracy} />
      </div>
      <div className="pred-chart-wrap">
        <TrendChart
          series={data.series}
          movingAverage={data.movingAveragePrediction}
          linearRegression={data.linearRegressionPrediction}
          totalParks={data.totalParks}
        />
        <Legend />
      </div>
    </details>
  );
}

export default ForecastDetails;
