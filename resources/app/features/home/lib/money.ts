import type { DashboardMoney } from '@/features/home/schemas/catalog/dashboard-overview';

type ShortMoney = {
  text: string;
  title?: string;
};

export const shortMoney = (money: DashboardMoney): ShortMoney =>
  money.short_display === money.display
    ? { text: money.short_display }
    : { text: money.short_display, title: money.display };
