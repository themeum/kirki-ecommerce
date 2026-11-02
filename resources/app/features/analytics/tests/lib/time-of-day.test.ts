import { describe, expect, it } from 'vitest';

import {
  dotScale,
  formatHour,
  formatHourSpan,
  summarizeTimeOfDay,
} from '@/features/analytics/lib/time-of-day';

const grid = (cells: [number, number, number][]) => {
  const counts = Array.from({ length: 7 }, () => Array<number>(24).fill(0));

  cells.forEach(([day, hour, count]) => {
    counts[day][hour] = count;
  });

  return counts;
};

describe('summarizeTimeOfDay', () => {
  it('finds the busiest hour, the busiest day and the share from the busiest hour on', () => {
    const summary = summarizeTimeOfDay(
      grid([
        [0, 20, 1],
        [1, 9, 3],
        [1, 10, 3],
        [4, 18, 5],
      ]),
    );

    expect(summary).toMatchObject({
      busiestHourDay: 4,
      busiestHour: 18,
      busiestDay: 1,
      total: 12,
      afterPercent: 50,
    });
    expect(summary.dayTotals).toEqual([1, 6, 0, 0, 5, 0, 0]);
  });

  it('gives the busiest hour to the earlier weekday, then the earlier hour, on a tie', () => {
    const summary = summarizeTimeOfDay(
      grid([
        [2, 9, 7],
        [0, 14, 7],
        [0, 15, 7],
      ]),
    );

    expect(summary.busiestHourDay).toBe(0);
    expect(summary.busiestHour).toBe(14);
  });

  it('gives the busiest day to the earlier weekday on a tie', () => {
    expect(
      summarizeTimeOfDay(
        grid([
          [5, 1, 4],
          [3, 2, 4],
        ]),
      ).busiestDay,
    ).toBe(3);
  });

  it('gives a zero share when there are no orders', () => {
    expect(summarizeTimeOfDay(grid([]))).toMatchObject({ total: 0, afterPercent: 0 });
  });
});

describe('dotScale', () => {
  it('grows the dot area with the value', () => {
    expect(dotScale(25, 100)).toBe(0.5);
    expect(dotScale(-100, 100)).toBe(1);
  });

  it('is zero when the largest value is zero', () => {
    expect(dotScale(0, 0)).toBe(0);
  });
});

describe('formatHourSpan', () => {
  it('formats the hours with am and pm', () => {
    expect(formatHour(0)).toBe('12am');
    expect(formatHour(12)).toBe('12pm');
    expect(formatHourSpan(18)).toBe('6pm–7pm');
  });

  it('ends the last hour at midnight', () => {
    expect(formatHourSpan(23)).toBe('11pm–12am');
  });
});
