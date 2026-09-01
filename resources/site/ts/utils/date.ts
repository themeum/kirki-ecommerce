export type DateFormatMode = 'date' | 'time' | 'datetime';

/**
 * Parses a UTC date value (ISO 8601 string, MySQL datetime, timestamp, or Date)
 * into a valid JavaScript Date object in UTC.
 */
export function parseUtcDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value !== 'string') {
    return null;
  }

  const str = value.trim();
  if (!str) {
    return null;
  }

  // Already ISO with explicit Z or timezone offset (+/-HH:MM)
  if (str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Normalize MySQL format 'YYYY-MM-DD HH:MM:SS' or ISO without timezone to UTC
  const iso = str.includes('T') ? `${str}Z` : `${str.replace(' ', 'T')}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date object using browser's Intl.DateTimeFormat in the user's local timezone.
 */
export function formatLocalDate(date: Date, mode: DateFormatMode = 'datetime'): string {
  const locale = typeof navigator !== 'undefined' ? navigator.language : undefined;

  switch (mode) {
    case 'date':
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);

    case 'time':
      return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);

    case 'datetime':
    default:
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
  }
}
