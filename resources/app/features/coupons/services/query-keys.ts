import type { CouponListFilter } from '@/features/coupons/types';
import type { ListParams } from '@/types/list-state';

const couponKeys = {
  all: ['Coupons'] as const,
  lists: () => [...couponKeys.all, 'list'] as const,
  list: (params?: ListParams<CouponListFilter>) => [...couponKeys.lists(), params] as const,
  details: () => [...couponKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...couponKeys.details(), String(id)] as const,
  validate: (code: string) => [...couponKeys.all, 'validate', code] as const,
  newCode: () => [...couponKeys.all, 'new-code'] as const,
};

export { couponKeys };
