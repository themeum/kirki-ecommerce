import type { DayRange } from '@/features/analytics/lib/date-range';
import type { AnalyticsCards } from '@/features/analytics/schemas/catalog/analytics';

type CardProps<Key extends keyof AnalyticsCards> = {
  data: AnalyticsCards[Key];
  isEmpty: boolean;
  formatMinor: (minorAmount: number) => string;
  formatMinorShort: (minorAmount: number) => string;
  range: DayRange | null;
  compareRange: DayRange | null;
};

export type { CardProps };
