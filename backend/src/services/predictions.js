function movingAverage(series, window) {
  const slice = series.slice(-window);
  const sum = slice.reduce((total, value) => total + value, 0);
  return sum / slice.length;
}

function linearRegressionPredictNext(series) {
  const n = series.length;
  const xValues = series.map((_, index) => index);
  const meanX = xValues.reduce((sum, x) => sum + x, 0) / n;
  const meanY = series.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - meanX) * (series[i] - meanY);
    denominator += (xValues[i] - meanX) ** 2;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  const nextX = n;
  return slope * nextX + intercept;
}

function backtestAccuracy(series, windowSize) {
  let movingAverageErrorTotal = 0;
  let linearRegressionErrorTotal = 0;
  let testedPoints = 0;

  for (let i = windowSize; i < series.length; i++) {
    const history = series.slice(0, i);
    const actual = series[i];

    const maPrediction = movingAverage(history, windowSize);
    const lrPrediction = linearRegressionPredictNext(history.slice(-windowSize));

    movingAverageErrorTotal += Math.abs(actual - maPrediction);
    linearRegressionErrorTotal += Math.abs(actual - lrPrediction);
    testedPoints += 1;
  }

  if (testedPoints === 0) {
    return { movingAverageError: null, linearRegressionError: null, testedPoints: 0 };
  }

  return {
    movingAverageError: movingAverageErrorTotal / testedPoints,
    linearRegressionError: linearRegressionErrorTotal / testedPoints,
    testedPoints,
  };
}

module.exports = { movingAverage, linearRegressionPredictNext, backtestAccuracy };
