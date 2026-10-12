const { idsToDrop } = require('./violationHousekeeping');

test('keeps the newest ones and drops the rest', () => {
  const newestFirst = [{ id: 9 }, { id: 8 }, { id: 7 }, { id: 6 }, { id: 5 }];
  expect(idsToDrop(newestFirst, 3)).toEqual([6, 5]);
});

test('drops nothing when there are no more than the limit', () => {
  expect(idsToDrop([{ id: 2 }, { id: 1 }], 20)).toEqual([]);
  expect(idsToDrop([], 20)).toEqual([]);
});
