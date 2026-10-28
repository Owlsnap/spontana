import { describe, it, expect } from 'vitest';
import {
  toDateKey,
  parseLocalDate,
  lastDay,
  isMultiDay,
  isOngoing,
  runsBetween,
  compareByNextDay,
} from './eventDates.js';

const single = { date: '2026-11-05' };
const market = { date: '2026-11-01', endDate: '2026-11-10' };

describe('date keys', () => {
  it('round-trips without drifting a day', () => {
    expect(toDateKey(parseLocalDate('2026-03-29'))).toBe('2026-03-29'); // DST switch
  });

  it('ignores a time suffix', () => {
    expect(toDateKey(parseLocalDate('2026-11-05T19:00:00'))).toBe('2026-11-05');
  });
});

describe('lastDay / isMultiDay', () => {
  it('falls back to the start date', () => {
    expect(lastDay(single)).toBe('2026-11-05');
    expect(isMultiDay(single)).toBe(false);
  });

  it('ignores an end date before the start', () => {
    expect(lastDay({ date: '2026-11-05', endDate: '2026-11-01' })).toBe('2026-11-05');
  });

  it('detects multi-day events', () => {
    expect(isMultiDay(market)).toBe(true);
  });
});

describe('isOngoing', () => {
  it('is true only after the first day and until the last', () => {
    expect(isOngoing(market, '2026-11-01')).toBe(false);
    expect(isOngoing(market, '2026-11-05')).toBe(true);
    expect(isOngoing(market, '2026-11-10')).toBe(true);
    expect(isOngoing(market, '2026-11-11')).toBe(false);
  });
});

describe('runsBetween', () => {
  it('includes events overlapping the range on either edge', () => {
    expect(runsBetween(market, '2026-11-10', '2026-11-12')).toBe(true);
    expect(runsBetween(market, '2026-10-25', '2026-11-01')).toBe(true);
    expect(runsBetween(market, '2026-11-11', '2026-11-12')).toBe(false);
  });
});

describe('compareByNextDay', () => {
  const today = '2026-11-05';

  it('puts today before later dates', () => {
    expect(compareByNextDay(market, { date: '2026-11-06' }, today)).toBeLessThan(0);
  });

  it('on the same day, puts events starting today before long-running ones', () => {
    expect(compareByNextDay(single, market, today)).toBeLessThan(0);
  });
});
