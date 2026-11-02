import { describe, expect, it } from 'vitest';

import {
  colorShare,
  formatMetric,
  locationColor,
  locationExtremes,
  topLocations,
} from '@/features/analytics/lib/location';

import { country, locationRow } from '../fixtures';

const rows = [
  country('AU', '036', 'Australia', locationRow(500, 4, 1)),
  country('BD', '050', 'Bangladesh', locationRow(100, 1, 1)),
  country('CA', '124', 'Canada', locationRow(300, 4, 2)),
  country('DE', '276', 'Germany', locationRow(0, 1, 0)),
  country('FR', '250', 'France', locationRow(200, 2, 1)),
  country('IN', '356', 'India', locationRow(400, 3, 1)),
  country('US', '840', 'United States', locationRow(900, 9, 5)),
];

describe('colorShare', () => {
  it('goes from 0 at the lowest value to 1 at the highest value by the square root', () => {
    expect(colorShare(100, 100, 500)).toBe(0);
    expect(colorShare(500, 100, 500)).toBe(1);
    expect(colorShare(200, 100, 500)).toBe(0.5);
  });

  it('is 1 when all the values are the same', () => {
    expect(colorShare(7, 7, 7)).toBe(1);
  });
});

describe('locationColor', () => {
  it('mixes the dark map purple into the light map purple', () => {
    expect(locationColor(200, 100, 500)).toMatch(/^color-mix\(in srgb, .+ 50%, .+\)$/);
  });
});

describe('topLocations', () => {
  it('gives the 5 highest values of the metric, highest first', () => {
    expect(topLocations(rows, 'sales').map((row) => row.code)).toEqual([
      'US',
      'AU',
      'IN',
      'CA',
      'FR',
    ]);
  });

  it('breaks a tie by the name and leaves out locations with no value', () => {
    expect(topLocations(rows, 'customers').map((row) => row.code)).toEqual([
      'US',
      'CA',
      'AU',
      'BD',
      'FR',
    ]);
    expect(topLocations([rows[3]], 'sales')).toEqual([]);
  });
});

describe('locationExtremes', () => {
  it('gives the rows with the lowest and the highest value above zero', () => {
    const extremes = locationExtremes(rows, 'sales');

    expect(extremes?.min.code).toBe('BD');
    expect(extremes?.max.code).toBe('US');
    expect(locationExtremes([rows[3]], 'sales')).toBeNull();
  });
});

describe('formatMetric', () => {
  it('formats sales as money and the counts as numbers', () => {
    const row = locationRow(1991357, 1200, 207);

    expect(formatMetric(row, 'sales', 'long')).toEqual({ text: '$19913.57', title: undefined });
    expect(formatMetric(row, 'orders', 'long')).toEqual({ text: '1,200' });
  });

  it('formats sales in short form with the long amount as the title', () => {
    const row = locationRow(1991357, 1200, 207);

    expect(formatMetric(row, 'sales', 'short')).toEqual({ text: '$19.9K', title: '$19913.57' });
    expect(formatMetric(row, 'orders', 'short')).toEqual({ text: '1,200' });
  });
});
