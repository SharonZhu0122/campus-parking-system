const { movingAverage, linearRegressionPredictNext, backtestAccuracy } = require('./predictions');

test('moving average is the mean of the last N points', () => {
  expect(movingAverage([10, 20, 30], 3)).toBe(20);
  expect(movingAverage([10, 20, 30, 40], 2)).toBe(35);
});

test('linear regression predicts the next point on a straight trend', () => {
  const result = linearRegressionPredictNext([10, 20, 30]);
  expect(result).toBeCloseTo(40, 5);
});

test('linear regression predicts flat trend correctly', () => {
  const result = linearRegressionPredictNext([50, 50, 50]);
  expect(result).toBeCloseTo(50, 5);
});

test('backtest reports lower error for linear regression on a straight trend', () => {
  const series = [10, 20, 30, 40, 50, 60, 70, 80];
  const result = backtestAccuracy(series, 3);
  expect(result.testedPoints).toBe(series.length - 3);
  expect(result.linearRegressionError).toBeLessThan(result.movingAverageError);
});
