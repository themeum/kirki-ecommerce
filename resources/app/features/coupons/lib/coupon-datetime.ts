import { format } from 'date-fns';

import { DATE_FORMATS } from '@/libs/date';

const splitIsoDateTime = (iso?: string | null): { date: string; time: string } => {
  if (!iso) {
    return { date: '', time: '' };
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }

  return {
    date: format(parsed, DATE_FORMATS.DATE_INPUT),
    time: format(parsed, DATE_FORMATS.TIME_INPUT),
  };
};

const mergeDateTime = (date: string, time: string): Date | null => {
  if (!date || !time) {
    return null;
  }

  const merged = new Date(`${date}T${time}`);

  return Number.isNaN(merged.getTime()) ? null : merged;
};

export { mergeDateTime, splitIsoDateTime };
