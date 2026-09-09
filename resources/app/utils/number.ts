import { isDefined } from '@/utils/object';

export const clampValue = (value: number, min?: number | null, max?: number | null): number => {
  if (!isDefined(value)) {
    return value;
  }

  if (isDefined(min) && value < min) {
    return min;
  }

  if (isDefined(max) && value > max) {
    return max;
  }

  return value;
};
