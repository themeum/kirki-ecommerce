import { describe, expect, it } from 'vitest';

import { DATE_FORMATS, formatDateValue, parseDateValue } from '@/libs/date';

describe('parseDateValue', () => {
  it('parses a yyyy-MM-dd string', () => {
    const parsed = parseDateValue('2026-06-03');

    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(5);
    expect(parsed?.getDate()).toBe(3);
  });

  it('returns null for an unparseable string', () => {
    expect(parseDateValue('not-a-date')).toBeNull();
    expect(parseDateValue('2026-13-45')).toBeNull();
  });

  it('returns null for nullish input', () => {
    expect(parseDateValue(null)).toBeNull();
    expect(parseDateValue(undefined)).toBeNull();
    expect(parseDateValue('')).toBeNull();
  });

  it('parses with a non-default pattern', () => {
    const time = parseDateValue('14:30', DATE_FORMATS.TIME_INPUT);

    expect(time?.getHours()).toBe(14);
    expect(time?.getMinutes()).toBe(30);

    const dateTime = parseDateValue(
      '2026-06-03 14:30',
      DATE_FORMATS.DATE_TIME_INPUT,
    );

    expect(dateTime?.getDate()).toBe(3);
    expect(dateTime?.getHours()).toBe(14);
  });
});

describe('formatDateValue', () => {
  it('formats a date with the default pattern', () => {
    expect(formatDateValue(new Date(2026, 5, 3))).toBe('2026-06-03');
  });

  it('returns null for nullish or invalid dates', () => {
    expect(formatDateValue(null)).toBeNull();
    expect(formatDateValue(undefined)).toBeNull();
    expect(formatDateValue(new Date('nope'))).toBeNull();
  });

  it('formats with a non-default pattern', () => {
    const date = new Date(2026, 5, 3, 14, 30);

    expect(formatDateValue(date, DATE_FORMATS.TIME_INPUT)).toBe('14:30');
    expect(formatDateValue(date, DATE_FORMATS.DATE_TIME_INPUT)).toBe(
      '2026-06-03 14:30',
    );
  });
});

describe('parseDateValue and formatDateValue round trip', () => {
  it('returns the original string for each supported pattern', () => {
    const cases = [
      ['2026-06-03', DATE_FORMATS.DATE_INPUT],
      ['14:30', DATE_FORMATS.TIME_INPUT],
      ['2026-06-03 14:30', DATE_FORMATS.DATE_TIME_INPUT],
    ] as const;

    for (const [value, pattern] of cases) {
      expect(formatDateValue(parseDateValue(value, pattern), pattern)).toBe(
        value,
      );
    }
  });
});
