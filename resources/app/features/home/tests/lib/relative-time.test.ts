import { describe, expect, it, vi } from 'vitest';

import { formatTimeAgo } from '@/features/home/lib/relative-time';

vi.mock('@/wpi18n', () => ({
  __: (text: string) => text,
  sprintf: (format: string, value: number) => format.replace('%d', String(value)),
}));

const NOW = new Date('2026-06-15T12:00:00Z');

describe('formatTimeAgo', () => {
  it('says just now for less than a minute and for future times', () => {
    expect(formatTimeAgo('2026-06-15T11:59:30Z', NOW)).toBe('Just now');
    expect(formatTimeAgo('2026-06-15T12:05:00Z', NOW)).toBe('Just now');
  });

  it('uses minutes, hours and days', () => {
    expect(formatTimeAgo('2026-06-15T11:15:00Z', NOW)).toBe('45m ago');
    expect(formatTimeAgo('2026-06-15T09:00:00Z', NOW)).toBe('3h ago');
    expect(formatTimeAgo('2026-06-13T12:00:00Z', NOW)).toBe('2d ago');
  });

  it('uses months and years for older times', () => {
    expect(formatTimeAgo('2026-05-10T12:00:00Z', NOW)).toBe('1mo ago');
    expect(formatTimeAgo('2026-02-15T12:00:00Z', NOW)).toBe('4mo ago');
    expect(formatTimeAgo('2024-06-01T12:00:00Z', NOW)).toBe('2y ago');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatTimeAgo('not a date', NOW)).toBe('');
  });
});
